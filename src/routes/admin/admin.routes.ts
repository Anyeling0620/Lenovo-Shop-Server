import { Hono } from 'hono';
import { uploadMiddleware } from "../../middleware/upload.middleware";
import { adminLogin, adminLogout } from "../../controllers/admin/admin.controller";
import { getAdminPermission } from "../../controllers/admin/permission.controller";
import {
  changeAccountPassword,
  getAccountInfo,
  getAccountPermissions,
  updateAccountInfo,
} from "../../controllers/admin/account.controller";
import {
  bindIdentity,
  createAdmin,
  disableAdminAccount,
  getAllAdmins,
  getAllIdentitiesWithPermissions,
  getAllUsers,
  getOnlineAdmins,
  getPermissionMenu,
  kickAdminOffline,
  resetAdminPasswordApi,
  unbindIdentity,
  updateAdminIdentityExpireApi,
  updateIdentityStatusApi,
} from "../../controllers/admin/system.controller";
import {
  addAppearanceController,
  addBannerController,
  addProductConfigController,
  bindProductTagController,
  createBrandController,
  createProductController,
  createTagController,
  deleteTagController,
  getProductConfigDetailController,
  getProductDetailController,
  getProductStatsController,
  listBrandsController,
  listCategoriesController,
  listProductConfigsController,
  listProductsController,
  listStocksController,
  listTagsController,
  unbindProductTagController,
  updateAppearanceController,
  updateBannerController,
  updateBrandController,
  updateProductConfigController,
  updateProductConfigStatusController,
  updateProductController,
  updateProductStatusController,
  updateStockController,
  updateTagController,
} from "../../controllers/admin/product-admin.controller";
import {
  addShelfProductItemController,
  createShelfProductController,
  deleteShelfProductItemController,
  listCategoryShelfProductsController,
  listHomePushController,
  listNewPushController,
  listShelfProductsController,
  setHomePushController,
  setNewPushController,
  setShelfCarouselController,
  setShelfFlagsController,
  statsShelfController,
  updateShelfProductItemQuantityController,
  updateShelfStatusController,
} from "../../controllers/admin/shelf.controller";
import {
  addSeckillConfigController,
  addSeckillProductController,
  couponStatsController,
  createCouponController,
  createSeckillRoundController,
  createVoucherController,
  getCouponDetailController,
  issueVoucherController,
  listCouponCenterController,
  listCouponUsersController,
  listCouponsController,
  listSeckillRoundsController,
  listVoucherUsersController,
  listVouchersController,
  setCouponCenterController,
} from "../../controllers/admin/marketing.controller";
import {
  cancelOrderController,
  getOrderDetailController,
  handleAfterSaleController,
  handleComplaintController,
  listAfterSalesController,
  listComplaintsController,
  listOrdersController,
  setOrderPendingReceiveController,
  setOrderPendingShipController,
  shipOrderController,
} from "../../controllers/admin/order.controller";
import {
  endServiceSessionController,
  listServiceMessagesController,
  listServiceSessionsController,
  markServiceMessageReadController,
  withdrawServiceMessageController,
} from "../../controllers/admin/service.controller";

const admin = new Hono();

// 登录/登出
admin.post("/login", adminLogin);
admin.post("/logout", adminLogout);
admin.get("/permissions", getAdminPermission);

// 个人账号
admin.get("/account/profile", getAccountInfo);
admin.patch("/account/profile", uploadMiddleware, updateAccountInfo);
admin.get("/account/permissions", getAccountPermissions);
admin.patch("/account/password", changeAccountPassword);

// 系统管理员相关
admin.get("/system/users", getAllUsers);
admin.get("/system/admins", getAllAdmins);
admin.post("/system/admins", createAdmin);
admin.get("/system/identities", getAllIdentitiesWithPermissions);
admin.get("/system/permissions", getPermissionMenu);
admin.post("/system/admins/:admin_id/identities", bindIdentity);
admin.delete("/system/admins/:admin_id/identities/:identity_id", unbindIdentity);
admin.get("/system/admins/online", getOnlineAdmins);
admin.post("/system/admins/:admin_id/logout", kickAdminOffline);
admin.post("/system/admins/:admin_id/disable", disableAdminAccount);
admin.patch("/system/admins/:admin_id/identities/:identity_id/expire", updateAdminIdentityExpireApi);
admin.patch("/system/identities/:identity_id/status", updateIdentityStatusApi);
admin.post("/system/admins/:admin_id/reset-password", resetAdminPasswordApi);

// 商品/仓库管理
admin.get("/brands", listBrandsController);
admin.post("/brands", uploadMiddleware, createBrandController);
admin.patch("/brands/:brand_id", uploadMiddleware, updateBrandController);
admin.get("/categories", listCategoriesController);
admin.post("/products", uploadMiddleware, createProductController);
admin.patch("/products/:product_id", uploadMiddleware, updateProductController);
admin.get("/products", listProductsController);
admin.get("/products/:product_id", getProductDetailController);
admin.patch("/products/:product_id/status", updateProductStatusController);
admin.post("/tags", createTagController);
admin.patch("/tags/:tag_id", updateTagController);
admin.delete("/tags/:tag_id", deleteTagController);
admin.get("/tags", listTagsController);
admin.post("/product-tags", bindProductTagController);
admin.post("/product-tags/unbind", unbindProductTagController);
admin.post("/products/:product_id/configs", uploadMiddleware, addProductConfigController);
admin.patch("/configs/:config_id", uploadMiddleware, updateProductConfigController);
admin.get("/products/:product_id/configs", listProductConfigsController);
admin.get("/configs/:config_id", getProductConfigDetailController);
admin.get("/products/stats", getProductStatsController);
admin.get("/stocks", listStocksController);
admin.patch("/stocks/:config_id", updateStockController);
admin.patch("/configs/:config_id/status", updateProductConfigStatusController);
admin.post("/products/:product_id/appearances", uploadMiddleware, addAppearanceController);
admin.patch("/appearances/:appearance_id", uploadMiddleware, updateAppearanceController);
admin.post("/products/:product_id/banners", uploadMiddleware, addBannerController);
admin.patch("/banners/:banner_id", uploadMiddleware, updateBannerController);

// 货架/上架管理
admin.get("/shelf/products", listShelfProductsController);
admin.post("/shelf/products", createShelfProductController);
admin.patch("/shelf/products/:shelf_product_id/flags", setShelfFlagsController);
admin.post("/shelf/items", addShelfProductItemController);
admin.patch("/shelf/items/:shelf_product_item_id", updateShelfProductItemQuantityController);
admin.delete("/shelf/items/:shelf_product_item_id", deleteShelfProductItemController);
admin.patch("/shelf/products/:shelf_product_id/carousel", uploadMiddleware, setShelfCarouselController);
admin.get("/shelf/stats", statsShelfController);
admin.get("/shelf/categories/:category_id/products", listCategoryShelfProductsController);
admin.post("/shelf/home-push", uploadMiddleware, setHomePushController);
admin.post("/shelf/new-push", uploadMiddleware, setNewPushController);
admin.get("/shelf/home-push", listHomePushController);
admin.get("/shelf/new-push", listNewPushController);
admin.patch("/shelf/products/:shelf_product_id/status", updateShelfStatusController);

// 营销
admin.get("/marketing/coupons", listCouponsController);
admin.get("/marketing/coupon-center", listCouponCenterController);
admin.get("/marketing/coupons/:coupon_id", getCouponDetailController);
admin.post("/marketing/coupons", createCouponController);
admin.post("/marketing/coupon-center", setCouponCenterController);
admin.get("/marketing/coupons/:coupon_id/users", listCouponUsersController);
admin.get("/marketing/coupons/:coupon_id/stats", couponStatsController);
admin.get("/marketing/vouchers", listVouchersController);
admin.post("/marketing/vouchers", createVoucherController);
admin.get("/marketing/vouchers/:voucher_id/users", listVoucherUsersController);
admin.post("/marketing/vouchers/:voucher_id/issue", issueVoucherController);
admin.get("/marketing/seckill-rounds", listSeckillRoundsController);
admin.post("/marketing/seckill-rounds", createSeckillRoundController);
admin.post("/marketing/seckill-products", addSeckillProductController);
admin.post("/marketing/seckill-configs", addSeckillConfigController);

// 订单/售后
admin.get("/orders", listOrdersController);
admin.get("/orders/:order_id", getOrderDetailController);
admin.post("/orders/:order_id/cancel", cancelOrderController);
admin.post("/orders/:order_id/pending-ship", setOrderPendingShipController);
admin.post("/orders/:order_id/ship", shipOrderController);
admin.post("/orders/:order_id/pending-receive", setOrderPendingReceiveController);
admin.get("/after-sales", listAfterSalesController);
admin.post("/after-sales/:after_sale_id/handle", handleAfterSaleController);
admin.get("/complaints", listComplaintsController);
admin.post("/complaints/:complaint_id/handle", handleComplaintController);

// 客服
admin.get("/service/sessions", listServiceSessionsController);
admin.get("/service/sessions/:room_id/messages", listServiceMessagesController);
admin.post("/service/messages/:message_id/read", markServiceMessageReadController);
admin.post("/service/sessions/:room_id/end", endServiceSessionController);
admin.post("/service/messages/:message_id/withdraw", withdrawServiceMessageController);

export default admin;
