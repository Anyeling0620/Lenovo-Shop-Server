import { HTTPException } from 'hono/http-exception';
import { db } from '../../utils/db';
import { ProductType, ProductCardItem, ProductCardQuery, SingleProductCardResponse, CouponItem,  ProductCardNewResponse, ProductCardIndexResponse, ProductGroup, CarouseProduct } from '../../types/client/product.type';
import { ProductConfig, ShelfProduct, Product, CategoryStatus, ShelfProductStatus } from '@prisma/client';
import { log } from 'console';

/**
 * 根据品类编码获取商品卡片数据（无分页，返回所有满足条件的商品）
 * 核心逻辑：仅展示上架数量>0的商品配置（shelfNum>0）
 * @param query 查询参数（仅品类编码）
 * @returns 单品类商品卡片数据
 */
export async function getProductCardByCategoryService(query: ProductCardQuery): Promise<SingleProductCardResponse> {
  const { categoryCode } = query;

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

  // 3. 处理数据，组装商品卡片（先过滤无有效配置的商品，再处理）
  const productCardItems: ProductCardItem[] = [];
  for (const shelfProduct of shelfProducts) {
    // 过滤掉没有有效配置的货架商品（提前过滤，避免返回null）
    if (shelfProduct.items.length === 0) {
      continue;
    }

    // 3.1 找到有在售数量的最低售价配置（使用toNumber()转换为数字比较）
    const validConfigs = shelfProduct.items.map(item => item.config) as ProductConfig[];
    const minPriceConfig = validConfigs.reduce((prev, curr) => {
      // 核心修正：使用Prisma Decimal的toNumber()方法转换为数字
      const prevPrice = prev.salePrice.toNumber();
      const currPrice = curr.salePrice.toNumber();
      return prevPrice < currPrice ? prev : curr;
    }, validConfigs[0]);

    // 3.2 查询商品关联的可用优惠券
    const coupons = await queryAvailableCouponsByProductId(shelfProduct.productId);

    // 组装商品卡片（确保类型严格匹配接口）
    productCardItems.push({
      shelfProduct: shelfProduct as ShelfProduct, // 明确类型断言
      product: shelfProduct.product as Product, // 明确类型断言
      minPriceConfig,
      coupons
    });
  }

  return {
    items: productCardItems
  };
}

/**
 * 查询商品关联的可用优惠券（可领取、未过期、生效中）
 * @param productId 商品ID
 * @returns 可用优惠券列表
 */
async function queryAvailableCouponsByProductId(productId: string): Promise<CouponItem[]> {
  const now = new Date();

  // 1. 查询商品关联的优惠券（通过ProductCouponRelation）
  const couponRelations = await db.productCouponRelation.findMany({
    where: {
      productId,
      status: '生效' // 只查生效的关联
    },
    include: {
      // 关联优惠券+领券中心信息
      coupon: {
        include: {
          center: true // 关联领券中心
        }
      }
    }
  });

  if (couponRelations.length === 0) {
    return [];
  }

  // 2. 筛选可用的优惠券
  const validCoupons: CouponItem[] = [];
  for (const relation of couponRelations) {
    const { coupon } = relation;
    const { center } = coupon;

    // 跳过没有领券中心的优惠券（无法领取）
    if (!center) {
      continue;
    }

    // 筛选条件：
    // a. 优惠券本身在有效期内（startTime <= now <= expireTime）
    if (coupon.startTime > now || coupon.expireTime < now) {
      continue;
    }

    // b. 领券中心在可领取时间内（startTime <= now <= endTime）
    if (center.startTime > now || center.endTime < now) {
      continue;
    }

    // c. 领券中心还有可领取数量（totalNum > 已领取数量，这里简化为totalNum>0）
    if (center.totalNum <= 0) {
      continue;
    }

    // 组装CouponItem（CouponCenter + Coupon），确保类型匹配
    validCoupons.push({
      ...center,
      coupon
    });
  }

  return validCoupons;
}


/**
 * 获取新品推送商品卡片数据（按品类分组返回）
 * 核心逻辑：筛选未过期、在售/售罄的新品推送，组装商品卡片并按品类分组
 * @returns 新品商品卡片分组数据
 */
export async function getProductCardByNewService(): Promise<ProductCardNewResponse> {
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
  // 2. 组装 ProductCardItem 列表
   const productCardItems: Array<{
    card: ProductCardItem;
    categoryCode: ProductType; // 品类编码（用于分组）
    categoryName: string; // 品类名称
    isCarousel: boolean; // 是否为新品轮播
    carouselImage: string | null; // 新品轮播图
  }> = [];
 const carouselItems: CarouseProduct[] = []; 
  for (const newProduct of newProducts) {
    const shelfProduct = newProduct.shelfProduct;
    // 过滤无商品信息的货架商品
    if (!shelfProduct || !shelfProduct.product) {
      continue;
    }
    // 过滤无有效配置的商品
    if (shelfProduct.items.length === 0) {
      continue;
    }
    // 过滤无品类编码的商品（确保对应 ProductType）
    const categoryCode = shelfProduct.category?.code as ProductType;
    if (!categoryCode || !Object.values(ProductType).includes(categoryCode)) {
      continue;
    }
    const categoryName = shelfProduct.category?.name || categoryCode;

    // 2.1 筛选有在售数量的最低售价配置
    const validConfigs = shelfProduct.items.map(item => item.config) as ProductConfig[];
    const minPriceConfig = validConfigs.reduce((prev, curr) => {
      // 使用 toNumber() 转换为数字比较（避免 Decimal 问题）
      const prevPrice = prev.salePrice.toNumber();
      const currPrice = curr.salePrice.toNumber();
      return prevPrice < currPrice ? prev : curr;
    }, validConfigs[0]);

    // 2.2 查询商品关联的可用优惠券
    const coupons = await queryAvailableCouponsByProductId(shelfProduct.product.id);

     const card: ProductCardItem = {
      shelfProduct: shelfProduct,
      product: shelfProduct.product,
      minPriceConfig: minPriceConfig,
      coupons: coupons
    };
    const isCarousel = newProduct.isCarousel;
    const carouselImage = newProduct.carouselImage;
    if (isCarousel && carouselImage) { // 有轮播图才加入轮播
      carouselItems.push({
        image: carouselImage,
        product: card
      });
    }

    // 2.3 组装商品卡片
    productCardItems.push({
      card,
      categoryCode,
      categoryName,
      isCarousel,
      carouselImage,
    });
  }

  // 3. 按品类分组，生成 ProductGroup 列表
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
export async function getProductCardIndexService(): Promise<ProductCardIndexResponse> {
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

  // 2. 组装 ProductCardItem 和 首页轮播数据
  const productCardItems: Array<{
    card: ProductCardItem;
    groupKey: string; // 品牌名+品类名（分组键）
    groupTitle: string; // 分组标题（品牌名+品类名）
    isCarousel: boolean; // 是否为首页轮播
    carouselImage: string | null; // 首页轮播图
  }> = [];
  const carouselItems: CarouseProduct[] = []; // 首页轮播列表

  for (const homeProduct of homeProducts) {
    const shelfProduct = homeProduct.shelfProduct;
    if (!shelfProduct || !shelfProduct.product || !shelfProduct.product.brand) {
      continue;
    }
    if (shelfProduct.items.length === 0) {
      continue;
    }
    // 获取品牌名和品类名
    const brandName = shelfProduct.product.brand.name;
    const categoryCode = shelfProduct.category?.code as ProductType;
    const categoryName = shelfProduct.category?.name || categoryCode;
    if (!categoryCode || !Object.values(ProductType).includes(categoryCode)) {
      continue;
    }
    // 分组键：品牌名+品类名（确保唯一）
    const groupKey = `${brandName}-${categoryName}`;
    const groupTitle = `${brandName}${categoryName}`; // 标题可自定义格式

    // 2.1 筛选最低售价配置
    const validConfigs = shelfProduct.items.map(item => item.config) as ProductConfig[];
    const minPriceConfig = validConfigs.reduce((prev, curr) => {
      const prevPrice = prev.salePrice.toNumber();
      const currPrice = curr.salePrice.toNumber();
      return prevPrice < currPrice ? prev : curr;
    }, validConfigs[0]);

    // 2.2 查询优惠券
    const coupons = await queryAvailableCouponsByProductId(shelfProduct.product.id);

    // 2.3 组装卡片
    const card: ProductCardItem = {
      shelfProduct: shelfProduct,
      product: shelfProduct.product,
      minPriceConfig: minPriceConfig,
      coupons: coupons
    };

    // 2.4 判断是否为首页轮播，若是则加入轮播列表
    const isCarousel = homeProduct.isCarousel;
    const carouselImage = homeProduct.carouselImage;
    if (isCarousel && carouselImage) { // 有轮播图才加入轮播
      carouselItems.push({
        image: carouselImage,
        product: card
      });
    }

    // 2.5 加入商品卡片列表（用于后续分组）
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