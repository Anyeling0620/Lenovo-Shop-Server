import { HTTPException } from "hono/http-exception";
import { db } from "../../utils/db";
import {
  BrandStatus,
  CategoryStatus,
  ProductConfigStatus,
  ProductStatus,
  RelationStatus,
  TagStatus,
} from "@prisma/client";
import { assertCategoryAccess } from "../../utils/admin-auth";
import {
  BrandResponse,
  CategoryResponse,
  ProductConfigResponse,
  ProductDetailResponse,
  ProductListItem,
  ProductStatsResponse,
  StockResponse,
  TagResponse,
} from "../../types/admin/api.type";

export const createBrand = async (payload: {
  name: string;
  code: string;
  description?: string;
  logo?: string | null;
  status?: BrandStatus;
  creatorId: string;
}) => {
  const exist = await db.brand.findFirst({
    where: { OR: [{ name: payload.name }, { code: payload.code }] },
  });
  if (exist) throw new HTTPException(400, { message: "品牌名称或编码已存在" });

  const brand = await db.brand.create({
    data: {
      name: payload.name,
      code: payload.code,
      description: payload.description,
      logo: payload.logo,
      status: payload.status ?? BrandStatus.启用,
      creatorId: payload.creatorId,
    },
  });
  return { brand_id: brand.id };
};

export const updateBrand = async (
  brandId: string,
  payload: Partial<{
    name: string;
    code: string;
    description: string | null;
    logo: string | null;
    status: BrandStatus;
    remark: string | null;
  }>
) => {
  const brand = await db.brand.findUnique({ where: { id: brandId } });
  if (!brand) throw new HTTPException(404, { message: "品牌不存在" });

  if (payload.name && payload.name !== brand.name) {
    const exists = await db.brand.findUnique({ where: { name: payload.name } });
    if (exists) throw new HTTPException(400, { message: "品牌名称已存在" });
  }
  if (payload.code && payload.code !== brand.code) {
    const exists = await db.brand.findUnique({ where: { code: payload.code } });
    if (exists) throw new HTTPException(400, { message: "品牌编码已存在" });
  }

  await db.brand.update({
    where: { id: brandId },
    data: {
      name: payload.name ?? brand.name,
      code: payload.code ?? brand.code,
      description: payload.description ?? brand.description,
      logo: payload.logo ?? brand.logo,
      status: payload.status ?? brand.status,
      remark: payload.remark ?? brand.remark,
    },
  });
  return true;
};

export const listBrands = async (status?: BrandStatus): Promise<BrandResponse[]> => {
  const brands = await db.brand.findMany({
    where: status ? { status } : undefined,
    orderBy: { createdAt: "desc" },
  });
  return brands.map((b) => ({
    brand_id: b.id,
    name: b.name,
    code: b.code,
    status: b.status,
    logo: b.logo,
    description: b.description,
    created_at: b.createdAt,
  })) as BrandResponse[];
};

export const listCategories = async (status?: CategoryStatus): Promise<CategoryResponse[]> => {
  const categories = await db.category.findMany({
    where: status ? { status } : undefined,
  });
  return categories.map((c) => ({
    category_id: c.id,
    name: c.name,
    code: c.code,
    parent_id: c.parentId,
    status: c.status,
  })) as CategoryResponse[];
};

export const createProduct = async (
  sessionCategories: string[],
  payload: {
    brandId: string;
    categoryId: string;
    name: string;
    subTitle?: string;
    description?: string;
    mainImage?: string | null;
    creatorId: string;
  }
) => {
  // 权限：只能操作自己的专区
  assertCategoryAccess(sessionCategories, payload.categoryId);

  const category = await db.category.findUnique({
    where: { id: payload.categoryId, status: CategoryStatus.启用 },
  });
  if (!category) throw new HTTPException(404, { message: "专区不存在或已禁用" });

  const brand = await db.brand.findUnique({
    where: { id: payload.brandId, status: BrandStatus.启用 },
  });
  if (!brand) throw new HTTPException(404, { message: "品牌不存在或已禁用" });

  const product = await db.product.create({
    data: {
      brandId: payload.brandId,
      categoryId: payload.categoryId,
      name: payload.name,
      subTitle: payload.subTitle,
      description: payload.description,
      mainImage: payload.mainImage,
      creatorId: payload.creatorId,
    },
  });

  return { product_id: product.id };
};

export const updateProduct = async (
  sessionCategories: string[],
  productId: string,
  payload: Partial<{
    brandId: string;
    categoryId: string;
    name: string;
    subTitle: string | null;
    description: string | null;
    mainImage: string | null;
    status: ProductStatus;
  }>
) => {
  const product = await db.product.findUnique({ where: { id: productId } });
  if (!product) throw new HTTPException(404, { message: "商品不存在" });

  const targetCategoryId = payload.categoryId ?? product.categoryId;
  assertCategoryAccess(sessionCategories, targetCategoryId);

  if (payload.brandId) {
    const brand = await db.brand.findUnique({
      where: { id: payload.brandId },
    });
    if (!brand) throw new HTTPException(404, { message: "品牌不存在" });
  }

  await db.product.update({
    where: { id: productId },
    data: {
      brandId: payload.brandId ?? product.brandId,
      categoryId: targetCategoryId,
      name: payload.name ?? product.name,
      subTitle: payload.subTitle ?? product.subTitle,
      description: payload.description ?? product.description,
      mainImage: payload.mainImage ?? product.mainImage,
      status: payload.status ?? product.status,
    },
  });
  return true;
};

export const listProducts = async (filters: {
  categoryId?: string;
  brandId?: string;
  status?: ProductStatus;
}): Promise<ProductListItem[]> => {
  const products = await db.product.findMany({
    where: {
      categoryId: filters.categoryId,
      brandId: filters.brandId,
      status: filters.status,
    },
    include: {
      brand: true,
      category: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return products.map((p) => ({
    product_id: p.id,
    name: p.name,
    brand_id: p.brandId,
    brand_name: p.brand.name,
    category_id: p.categoryId,
    category_name: p.category.name,
    status: p.status,
    main_image: p.mainImage,
    created_at: p.createdAt,
  })) as ProductListItem[];
};

export const getProductDetail = async (productId: string): Promise<ProductDetailResponse> => {
  const product = await db.product.findUnique({
    where: { id: productId },
    include: {
      brand: true,
      category: true,
      tags: { include: { tag: true } },
      configs: true,
      banners: true,
      appearance: true,
    },
  });
  if (!product) throw new HTTPException(404, { message: "商品不存在" });

  return {
    product_id: product.id,
    name: product.name,
    sub_title: product.subTitle,
    description: product.description,
    brand_id: product.brandId,
    brand_name: product.brand.name,
    category_id: product.categoryId,
    category_name: product.category.name,
    status: product.status,
    main_image: product.mainImage,
    tags: product.tags.map((t) => ({
      product_tag_relation_id: t.id,
      tag_id: t.tag.id,
      tag_name: t.tag.name,
      status: t.status,
    })),
    configs: product.configs.map((c) => ({
      product_config_id: c.id,
      config1: c.config1,
      config2: c.config2,
      config3: c.config3,
      sale_price: c.salePrice,
      original_price: c.originalPrice,
      status: c.status,
      image: c.configImage,
    })),
    banners: product.banners.map((b) => ({
      product_banner_id: b.id,
      image: b.image,
      sort: b.sort,
    })),
    appearances: product.appearance.map((a) => ({
      product_appearance_id: a.id,
      image: a.image,
    })),
  } as ProductDetailResponse;
};

export const createTag = async (payload: {
  name: string;
  priority?: number;
  status?: TagStatus;
  creatorId: string;
  remark?: string | null;
}) => {
  const exist = await db.tag.findUnique({ where: { name: payload.name } });
  if (exist) throw new HTTPException(400, { message: "标签名称已存在" });
  const tag = await db.tag.create({
    data: {
      name: payload.name,
      priority: payload.priority ?? 0,
      status: payload.status ?? TagStatus.启用,
      creatorId: payload.creatorId,
      remark: payload.remark,
    },
  });
  return { tag_id: tag.id };
};

export const updateTag = async (
  tagId: string,
  payload: Partial<{
    name: string;
    priority: number;
    status: TagStatus;
    remark: string | null;
  }>
) => {
  const tag = await db.tag.findUnique({ where: { id: tagId } });
  if (!tag) throw new HTTPException(404, { message: "标签不存在" });
  if (payload.name && payload.name !== tag.name) {
    const exist = await db.tag.findUnique({ where: { name: payload.name } });
    if (exist) throw new HTTPException(400, { message: "标签名称已存在" });
  }
  await db.tag.update({
    where: { id: tagId },
    data: {
      name: payload.name ?? tag.name,
      priority: payload.priority ?? tag.priority,
      status: payload.status ?? tag.status,
      remark: payload.remark ?? tag.remark,
    },
  });
  return true;
};

export const deleteTag = async (tagId: string) => {
  const tag = await db.tag.findUnique({ where: { id: tagId } });
  if (!tag) throw new HTTPException(404, { message: "标签不存在" });
  await db.tag.delete({ where: { id: tagId } });
  return true;
};

export const listTags = async (status?: TagStatus): Promise<TagResponse[]> => {
  const tags = await db.tag.findMany({
    where: status ? { status } : undefined,
    orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
  });
  return tags.map((t) => ({
    tag_id: t.id,
    name: t.name,
    priority: t.priority,
    status: t.status,
  })) as TagResponse[];
};

export const bindProductTag = async (productId: string, tagId: string) => {
  // 验证存在
  const product = await db.product.findUnique({ where: { id: productId } });
  if (!product) throw new HTTPException(404, { message: "商品不存在" });
  const tag = await db.tag.findUnique({ where: { id: tagId } });
  if (!tag) throw new HTTPException(404, { message: "标签不存在" });

  const relation = await db.productTagRelation.upsert({
    where: { productId_tagId: { productId, tagId } },
    update: { status: RelationStatus.生效 },
    create: { productId, tagId, status: RelationStatus.生效 },
  });
  return { product_tag_relation_id: relation.id };
};

export const unbindProductTag = async (productId: string, tagId: string) => {
  const relation = await db.productTagRelation.findUnique({
    where: { productId_tagId: { productId, tagId } },
  });
  if (!relation) throw new HTTPException(404, { message: "未找到绑定关系" });
  await db.productTagRelation.update({
    where: { id: relation.id },
    data: { status: RelationStatus.失效 },
  });
  return true;
};

export const addProductConfig = async (
  sessionCategories: string[],
  payload: {
    productId: string;
    config1: string;
    config2: string;
    config3: string;
    salePrice: any;
    originalPrice: any;
    configImage?: string | null;
  }
) => {
  if (!payload.config1 || !payload.config2 || !payload.config3) {
    throw new HTTPException(400, { message: "必须提供三个配置" });
  }
  const product = await db.product.findUnique({ where: { id: payload.productId } });
  if (!product) throw new HTTPException(404, { message: "商品不存在" });
  assertCategoryAccess(sessionCategories, product.categoryId);

  const config = await db.productConfig.create({
    data: {
      productId: payload.productId,
      config1: payload.config1,
      config2: payload.config2,
      config3: payload.config3,
      salePrice: payload.salePrice,
      originalPrice: payload.originalPrice,
      configImage: payload.configImage,
    },
  });

  await db.stock.create({
    data: {
      configId: config.id,
      stockNum: 0,
      freezeNum: 0,
    },
  });

  return { product_config_id: config.id };
};

export const updateProductConfig = async (
  sessionCategories: string[],
  configId: string,
  payload: Partial<{
    config1: string;
    config2: string;
    config3: string | null;
    salePrice: any;
    originalPrice: any;
    configImage: string | null;
    status: ProductConfigStatus;
  }>
) => {
  const config = await db.productConfig.findUnique({
    where: { id: configId },
    include: { product: true },
  });
  if (!config) throw new HTTPException(404, { message: "配置不存在" });
  assertCategoryAccess(sessionCategories, config.product.categoryId);

  await db.productConfig.update({
    where: { id: configId },
    data: {
      config1: payload.config1 ?? config.config1,
      config2: payload.config2 ?? config.config2,
      config3: payload.config3 ?? config.config3,
      salePrice: payload.salePrice ?? config.salePrice,
      originalPrice: payload.originalPrice ?? config.originalPrice,
      configImage: payload.configImage ?? config.configImage,
      status: payload.status ?? config.status,
    },
  });
  return true;
};

export const listProductConfigs = async (productId: string): Promise<ProductConfigResponse[]> => {
  const configs = await db.productConfig.findMany({
    where: { productId },
    include: { stocks: true },
  });
  return configs.map((c) => ({
    product_config_id: c.id,
    product_id: c.productId,
    config1: c.config1,
    config2: c.config2,
    config3: c.config3,
    sale_price: c.salePrice,
    original_price: c.originalPrice,
    status: c.status,
    stock: c.stocks[0]
      ? {
          stock_id: c.stocks[0].id,
          stock_num: c.stocks[0].stockNum,
          warn_num: c.stocks[0].warnNum,
          freeze_num: c.stocks[0].freezeNum,
        }
      : null,
  })) as ProductConfigResponse[];
};

export const getProductConfigDetail = async (configId: string): Promise<ProductConfigResponse> => {
  const config = await db.productConfig.findUnique({
    where: { id: configId },
    include: { stocks: true, product: true },
  });
  if (!config) throw new HTTPException(404, { message: "配置不存在" });

  return {
    product_config_id: config.id,
    product_id: config.productId,
    product_name: config.product.name,
    config1: config.config1,
    config2: config.config2,
    config3: config.config3,
    sale_price: config.salePrice,
    original_price: config.originalPrice,
    status: config.status,
    stock: config.stocks[0]
      ? {
          stock_id: config.stocks[0].id,
          stock_num: config.stocks[0].stockNum,
          warn_num: config.stocks[0].warnNum,
          freeze_num: config.stocks[0].freezeNum,
        }
      : null,
  } as ProductConfigResponse;
};

export const getProductStats = async (): Promise<ProductStatsResponse> => {
  const total = await db.product.count();
  const normal = await db.product.count({ where: { status: ProductStatus.正常 } });
  const off = await db.product.count({ where: { status: ProductStatus.下架 } });
  const deleted = await db.product.count({ where: { status: ProductStatus.删除 } });
  return {
    total,
    normal,
    off,
    deleted,
  } as ProductStatsResponse;
};

export const listStocks = async (): Promise<StockResponse[]> => {
  const stocks = await db.stock.findMany({
    include: {
      config: {
        include: {
          product: true,
        },
      },
    },
  });

  return stocks.map((s) => ({
    stock_id: s.id,
    stock_num: s.stockNum,
    warn_num: s.warnNum,
    freeze_num: s.freezeNum,
    config_id: s.configId,
    product_id: s.config.productId,
    product_name: s.config.product.name,
    config1: s.config.config1,
    config2: s.config.config2,
    config3: s.config.config3,
  })) as StockResponse[];
};

export const updateStock = async (
  configId: string,
  payload: Partial<{ stockNum: number; warnNum: number }>
) => {
  const stock = await db.stock.findUnique({ where: { configId } });
  if (!stock) throw new HTTPException(404, { message: "库存不存在" });
  await db.stock.update({
    where: { id: stock.id },
    data: {
      stockNum: payload.stockNum ?? stock.stockNum,
      warnNum: payload.warnNum ?? stock.warnNum,
    },
  });
  return true;
};

export const updateProductStatus = async (productId: string, status: ProductStatus) => {
  await db.product.update({
    where: { id: productId },
    data: { status },
  });
  return true;
};

export const updateProductConfigStatus = async (
  configId: string,
  status: ProductConfigStatus
) => {
  await db.productConfig.update({
    where: { id: configId },
    data: { status },
  });
  return true;
};

export const addProductAppearance = async (
  productId: string,
  image: string
) => {
  const product = await db.product.findUnique({ where: { id: productId } });
  if (!product) throw new HTTPException(404, { message: "商品不存在" });
  const record = await db.productAppearance.create({
    data: { productId, image },
  });
  return { product_appearance_id: record.id };
};

export const updateProductAppearance = async (
  appearanceId: string,
  image: string
) => {
  const exist = await db.productAppearance.findUnique({ where: { id: appearanceId } });
  if (!exist) throw new HTTPException(404, { message: "外观图不存在" });
  await db.productAppearance.update({
    where: { id: appearanceId },
    data: { image },
  });
  return true;
};

export const addProductBanner = async (
  productId: string,
  image: string,
  sort: number
) => {
  const product = await db.product.findUnique({ where: { id: productId } });
  if (!product) throw new HTTPException(404, { message: "商品不存在" });
  const record = await db.productBanner.create({
    data: {
      productId,
      image,
      sort,
    },
  });
  return { product_banner_id: record.id };
};

export const updateProductBanner = async (
  bannerId: string,
  payload: Partial<{ image: string; sort: number }>
) => {
  const banner = await db.productBanner.findUnique({ where: { id: bannerId } });
  if (!banner) throw new HTTPException(404, { message: "宣传图不存在" });
  await db.productBanner.update({
    where: { id: bannerId },
    data: {
      image: payload.image ?? banner.image,
      sort: payload.sort ?? banner.sort,
    },
  });
  return true;
};
