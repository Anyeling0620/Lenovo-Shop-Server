import { HTTPException } from 'hono/http-exception';
import { db } from '../../utils/db';
import { ProductType, ProductCardItem, ProductCardQuery, SingleProductCardResponse, CouponItem,  ProductCardNewResponse, ProductCardIndexResponse, ProductGroup, CarouseProduct, SeckillRoundListResponse, SearchFiltersType } from '../../types/client/product.type';
import { ProductConfig, ShelfProduct, Product, CategoryStatus, ShelfProductStatus, SeckillRoundStatus, SeckillProductConfigStatus, ProductConfigStatus, ProductStatus } from '@prisma/client';
import { log } from 'console';

/**
 * 根据品类编码获取商品卡片数据（无分页，返回所有满足条件的商品）
 * 核心逻辑：仅展示上架数量>0的商品配置（shelfNum>0）
 * @param query 查询参数（仅品类编码）
 * @returns 单品类商品卡片数据
 */
export async function getProductCardByCategoryService(query: ProductCardQuery): Promise<SingleProductCardResponse> {
  const { categoryCode, userId } = query;

  // 验证品类编码是否合法
  if (!Object.values(ProductType).includes(categoryCode)) {
    throw new HTTPException(400, { message: `不支持的品类编码：${categoryCode}` });
  }


  // 1. 查询对应品类的分类ID（通过品类编码找Category）
  const category = await db.category.findFirst({
    where: {
      code: categoryCode,
      status: CategoryStatus.启用 // 只查启用的品类
    },
    select: {
      id: true
    }
  });


  if (!category) {
    return { items: [] }; // 品类不存在，返回空数据
  }

  // 2. 查询该品类下的货架商品（关联商品、配置、上架数量）
  const shelfProducts = await db.shelfProduct.findMany({
    where: {
      categoryId: category.id,
      status: ShelfProductStatus.在售 || ShelfProductStatus.售罄, // 只查在售的货架商品
    },
    include: {
      // 关联商品基本信息
      product: {
        include: {
          configs: true // 关联商品配置（后续筛选最低价格）
        }
      },
      // 关联上架商品数量（筛选shelfNum>0的配置）
      items: {
        where: {
          shelfNum: { gt: 0 } // 只查上架数量>0的配置
        },
        include: {
          config: true // 关联商品配置详情
        }
      }
    }
  });

  if (shelfProducts.length === 0) {
    return { items: [] };
  }

  // 3. 过滤有效商品并提取商品ID
  const validShelfProducts = shelfProducts.filter(sp => sp.items.length > 0);
  
  if (validShelfProducts.length === 0) {
    return { items: [] };
  }

  // 4. 批量查询所有商品的优惠券（并行优化）
  const productIds = validShelfProducts.map(sp => sp.productId);
  const couponsMap = await batchQueryAvailableCouponsByProductIds(productIds, userId);

  // 5. 组装商品卡片
  const productCardItems: ProductCardItem[] = validShelfProducts.map(shelfProduct => {
    // 找到有在售数量的最低售价配置
    const validConfigs = shelfProduct.items.map(item => item.config) as ProductConfig[];
    const minPriceConfig = validConfigs.reduce((prev, curr) => {
      const prevPrice = prev.salePrice.toNumber();
      const currPrice = curr.salePrice.toNumber();
      return prevPrice < currPrice ? prev : curr;
    }, validConfigs[0]);

    // 从批量查询结果中获取优惠券
    const coupons = couponsMap.get(shelfProduct.productId) || [];

    return {
      shelfProduct: shelfProduct as ShelfProduct,
      product: shelfProduct.product as Product,
      minPriceConfig,
      coupons
    };
  });

  return {
    items: productCardItems
  };
}

/**
 * 查询商品关联的可用优惠券（可领取、未过期、生效中）
 * @param productId 商品ID
 * @returns 可用优惠券列表
 */
export async function queryAvailableCouponsByProductId(
  productId: string,
  userId?: string
): Promise<CouponItem[]> {
  const now = new Date();

  // 1. 查询商品关联的优惠券
  const couponRelations = await db.productCouponRelation.findMany({
    where: {
      productId,
      status: '生效'
    },
    include: {
      coupon: {
        include: {
          center: true
        }
      }
    }
  });

  if (couponRelations.length === 0) {
    return [];
  }

  // 2. 基础有效性筛选
  const validCoupons: CouponItem[] = [];

  for (const relation of couponRelations) {
    const { coupon } = relation;
    const { center } = coupon;

    if (!center) continue;

    if (coupon.startTime > now || coupon.expireTime < now) continue;
    if (center.startTime > now || center.endTime < now) continue;
    if (center.totalNum <= 0) continue;

    validCoupons.push({
      ...center,
      coupon
    });
  }

  // 3. 用户维度过滤
  if (userId && validCoupons.length > 0) {
    // 查询用户已领取的优惠券
    const userCoupons = await db.userCoupon.findMany({
      where: {
        userId,
        couponId: {
          in: validCoupons.map(v => v.coupon.id)
        }
      }
    });

    // 按 couponId 分组
    const userCouponMap = new Map<string, typeof userCoupons>();

    for (const uc of userCoupons) {
      if (!userCouponMap.has(uc.couponId)) {
        userCouponMap.set(uc.couponId, []);
      }
      userCouponMap.get(uc.couponId)!.push(uc);
    }

    // 过滤规则
    return validCoupons.filter(item => {
      const couponId = item.coupon.id;
      const userCouponList = userCouponMap.get(couponId) || [];

      if (userCouponList.some(uc => uc.status === '已使用')) {
        return false;
      }

      if (userCouponList.length >= item.limitNum) {
        return false;
      }

      return true;
    });
  }

  return validCoupons;
}


/**
 * 批量查询多个商品的可用优惠券（性能优化版本）
 * @param productIds 商品ID列表
 * @param userId 用户ID（可选）
 * @returns Map<商品ID, 可用优惠券列表>
 */
export async function batchQueryAvailableCouponsByProductIds(
  productIds: string[],
  userId?: string
): Promise<Map<string, CouponItem[]>> {
  const now = new Date();
  const resultMap = new Map<string, CouponItem[]>();

  // 初始化结果 Map
  productIds.forEach(id => resultMap.set(id, []));

  if (productIds.length === 0) {
    return resultMap;
  }

  // 1. 一次性查询所有商品的优惠券关联
  const couponRelations = await db.productCouponRelation.findMany({
    where: {
      productId: { in: productIds },
      status: '生效'
    },
    include: {
      coupon: {
        include: {
          center: true
        }
      }
    }
  });

  if (couponRelations.length === 0) {
    return resultMap;
  }

  // 2. 基础有效性筛选并按商品ID分组
  const productCouponMap = new Map<string, CouponItem[]>();
  const allValidCouponIds = new Set<string>();

  for (const relation of couponRelations) {
    const { coupon, productId } = relation;
    const { center } = coupon;

    if (!center) continue;

    // 时间有效性检查
    if (coupon.startTime > now || coupon.expireTime < now) continue;
    if (center.startTime > now || center.endTime < now) continue;
    if (center.totalNum <= 0) continue;

    const couponItem: CouponItem = {
      ...center,
      coupon
    };

    if (!productCouponMap.has(productId)) {
      productCouponMap.set(productId, []);
    }
    productCouponMap.get(productId)!.push(couponItem);
    allValidCouponIds.add(coupon.id);
  }

  // 3. 用户维度过滤
  if (userId && allValidCouponIds.size > 0) {
    // 一次性查询用户所有相关优惠券的领取情况
    const userCoupons = await db.userCoupon.findMany({
      where: {
        userId,
        couponId: { in: Array.from(allValidCouponIds) }
      }
    });

    // 按 couponId 分组用户优惠券
    const userCouponMap = new Map<string, typeof userCoupons>();
    for (const uc of userCoupons) {
      if (!userCouponMap.has(uc.couponId)) {
        userCouponMap.set(uc.couponId, []);
      }
      userCouponMap.get(uc.couponId)!.push(uc);
    }

    // 过滤每个商品的优惠券
    for (const [productId, coupons] of productCouponMap.entries()) {
      const filteredCoupons = coupons.filter(item => {
        const couponId = item.coupon.id;
        const userCouponList = userCouponMap.get(couponId) || [];

        // 已使用过的不能再领
        if (userCouponList.some(uc => uc.status === '已使用')) {
          return false;
        }

        // 达到领取上限
        if (userCouponList.length >= item.limitNum) {
          return false;
        }

        return true;
      });

      resultMap.set(productId, filteredCoupons);
    }
  } else {
    // 无需用户过滤，直接使用基础筛选结果
    for (const [productId, coupons] of productCouponMap.entries()) {
      resultMap.set(productId, coupons);
    }
  }

  return resultMap;
}


/**
 * 获取新品推送商品卡片数据（按品类分组返回）
 * 核心逻辑：筛选未过期、在售/售罄的新品推送，组装商品卡片并按品类分组
 * @returns 新品商品卡片分组数据
 */
export async function getProductCardByNewService(userId?:string): Promise<ProductCardNewResponse> {
  const now = new Date();

  // 1. 查询新品推送表，筛选有效数据并关联完整信息
  const newProducts = await db.newProductPush.findMany({
    where: {
      // 修正：使用 in 数组实现多状态筛选（原 || 写法错误）
      status: { in: [ShelfProductStatus.在售, ShelfProductStatus.售罄] },
      endTime: { gt: now } // 只查未过期的新品推送
    },
    include: {
      shelfProduct: {
        include: {
          // 关联品类信息（获取品类编码/名称，用于分组）
          category: {
            select: {
              code: true, // 对应 ProductType
              name: true // 品类名称
            }
          },
          // 关联商品基本信息
          product: {
            include: {
              configs: true // 关联商品配置（筛选最低价格）
            }
          },
          // 关联上架商品数量（筛选shelfNum>0的配置）
          items: {
            where: {
              shelfNum: { gt: 0 } // 只查有在售数量的配置
            },
            include: {
              config: true // 关联配置详情
            }
          }
        }
      }
    }
  });

  if (newProducts.length === 0) {
    return { carouselItems: [], items: [] };
  }

  // 2. 预处理：过滤有效商品并提取元数据
  const validNewProducts: Array<{
    newProduct: typeof newProducts[0];
    shelfProduct: NonNullable<typeof newProducts[0]['shelfProduct']>;
    categoryCode: ProductType;
    categoryName: string;
  }> = [];

  for (const newProduct of newProducts) {
    const shelfProduct = newProduct.shelfProduct;
    if (!shelfProduct || !shelfProduct.product) continue;
    if (shelfProduct.items.length === 0) continue;
    
    const categoryCode = shelfProduct.category?.code as ProductType;
    if (!categoryCode || !Object.values(ProductType).includes(categoryCode)) continue;
    const categoryName = shelfProduct.category?.name || categoryCode;

    validNewProducts.push({
      newProduct,
      shelfProduct,
      categoryCode,
      categoryName
    });
  }

  if (validNewProducts.length === 0) {
    return { carouselItems: [], items: [] };
  }

  // 3. 批量查询所有商品的优惠券（并行优化）
  const productIds = validNewProducts.map(item => item.shelfProduct.product.id);
  const couponsMap = await batchQueryAvailableCouponsByProductIds(productIds, userId);

  // 4. 组装 ProductCardItem 列表
  const productCardItems: Array<{
    card: ProductCardItem;
    categoryCode: ProductType;
    categoryName: string;
    isCarousel: boolean;
    carouselImage: string | null;
  }> = [];
  const carouselItems: CarouseProduct[] = [];

  for (const { newProduct, shelfProduct, categoryCode, categoryName } of validNewProducts) {
    // 筛选有在售数量的最低售价配置
    const validConfigs = shelfProduct.items.map(item => item.config) as ProductConfig[];
    const minPriceConfig = validConfigs.reduce((prev, curr) => {
      const prevPrice = prev.salePrice.toNumber();
      const currPrice = curr.salePrice.toNumber();
      return prevPrice < currPrice ? prev : curr;
    }, validConfigs[0]);

    // 从批量查询结果中获取优惠券
    const coupons = couponsMap.get(shelfProduct.product.id) || [];

    const card: ProductCardItem = {
      shelfProduct: shelfProduct,
      product: shelfProduct.product,
      minPriceConfig: minPriceConfig,
      coupons: coupons
    };

    const isCarousel = newProduct.isCarousel;
    const carouselImage = newProduct.carouselImage;
    if (isCarousel && carouselImage) {
      carouselItems.push({
        image: carouselImage,
        product: card
      });
    }

    productCardItems.push({
      card,
      categoryCode,
      categoryName,
      isCarousel,
      carouselImage,
    });
  }

  // 5. 按品类分组，生成 ProductGroup 列表
  const categoryMap = new Map<ProductType, ProductGroup>();
  for (const item of productCardItems) {
    const { card, categoryCode, categoryName } = item;
    // 若分组已存在，追加商品卡片；否则创建新分组
    if (categoryMap.has(categoryCode)) {
      categoryMap.get(categoryCode)!.items.push(card);
    } else {
      categoryMap.set(categoryCode, {
        title: categoryName, // 新品分组标题为品类名（也可直接用 categoryCode）
        items: [card]
      });
    }
  }

  // 转换为数组返回
  return {
    carouselItems: carouselItems,
    items: Array.from(categoryMap.values())
  };
}


/**
 * 获取首页商品卡片数据（按品牌+品类分组返回）
 * 核心逻辑：筛选首页推送的商品，组装卡片并按品牌+品类分组
 * @returns 首页商品卡片分组数据
 */
export async function getProductCardIndexService(userId?:string): Promise<ProductCardIndexResponse> {
  const now = new Date();

  // 1. 查询首页推送表，筛选有效数据并关联完整信息
  const homeProducts = await db.homePush.findMany({
    where: {
      status: { in: [ShelfProductStatus.在售, ShelfProductStatus.售罄] },
      endTime: { gt: now } // 只查未过期的首页推送
    },
    include: {
      shelfProduct: {
        include: {
          // 关联品类信息
          category: {
            select: {
              code: true,
              name: true
            }
          },
          // 关联商品基本信息（含品牌）
          product: {
            include: {
              configs: true,
              // 关联品牌信息（用于分组）
              brand: {
                select: {
                  name: true, // 品牌名
                  code: true
                }
              }
            }
          },
          // 关联上架商品数量
          items: {
            where: {
              shelfNum: { gt: 0 }
            },
            include: {
              config: true
            }
          }
        }
      }
    }
  });

  if (homeProducts.length === 0) {
    return { carouselItems: [], items: [] };
  }

  // 2. 预处理：过滤有效商品并提取元数据
  const validHomeProducts: Array<{
    homeProduct: typeof homeProducts[0];
    shelfProduct: NonNullable<typeof homeProducts[0]['shelfProduct']>;
    groupKey: string;
    groupTitle: string;
  }> = [];

  for (const homeProduct of homeProducts) {
    const shelfProduct = homeProduct.shelfProduct;
    if (!shelfProduct || !shelfProduct.product || !shelfProduct.product.brand) continue;
    if (shelfProduct.items.length === 0) continue;

    const brandName = shelfProduct.product.brand.name;
    const categoryCode = shelfProduct.category?.code as ProductType;
    const categoryName = shelfProduct.category?.name || categoryCode;
    if (!categoryCode || !Object.values(ProductType).includes(categoryCode)) continue;

    const groupKey = `${brandName}-${categoryName}`;
    const groupTitle = `${brandName}${categoryName}`;

    validHomeProducts.push({
      homeProduct,
      shelfProduct,
      groupKey,
      groupTitle
    });
  }

  if (validHomeProducts.length === 0) {
    return { carouselItems: [], items: [] };
  }

  // 3. 批量查询所有商品的优惠券（并行优化）
  const productIds = validHomeProducts.map(item => item.shelfProduct.product.id);
  const couponsMap = await batchQueryAvailableCouponsByProductIds(productIds, userId);

  // 4. 组装 ProductCardItem 和首页轮播数据
  const productCardItems: Array<{
    card: ProductCardItem;
    groupKey: string;
    groupTitle: string;
    isCarousel: boolean;
    carouselImage: string | null;
  }> = [];
  const carouselItems: CarouseProduct[] = [];

  for (const { homeProduct, shelfProduct, groupKey, groupTitle } of validHomeProducts) {
    // 筛选最低售价配置
    const validConfigs = shelfProduct.items.map(item => item.config) as ProductConfig[];
    const minPriceConfig = validConfigs.reduce((prev, curr) => {
      const prevPrice = prev.salePrice.toNumber();
      const currPrice = curr.salePrice.toNumber();
      return prevPrice < currPrice ? prev : curr;
    }, validConfigs[0]);

    // 从批量查询结果中获取优惠券
    const coupons = couponsMap.get(shelfProduct.product.id) || [];

    const card: ProductCardItem = {
      shelfProduct: shelfProduct,
      product: shelfProduct.product,
      minPriceConfig: minPriceConfig,
      coupons: coupons
    };

    const isCarousel = homeProduct.isCarousel;
    const carouselImage = homeProduct.carouselImage;
    if (isCarousel && carouselImage) {
      carouselItems.push({
        image: carouselImage,
        product: card
      });
    }

    productCardItems.push({
      card,
      groupKey,
      groupTitle,
      isCarousel,
      carouselImage
    });
  }

  // 3. 按品牌+品类分组
  const groupMap = new Map<string, ProductGroup>();
  for (const item of productCardItems) {
    const { card, groupKey, groupTitle } = item;
    if (groupMap.has(groupKey)) {
      groupMap.get(groupKey)!.items.push(card);
    } else {
      groupMap.set(groupKey, {
        title: groupTitle, // 首页分组标题为品牌名+品类名
        items: [card]
      });
    }
  }

  // 4. 返回结果（包含轮播数据和分组数据）
  return {
    carouselItems: carouselItems,
    items: Array.from(groupMap.values())
  };
}


export async function getSeckillProductCardService(userId?:string):Promise<SeckillRoundListResponse> {
  const now = new Date();

  // helper: format Date to 'YYYY-MM-DD HH:mm:ss'
  const formatDateTime = (d: Date) => {
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  };

  // 1) 查询未结束且启用的秒杀轮次（按开始时间升序）
  const rounds = await db.seckillRound.findMany({
    where: {
      status: SeckillRoundStatus.启用,
      endTime: { gt: now },
    },
    orderBy: { startTime: 'asc' },
    include: {
      products: {
        include: {
          // 关联商品基础信息 + 类别 + 原始配置列表
          product: {
            include: {
              category: true,
              configs: true,
            },
          },
          // 仅返回有库存/在售的配置项，防止返回无效配置
          configs: {
            where: {
              status: SeckillProductConfigStatus.正常,
              shelfNum: { gt: 0 },
            },
            include: {
              // 关联对应的商品原始配置
              config: true,
            },
          },
        },
      },
    },
  });

  // 2) 组装响应 VO
  const list = rounds.map((round) => ({
    id: round.id,
    title: round.title,
    startTime: formatDateTime(round.startTime),
    endTime: formatDateTime(round.endTime),
    status: round.status,
    createdAt: formatDateTime(round.createdAt),
    creatorId: round.creatorId,
    remark: round.remark ?? undefined,
    products: round.products.map((p) => ({
      id: p.id,
      roundId: p.roundId,
      productId: p.productId,
      type: p.type,
      reduceAmount: p.reduceAmount?.toNumber ? p.reduceAmount.toNumber() : (p.reduceAmount as unknown as number),
      discount: p.discount?.toNumber ? p.discount.toNumber() : (p.discount as unknown as number),
      // 秒杀配置项（含原始商品配置）
      configs: p.configs.map((cfg) => ({
        id: cfg.id,
        seckillProductId: cfg.seckillProductId,
        configId: cfg.configId,
        shelfNum: cfg.shelfNum,
        remainNum: cfg.remainNum,
        lockNum: cfg.lockNum,
        seckillPrice: cfg.seckillPrice?.toNumber ? cfg.seckillPrice.toNumber() : (cfg.seckillPrice as unknown as number),
        createdAt: formatDateTime(cfg.createdAt),
        updatedAt: formatDateTime(cfg.updatedAt),
        status: cfg.status,
        // 关联的商品原始配置
        config: cfg.config
          ? {
              id: cfg.config.id,
              productId: cfg.config.productId,
              config1: cfg.config.config1,
              config2: cfg.config.config2,
              config3: cfg.config.config3 ?? undefined,
              salePrice: cfg.config.salePrice?.toNumber
                ? cfg.config.salePrice.toNumber()
                : (cfg.config.salePrice as unknown as number),
              originalPrice: cfg.config.originalPrice?.toNumber
                ? cfg.config.originalPrice.toNumber()
                : (cfg.config.originalPrice as unknown as number),
              configImage: cfg.config.configImage ?? undefined,
              createdAt: formatDateTime(cfg.config.createdAt),
              updatedAt: formatDateTime(cfg.config.updatedAt),
              status: cfg.config.status as ProductConfigStatus,
            }
          : (undefined as any),
      })),
      // 关联商品基础信息（含分类与全部原始配置）
      product: p.product
        ? {
            id: p.product.id,
            brandId: p.product.brandId,
            categoryId: p.product.categoryId,
            name: p.product.name,
            subTitle: p.product.subTitle ?? undefined,
            description: p.product.description ?? undefined,
            mainImage: p.product.mainImage ?? undefined,
            createdAt: formatDateTime(p.product.createdAt),
            creatorId: p.product.creatorId,
            updatedAt: formatDateTime(p.product.updatedAt),
            status: p.product.status as ProductStatus,
            category: p.product.category
              ? {
                  id: p.product.category.id,
                  name: p.product.category.name,
                  code: p.product.category.code,
                  parentId: (p.product.category as any).parentId ?? undefined,
                  status: p.product.category.status,
                  createdAt: formatDateTime(p.product.category.createdAt),
                  creatorId: p.product.category.creatorId,
                }
              : (undefined as any),
          }
        : (undefined as any),
    })),
  }));

  return { list };
}



export async function getProductCardBySearchService(params: SearchFiltersType,userId?:string): Promise<SingleProductCardResponse> {
  const { sortBy, priceOrder, commentOrder, inStock, priceRange, tabFilters, keyword } = params;
  const whereProduct: any = {
    status: ProductStatus.正常,
  };
  if (keyword && keyword.trim().length > 0) {
    const kw = keyword.trim();
    whereProduct.OR = [
      { name: { contains: kw } },
      { subTitle: { contains: kw } },
      { description: { contains: kw } },
    ];
  }

  // 1) 基础筛选 + 关系加载
  const shelfProducts = await db.shelfProduct.findMany({
    where: {
      status: { in: [ShelfProductStatus.在售,ShelfProductStatus.售罄] },
      // tabFilters：自营/可定制/分期
      ...(tabFilters?.self ? { isSelfOperated: true } : {}),
      ...(tabFilters?.custom ? { isCustomizable: true } : {}),
      ...(tabFilters?.installment ? { installment: { gt: 0 } } : {}),
      product: whereProduct,
    },
    include: {
      product: {
        include: {
          configs: true,
          // 排序用到评论数时可选加载
          evaluations: { select: { id: true } },
        },
      },
      items: {
        where: inStock ? { shelfNum: { gt: 0 } } : {},
        include: { config: true },
      },
    },
  });

  // 2) 组装卡片，并应用价格区间与优惠券筛选
  const results: ProductCardItem[] = [];
  for (const sp of shelfProducts) {
    // 获取候选配置（取 items 的 config；若 inStock=false 且无 items，则回退到 product.configs）
    let candidateConfigs: ProductConfig[] = [] as any;
    if (sp.items && sp.items.length > 0) {
      candidateConfigs = sp.items.map((it) => it.config) as ProductConfig[];
    } else {
      candidateConfigs = (sp.product?.configs || []) as unknown as ProductConfig[];
    }
    if (candidateConfigs.length === 0) continue;

    // 价格区间过滤：以候选配置的最低价判断
    const minCfg = candidateConfigs.reduce((prev, curr) => {
      const p1 = prev.salePrice.toNumber();
      const p2 = curr.salePrice.toNumber();
      return p1 <= p2 ? prev : curr;
    });
    const minPrice = minCfg.salePrice.toNumber();
    if (priceRange) {
      if (priceRange.min !== undefined && minPrice < priceRange.min) continue;
      if (priceRange.max !== undefined && minPrice > priceRange.max) continue;
    }

    // 优惠券筛选：若要求有可用券，则过滤
    const coupons = await queryAvailableCouponsByProductId(sp.productId,userId);
    if (tabFilters?.discountCoupon && coupons.length === 0) {
      continue;
    }

    // tradeIn（以旧换新）：当前模型无字段，忽略该筛选（保留以便未来扩展）

    // 组装卡片
    results.push({
      shelfProduct: sp as any,
      product: sp.product as any,
      minPriceConfig: minCfg,
      coupons,
    });
  }

  // 3) 排序
  const sortByLower = sortBy;
  if (sortByLower === 'price') {
    const order = (priceOrder || 'asc').toLowerCase();
    results.sort((a, b) => {
      const pa = a.minPriceConfig.salePrice.toNumber();
      const pb = b.minPriceConfig.salePrice.toNumber();
      return order === 'desc' ? pb - pa : pa - pb;
    });
  } else if (sortByLower === 'new') {
    results.sort((a, b) => {
      const ta = new Date((a.shelfProduct as any).shelfTime || 0).getTime();
      const tb = new Date((b.shelfProduct as any).shelfTime || 0).getTime();
      return tb - ta;
    });
  } else if (sortByLower === 'comment') {
    const order = (commentOrder || 'desc').toLowerCase();
    results.sort((a, b) => {
      const ca = (a.product as any).evaluations?.length || 0;
      const cb = (b.product as any).evaluations?.length || 0;
      return order === 'asc' ? ca - cb : cb - ca;
    });
  } else {
    // recommend：按上架时间降序 + 可用券优先（轻度推荐逻辑）
    results.sort((a, b) => {
      const ca = (a.coupons?.length || 0);
      const cb = (b.coupons?.length || 0);
      if (cb !== ca) return cb - ca;
      const ta = new Date((a.shelfProduct as any).shelfTime || 0).getTime();
      const tb = new Date((b.shelfProduct as any).shelfTime || 0).getTime();
      return tb - ta;
    });
  }

  return { items: results };
}
