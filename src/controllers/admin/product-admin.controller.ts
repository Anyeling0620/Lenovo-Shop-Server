import { HTTPException } from "hono/http-exception";
import {
  addProductAppearance,
  addProductBanner,
  addProductConfig,
  bindProductTag,
  createBrand,
  createProduct,
  createTag,
  deleteTag,
  getProductConfigDetail,
  getProductDetail,
  getProductStats,
  listBrands,
  listCategories,
  listProductConfigs,
  listProducts,
  listStocks,
  listTags,
  unbindProductTag,
  updateBrand,
  updateProduct,
  updateProductBanner,
  updateProductConfig,
  updateProductConfigStatus,
  updateProductStatus,
  updateStock,
  updateTag,
  updateProductAppearance,
} from "../../services/admin/product-admin.service";
import { getFormBody, getUploadedFiles } from "../../middleware/upload.middleware";
import { assertHasIdentity } from "../../utils/admin-auth";
import {
  BrandStatus,
  CategoryStatus,
  ProductConfigStatus,
  ProductStatus,
  TagStatus,
} from "@prisma/client";
import {
  AddAppearanceRequest,
  AddBannerRequest,
  BrandResponse,
  CategoryResponse,
  CreateBrandRequest,
  ProductConfigCreateRequest,
  ProductConfigResponse,
  ProductConfigUpdateRequest,
  ProductCreateRequest,
  ProductDetailResponse,
  ProductListItem,
  ProductStatsResponse,
  ProductTagBindRequest,
  ProductUpdateRequest,
  StockResponse,
  StockUpdateRequest,
  TagCreateRequest,
  TagResponse,
  TagUpdateRequest,
} from "../../types/admin/api.type";

const productRoles = ["SUPER_ADMIN", "PRODUCT_MANAGER", "WAREHOUSE_MANAGER"];

export const listBrandsController = async (c: any) => {
  const session = c.get("adminSession");
  await assertHasIdentity(session.identitys, productRoles);
  const status = c.req.query("status") as BrandStatus | undefined;
  const data: BrandResponse[] = await listBrands(status);
  return c.json({ code: 200, message: "success", data });
};

export const createBrandController = async (c: any) => {
  const session = c.get("adminSession");
  await assertHasIdentity(session.identitys, productRoles);
  const jsonBody = await c.req.json().catch(() => ({}));
  const body: CreateBrandRequest = { ...getFormBody(c), ...jsonBody };
  const files = getUploadedFiles(c);
  const logo = files[0]?.filename ?? body.logo;
  if (!body.name || !body.code) {
    throw new HTTPException(400, { message: "name 与 code 不能为空" });
  }
  const data = await createBrand({
    name: body.name,
    code: body.code,
    description: body.description,
    logo,
    status: body.status,
    creatorId: session.admin_id,
  });
  return c.json({ code: 200, message: "创建成功", data });
};

export const updateBrandController = async (c: any) => {
  const session = c.get("adminSession");
  await assertHasIdentity(session.identitys, productRoles);
  const { brand_id } = c.req.param();
  const jsonBody = await c.req.json().catch(() => ({}));
  const body: Partial<CreateBrandRequest> = { ...getFormBody(c), ...jsonBody };
  const files = getUploadedFiles(c);
  const logo = files[0]?.filename ?? body.logo;
  await updateBrand(brand_id, {
    name: body.name,
    code: body.code,
    description: body.description,
    logo,
    status: body.status,
    remark: (body as any).remark,
  });
  return c.json({ code: 200, message: "更新成功", data: null });
};

export const listCategoriesController = async (c: any) => {
  const session = c.get("adminSession");
  await assertHasIdentity(session.identitys, productRoles);
  const status = c.req.query("status") as CategoryStatus | undefined;
  const data: CategoryResponse[] = await listCategories(status);
  return c.json({ code: 200, message: "success", data });
};

export const createProductController = async (c: any) => {
  const session = c.get("adminSession");
  await assertHasIdentity(session.identitys, productRoles);
  const jsonBody = await c.req.json().catch(() => ({}));
  const body: ProductCreateRequest = { ...getFormBody(c), ...jsonBody };
  const files = getUploadedFiles(c);
  const mainImage = files[0]?.filename ?? (body as any).main_image;
  if (!body.brand_id || !body.category_id || !body.name) {
    throw new HTTPException(400, { message: "brand_id、category_id、name 不能为空" });
  }
  const data = await createProduct(session.categories, {
    brandId: body.brand_id,
    categoryId: body.category_id,
    name: body.name,
    subTitle: body.sub_title,
    description: body.description,
    mainImage,
    creatorId: session.admin_id,
  });
  return c.json({ code: 200, message: "创建成功", data });
};

export const updateProductController = async (c: any) => {
  const session = c.get("adminSession");
  await assertHasIdentity(session.identitys, productRoles);
  const { product_id } = c.req.param();
  const jsonBody = await c.req.json().catch(() => ({}));
  const body: ProductUpdateRequest = { ...getFormBody(c), ...jsonBody };
  const files = getUploadedFiles(c);
  const mainImage = files[0]?.filename ?? (body as any).main_image;
  await updateProduct(session.categories, product_id, {
    brandId: body.brand_id,
    categoryId: body.category_id,
    name: body.name,
    subTitle: body.sub_title,
    description: body.description,
    mainImage,
    status: body.status,
  });
  return c.json({ code: 200, message: "更新成功", data: null });
};

export const listProductsController = async (c: any) => {
  const session = c.get("adminSession");
  await assertHasIdentity(session.identitys, productRoles);
  const q = c.req.query();
  const data: ProductListItem[] = await listProducts({
    categoryId: q.category_id,
    brandId: q.brand_id,
    status: q.status as ProductStatus | undefined,
  });
  return c.json({ code: 200, message: "success", data });
};

export const getProductDetailController = async (c: any) => {
  const session = c.get("adminSession");
  await assertHasIdentity(session.identitys, productRoles);
  const { product_id } = c.req.param();
  const data: ProductDetailResponse = await getProductDetail(product_id);
  return c.json({ code: 200, message: "success", data });
};

export const createTagController = async (c: any) => {
  const session = c.get("adminSession");
  await assertHasIdentity(session.identitys, productRoles);
  const body: TagCreateRequest = await c.req.json().catch(() => ({} as TagCreateRequest));
  if (!body.name) throw new HTTPException(400, { message: "name 不能为空" });
  const data = await createTag({
    name: body.name,
    priority: body.priority,
    status: body.status,
    creatorId: session.admin_id,
    remark: body.remark,
  });
  return c.json({ code: 200, message: "创建成功", data });
};

export const updateTagController = async (c: any) => {
  const session = c.get("adminSession");
  await assertHasIdentity(session.identitys, productRoles);
  const { tag_id } = c.req.param();
  const body: TagUpdateRequest = await c.req.json().catch(() => ({} as TagUpdateRequest));
  await updateTag(tag_id, {
    name: body.name,
    priority: body.priority,
    status: body.status as TagStatus,
    remark: body.remark,
  });
  return c.json({ code: 200, message: "更新成功", data: null });
};

export const deleteTagController = async (c: any) => {
  const session = c.get("adminSession");
  await assertHasIdentity(session.identitys, productRoles);
  const { tag_id } = c.req.param();
  await deleteTag(tag_id);
  return c.json({ code: 200, message: "删除成功", data: null });
};

export const listTagsController = async (c: any) => {
  const session = c.get("adminSession");
  await assertHasIdentity(session.identitys, productRoles);
  const status = c.req.query("status") as TagStatus | undefined;
  const data: TagResponse[] = await listTags(status);
  return c.json({ code: 200, message: "success", data });
};

export const bindProductTagController = async (c: any) => {
  const session = c.get("adminSession");
  await assertHasIdentity(session.identitys, productRoles);
  const body: ProductTagBindRequest = await c.req.json().catch(() => ({} as ProductTagBindRequest));
  if (!body.product_id || !body.tag_id) {
    throw new HTTPException(400, { message: "product_id 和 tag_id 不能为空" });
  }
  const data = await bindProductTag(body.product_id, body.tag_id);
  return c.json({ code: 200, message: "绑定成功", data });
};

export const unbindProductTagController = async (c: any) => {
  const session = c.get("adminSession");
  await assertHasIdentity(session.identitys, productRoles);
  const body: ProductTagBindRequest = await c.req.json().catch(() => ({} as ProductTagBindRequest));
  if (!body.product_id || !body.tag_id) {
    throw new HTTPException(400, { message: "product_id 和 tag_id 不能为空" });
  }
  await unbindProductTag(body.product_id, body.tag_id);
  return c.json({ code: 200, message: "解绑成功", data: null });
};

export const addProductConfigController = async (c: any) => {
  const session = c.get("adminSession");
  await assertHasIdentity(session.identitys, productRoles);
  const jsonBody = await c.req.json().catch(() => ({}));
  const body: ProductConfigCreateRequest = { ...getFormBody(c), ...jsonBody };
  const files = getUploadedFiles(c);
  const image = files[0]?.filename ?? (body as any).config_image;
  const data = await addProductConfig(session.categories, {
    productId: body.product_id,
    config1: body.config1,
    config2: body.config2,
    config3: body.config3,
    salePrice: body.sale_price,
    originalPrice: body.original_price,
    configImage: image,
  });
  return c.json({ code: 200, message: "新增成功", data });
};

export const updateProductConfigController = async (c: any) => {
  const session = c.get("adminSession");
  await assertHasIdentity(session.identitys, productRoles);
  const { config_id } = c.req.param();
  const jsonBody = await c.req.json().catch(() => ({}));
  const body: ProductConfigUpdateRequest = { ...getFormBody(c), ...jsonBody };
  const files = getUploadedFiles(c);
  const image = files[0]?.filename ?? (body as any).config_image;
  await updateProductConfig(session.categories, config_id, {
    config1: body.config1,
    config2: body.config2,
    config3: body.config3,
    salePrice: body.sale_price,
    originalPrice: body.original_price,
    configImage: image,
    status: body.status as ProductConfigStatus,
  });
  return c.json({ code: 200, message: "更新成功", data: null });
};

export const listProductConfigsController = async (c: any) => {
  const session = c.get("adminSession");
  await assertHasIdentity(session.identitys, productRoles);
  const { product_id } = c.req.param();
  const data: ProductConfigResponse[] = await listProductConfigs(product_id);
  return c.json({ code: 200, message: "success", data });
};

export const getProductConfigDetailController = async (c: any) => {
  const session = c.get("adminSession");
  await assertHasIdentity(session.identitys, productRoles);
  const { config_id } = c.req.param();
  const data: ProductConfigResponse = await getProductConfigDetail(config_id);
  return c.json({ code: 200, message: "success", data });
};

export const getProductStatsController = async (c: any) => {
  const session = c.get("adminSession");
  await assertHasIdentity(session.identitys, productRoles);
  const data: ProductStatsResponse = await getProductStats();
  return c.json({ code: 200, message: "success", data });
};

export const listStocksController = async (c: any) => {
  const session = c.get("adminSession");
  await assertHasIdentity(session.identitys, productRoles);
  const data: StockResponse[] = await listStocks();
  return c.json({ code: 200, message: "success", data });
};

export const updateStockController = async (c: any) => {
  const session = c.get("adminSession");
  await assertHasIdentity(session.identitys, productRoles);
  const { config_id } = c.req.param();
  const body: StockUpdateRequest = await c.req.json();
  await updateStock(config_id, {
    stockNum: body.stock_num,
    warnNum: body.warn_num,
  });
  return c.json({ code: 200, message: "更新成功", data: null });
};

export const updateProductStatusController = async (c: any) => {
  const session = c.get("adminSession");
  await assertHasIdentity(session.identitys, productRoles);
  const { product_id } = c.req.param();
  const body = await c.req.json();
  await updateProductStatus(product_id, body.status as ProductStatus);
  return c.json({ code: 200, message: "更新成功", data: null });
};

export const updateProductConfigStatusController = async (c: any) => {
  const session = c.get("adminSession");
  await assertHasIdentity(session.identitys, productRoles);
  const { config_id } = c.req.param();
  const body = await c.req.json();
  await updateProductConfigStatus(config_id, body.status as ProductConfigStatus);
  return c.json({ code: 200, message: "更新成功", data: null });
};

export const addAppearanceController = async (c: any) => {
  const session = c.get("adminSession");
  await assertHasIdentity(session.identitys, productRoles);
  const { product_id } = c.req.param();
  const files = getUploadedFiles(c);
  const image = files[0]?.filename;
  if (!image) throw new HTTPException(400, { message: "缺少图片" });
  const data = await addProductAppearance(product_id, image);
  return c.json({ code: 200, message: "新增成功", data });
};

export const updateAppearanceController = async (c: any) => {
  const session = c.get("adminSession");
  await assertHasIdentity(session.identitys, productRoles);
  const { appearance_id } = c.req.param();
  const files = getUploadedFiles(c);
  const image = files[0]?.filename;
  if (!image) throw new HTTPException(400, { message: "缺少图片" });
  await updateProductAppearance(appearance_id, image);
  return c.json({ code: 200, message: "更新成功", data: null });
};

export const addBannerController = async (c: any) => {
  const session = c.get("adminSession");
  await assertHasIdentity(session.identitys, productRoles);
  const { product_id } = c.req.param();
  const jsonBody = await c.req.json().catch(() => ({}));
  const body: AddBannerRequest = { ...getFormBody(c), ...jsonBody };
  const files = getUploadedFiles(c);
  const image = files[0]?.filename ?? body.image;
  const sort = body.sort ?? 0;
  if (!image) throw new HTTPException(400, { message: "缺少图片" });
  const data = await addProductBanner(product_id, image, sort);
  return c.json({ code: 200, message: "新增成功", data });
};

export const updateBannerController = async (c: any) => {
  const session = c.get("adminSession");
  await assertHasIdentity(session.identitys, productRoles);
  const { banner_id } = c.req.param();
  const jsonBody = await c.req.json().catch(() => ({}));
  const body: AddBannerRequest = { ...getFormBody(c), ...jsonBody };
  const files = getUploadedFiles(c);
  const image = files[0]?.filename ?? body.image;
  await updateProductBanner(banner_id, { image, sort: body.sort });
  return c.json({ code: 200, message: "更新成功", data: null });
};

