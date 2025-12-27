import { assertHasIdentity } from "../../utils/admin-auth";
import {
  addShelfProductItem,
  createShelfProduct,
  deleteShelfProductItem,
  listCategoryShelfProducts,
  listHomePush,
  listNewPush,
  listShelfProducts,
  setHomePush,
  setNewPush,
  setShelfCarousel,
  statsShelfByCategory,
  updateShelfProductFlags,
  updateShelfProductItemQuantity,
  updateShelfProductStatus,
} from "../../services/admin/shelf.service";
import { ShelfProductStatus } from "@prisma/client";
import { getFormBody, getUploadedFiles } from "../../middleware/upload.middleware";
import {
  HomePushRequest,
  HomePushResponse,
  NewPushResponse,
  ShelfCarouselRequest,
  ShelfFlagsRequest,
  ShelfProductCreateRequest,
  ShelfProductItemCreateRequest,
  ShelfProductItemResponse,
  ShelfProductItemUpdateRequest,
  ShelfProductResponse,
  ShelfStatsResponse,
  ShelfStatusRequest,
} from "../../types/admin/api.type";

const productRoles = ["SUPER_ADMIN", "PRODUCT_MANAGER", "WAREHOUSE_MANAGER"];

export const listShelfProductsController = async (c: any) => {
  const session = c.get("adminSession");
  await assertHasIdentity(session.identitys, productRoles);
  const q = c.req.query();
  const data: ShelfProductResponse[] = await listShelfProducts({
    categoryId: q.category_id,
    status: q.status as ShelfProductStatus | undefined,
  });
  return c.json({ code: 200, message: "success", data });
};

export const createShelfProductController = async (c: any) => {
  const session = c.get("adminSession");
  await assertHasIdentity(session.identitys, productRoles);
  const body: ShelfProductCreateRequest = await c.req.json();
  const data = await createShelfProduct(session.categories, {
    productId: body.product_id,
    categoryId: body.category_id,
  });
  return c.json({ code: 200, message: "创建成功", data });
};

export const setShelfFlagsController = async (c: any) => {
  const session = c.get("adminSession");
  await assertHasIdentity(session.identitys, productRoles);
  const { shelf_product_id } = c.req.param();
  const body: ShelfFlagsRequest = await c.req.json();
  await updateShelfProductFlags(session.categories, shelf_product_id, {
    isSelfOperated: body.is_self_operated,
    isCustomizable: body.is_customizable,
    installment: body.installment,
  });
  return c.json({ code: 200, message: "更新成功", data: null });
};

export const addShelfProductItemController = async (c: any) => {
  const session = c.get("adminSession");
  await assertHasIdentity(session.identitys, productRoles);
  const body: ShelfProductItemCreateRequest = await c.req.json();
  const data = await addShelfProductItem(session.categories, {
    shelfProductId: body.shelf_product_id,
    configId: body.config_id,
    shelfNum: body.shelf_num,
  });
  return c.json({ code: 200, message: "新增成功", data });
};

export const updateShelfProductItemQuantityController = async (c: any) => {
  const session = c.get("adminSession");
  await assertHasIdentity(session.identitys, productRoles);
  const { shelf_product_item_id } = c.req.param();
  const body: ShelfProductItemUpdateRequest = await c.req.json();
  await updateShelfProductItemQuantity(session.categories, shelf_product_item_id, {
    shelfNum: body.shelf_num,
    lockNum: body.lock_num,
  });
  return c.json({ code: 200, message: "更新成功", data: null });
};

export const deleteShelfProductItemController = async (c: any) => {
  const session = c.get("adminSession");
  await assertHasIdentity(session.identitys, productRoles);
  const { shelf_product_item_id } = c.req.param();
  await deleteShelfProductItem(session.categories, shelf_product_item_id);
  return c.json({ code: 200, message: "移除成功", data: null });
};

export const setShelfCarouselController = async (c: any) => {
  const session = c.get("adminSession");
  await assertHasIdentity(session.identitys, productRoles);
  const { shelf_product_id } = c.req.param();
  const jsonBody = await c.req.json().catch(() => ({}));
  const body: ShelfCarouselRequest = { ...getFormBody(c), ...jsonBody };
  const files = getUploadedFiles(c);
  const carouselImage = files[0]?.filename ?? body.carousel_image;
  await setShelfCarousel(session.categories, shelf_product_id, {
    isCarousel: body.is_carousel,
    carouselImage,
  });
  return c.json({ code: 200, message: "更新成功", data: null });
};

export const statsShelfController = async (c: any) => {
  const session = c.get("adminSession");
  await assertHasIdentity(session.identitys, productRoles);
  const data: ShelfStatsResponse[] = await statsShelfByCategory();
  return c.json({ code: 200, message: "success", data });
};

export const listCategoryShelfProductsController = async (c: any) => {
  const session = c.get("adminSession");
  await assertHasIdentity(session.identitys, productRoles);
  const { category_id } = c.req.param();
  const data: ShelfProductResponse[] = await listCategoryShelfProducts(category_id);
  return c.json({ code: 200, message: "success", data });
};

export const setHomePushController = async (c: any) => {
  const session = c.get("adminSession");
  await assertHasIdentity(session.identitys, productRoles);
  const jsonBody = await c.req.json().catch(() => ({}));
  const body: HomePushRequest = { ...getFormBody(c), ...jsonBody };
  const files = getUploadedFiles(c);
  const carouselImage = files[0]?.filename ?? body.carousel_image;
  const data = await setHomePush({
    shelfProductId: body.shelf_product_id,
    startTime: new Date(body.start_time),
    endTime: new Date(body.end_time),
    isCarousel: body.is_carousel,
    carouselImage,
  });
  return c.json({ code: 200, message: "设置成功", data });
};

export const setNewPushController = async (c: any) => {
  const session = c.get("adminSession");
  await assertHasIdentity(session.identitys, productRoles);
  const jsonBody = await c.req.json().catch(() => ({}));
  const body: HomePushRequest = { ...getFormBody(c), ...jsonBody };
  const files = getUploadedFiles(c);
  const carouselImage = files[0]?.filename ?? body.carousel_image;
  const data = await setNewPush({
    shelfProductId: body.shelf_product_id,
    startTime: new Date(body.start_time),
    endTime: new Date(body.end_time),
    isCarousel: body.is_carousel,
    carouselImage,
  });
  return c.json({ code: 200, message: "设置成功", data });
};

export const listHomePushController = async (c: any) => {
  const session = c.get("adminSession");
  await assertHasIdentity(session.identitys, productRoles);
  const data: HomePushResponse[] = await listHomePush();
  return c.json({ code: 200, message: "success", data });
};

export const listNewPushController = async (c: any) => {
  const session = c.get("adminSession");
  await assertHasIdentity(session.identitys, productRoles);
  const data: NewPushResponse[] = await listNewPush();
  return c.json({ code: 200, message: "success", data });
};

export const updateShelfStatusController = async (c: any) => {
  const session = c.get("adminSession");
  await assertHasIdentity(session.identitys, productRoles);
  const { shelf_product_id } = c.req.param();
  const body: ShelfStatusRequest = await c.req.json();
  await updateShelfProductStatus(session.categories, shelf_product_id, body.status as ShelfProductStatus);
  return c.json({ code: 200, message: "更新成功", data: null });
};

