import { Hono } from "hono";
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
  getClientDetailController,
  getClientListController,
  getClientStatisticsController,
  updateClientController,
} from "../../controllers/admin/client-user.controller";
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

// ✅ 新增：全局路由日志中间件（可选，方便排查匹配问题）
admin.use("*", async (c, next) => {
  const path = c.req.path;
  const method = c.req.method;
  console.log(`[Admin Route] ${method} ${path}`);
  await next();
});

// 登录/登出（无参数路由，无需调整）
admin.post("/login", adminLogin);
admin.post("/logout", adminLogout);
admin.get("/permissions", getAdminPermission);

// 个人账号（无参数路由，无需调整）
admin.get("/account/profile", getAccountInfo);
admin.patch("/account/profile", uploadMiddleware, updateAccountInfo);
admin.get("/account/permissions", getAccountPermissions);
admin.patch("/account/password", changeAccountPassword);

// 系统管理员相关（参数路由后置，规范）
admin.get("/system/users", getAllUsers);
admin.get("/system/admins", getAllAdmins);
admin.post("/system/admins", createAdmin);
admin.get("/system/identities", getAllIdentitiesWithPermissions);
admin.get("/system/permissions", getPermissionMenu);
admin.get("/system/admins/online", getOnlineAdmins);
// ✅ 参数路由均放在同层级固定路由之后
admin.post("/system/admins/:admin_id/identities", bindIdentity);
admin.delete("/system/admins/:admin_id/identities/:identity_id", unbindIdentity);
admin.post("/system/admins/:admin_id/logout", kickAdminOffline);
admin.post("/system/admins/:admin_id/disable", disableAdminAccount);
admin.patch("/system/admins/:admin_id/identities/:identity_id/expire", updateAdminIdentityExpireApi);
admin.patch("/system/identities/:identity_id/status", updateIdentityStatusApi);
admin.post("/system/admins/:admin_id/reset-password", resetAdminPasswordApi);

// 商品/仓库管理（核心修复：stats 前置）
admin.get("/brands", listBrandsController);
admin.post("/brands", uploadMiddleware, createBrandController);
admin.patch("/brands/:brand_id", uploadMiddleware, updateBrandController);
admin.get("/categories", listCategoriesController);
admin.post("/products", uploadMiddleware, createProductController);
admin.get("/products", listProductsController);
// ✅ 固定路径路由：stats 放在参数路由前
admin.get("/products/stats", getProductStatsController);
// ✅ 参数路由后置
admin.patch("/products/:product_id", uploadMiddleware, updateProductController);
admin.get("/products/:product_id", getProductDetailController);
admin.patch("/products/:product_id/status", updateProductStatusController);
// 标签相关（无冲突）
admin.post("/tags", createTagController);
admin.patch("/tags/:tag_id", updateTagController);
admin.delete("/tags/:tag_id", deleteTagController);
admin.get("/tags", listTagsController);
admin.post("/product-tags", bindProductTagController);
admin.post("/product-tags/unbind", unbindProductTagController);
// 商品配置相关（参数路由后置）
admin.post("/products/:product_id/configs", uploadMiddleware, addProductConfigController);
admin.get("/products/:product_id/configs", listProductConfigsController);
admin.patch("/configs/:config_id", uploadMiddleware, updateProductConfigController);
admin.get("/configs/:config_id", getProductConfigDetailController);
admin.patch("/configs/:config_id/status", updateProductConfigStatusController);
// 库存相关（无冲突）
admin.get("/stocks", listStocksController);
admin.patch("/stocks/:config_id", updateStockController);
// 商品外观/横幅（参数路由后置）
admin.post("/products/:product_id/appearances", uploadMiddleware, addAppearanceController);
admin.patch("/appearances/:appearance_id", uploadMiddleware, updateAppearanceController);
admin.post("/products/:product_id/banners", uploadMiddleware, addBannerController);
admin.patch("/banners/:banner_id", uploadMiddleware, updateBannerController);

// 货架/上架管理（核心修复：stats 前置）
admin.get("/shelf/products", listShelfProductsController);
admin.post("/shelf/products", createShelfProductController);
// ✅ 固定路径路由：stats 放在参数路由前
admin.get("/shelf/stats", statsShelfController);
// ✅ 参数路由后置
admin.patch("/shelf/products/:shelf_product_id/flags", setShelfFlagsController);
admin.patch("/shelf/products/:shelf_product_id/carousel", uploadMiddleware, setShelfCarouselController);
admin.patch("/shelf/products/:shelf_product_id/status", updateShelfStatusController);
// 货架项相关（参数路由后置）
admin.post("/shelf/items", addShelfProductItemController);
admin.patch("/shelf/items/:shelf_product_item_id", updateShelfProductItemQuantityController);
admin.delete("/shelf/items/:shelf_product_item_id", deleteShelfProductItemController);
// 分类货架/推送相关（无冲突）
admin.get("/shelf/categories/:category_id/products", listCategoryShelfProductsController);
admin.post("/shelf/home-push", uploadMiddleware, setHomePushController);
admin.post("/shelf/new-push", uploadMiddleware, setNewPushController);
admin.get("/shelf/home-push", listHomePushController);
admin.get("/shelf/new-push", listNewPushController);

// 营销（优化：stats 放在同层级参数路由前，保持规范）
admin.get("/marketing/coupons", listCouponsController);
admin.post("/marketing/coupons", createCouponController);
admin.get("/marketing/coupon-center", listCouponCenterController);
admin.post("/marketing/coupon-center", setCouponCenterController);
// ✅ 固定路径路由（center/stats）放在参数路由前
admin.get("/marketing/coupons/:coupon_id", getCouponDetailController);
admin.get("/marketing/coupons/:coupon_id/stats", couponStatsController);
admin.get("/marketing/coupons/:coupon_id/users", listCouponUsersController);
// 优惠券相关（无冲突）
admin.get("/marketing/vouchers", listVouchersController);
admin.post("/marketing/vouchers", createVoucherController);
admin.get("/marketing/vouchers/:voucher_id/users", listVoucherUsersController);
admin.post("/marketing/vouchers/:voucher_id/issue", issueVoucherController);
// 秒杀相关（无冲突）
admin.get("/marketing/seckill-rounds", listSeckillRoundsController);
admin.post("/marketing/seckill-rounds", createSeckillRoundController);
admin.post("/marketing/seckill-products", addSeckillProductController);
admin.post("/marketing/seckill-configs", addSeckillConfigController);

// 订单/售后（参数路由后置，规范）
admin.get("/orders", listOrdersController);
// ✅ 参数路由后置
admin.get("/orders/:order_id", getOrderDetailController);
admin.post("/orders/:order_id/cancel", cancelOrderController);
admin.post("/orders/:order_id/pending-ship", setOrderPendingShipController);
admin.post("/orders/:order_id/ship", shipOrderController);
admin.post("/orders/:order_id/pending-receive", setOrderPendingReceiveController);
// 售后/投诉（参数路由后置）
admin.get("/after-sales", listAfterSalesController);
admin.post("/after-sales/:after_sale_id/handle", handleAfterSaleController);
admin.get("/complaints", listComplaintsController);
admin.post("/complaints/:complaint_id/handle", handleComplaintController);

// 客服（参数路由后置，规范）
admin.get("/service/sessions", listServiceSessionsController);
// ✅ 参数路由后置
admin.get("/service/sessions/:room_id/messages", listServiceMessagesController);
admin.post("/service/sessions/:room_id/end", endServiceSessionController);
admin.post("/service/messages/:message_id/read", markServiceMessageReadController);
admin.post("/service/messages/:message_id/withdraw", withdrawServiceMessageController);

// 客户端管理（用户新增的路由）
admin.get("/clients", getClientListController);
admin.get("/clients/statistics", getClientStatisticsController);
admin.get("/clients/:id", getClientDetailController);
admin.patch("/clients/:id", updateClientController);

export default admin;