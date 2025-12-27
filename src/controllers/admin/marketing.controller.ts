import { HTTPException } from "hono/http-exception";
import { assertHasIdentity } from "../../utils/admin-auth";
import {
  addSeckillConfig,
  addSeckillProduct,
  couponStats,
  createCoupon,
  createSeckillRound,
  createVoucher,
  getCouponDetail,
  issueVoucher,
  listCouponCenter,
  listCouponUsers,
  listCoupons,
  listSeckillRounds,
  listVoucherUsers,
  listVouchers,
  setCouponToCenter,
} from "../../services/admin/marketing.service";
import {
  CouponCenterRequest,
  CouponCenterResponse,
  CouponCreateRequest,
  CouponResponse,
  CouponStatsResponse,
  CouponUserResponse,
  IssueVoucherRequest,
  SeckillConfigCreateRequest,
  SeckillProductCreateRequest,
  SeckillRoundCreateRequest,
  SeckillRoundResponse,
  VoucherCreateRequest,
  VoucherResponse,
  VoucherUserResponse,
} from "../../types/admin/api.type";

const marketingRoles = ["SUPER_ADMIN", "SYSTEM_ADMIN", "MARKETING"];

export const listCouponsController = async (c: any) => {
  const session = c.get("adminSession");
  await assertHasIdentity(session.identitys, marketingRoles);
  const data: CouponResponse[] = await listCoupons();
  return c.json({ code: 200, message: "success", data });
};

export const listCouponCenterController = async (c: any) => {
  const session = c.get("adminSession");
  await assertHasIdentity(session.identitys, marketingRoles);
  const data: CouponCenterResponse[] = await listCouponCenter();
  return c.json({ code: 200, message: "success", data });
};

export const getCouponDetailController = async (c: any) => {
  const session = c.get("adminSession");
  await assertHasIdentity(session.identitys, marketingRoles);
  const { coupon_id } = c.req.param();
  const data: CouponResponse = await getCouponDetail(coupon_id);
  return c.json({ code: 200, message: "success", data });
};

export const createCouponController = async (c: any) => {
  const session = c.get("adminSession");
  await assertHasIdentity(session.identitys, marketingRoles);
  const body: CouponCreateRequest = await c.req.json();
  if (!body.name || !body.type || !body.start_time || !body.expire_time) {
    throw new HTTPException(400, { message: "缺少必填字段" });
  }
  const data = await createCoupon({
    name: body.name,
    type: body.type,
    amount: body.amount,
    discount: body.discount,
    threshold: body.threshold,
    condition: body.condition,
    scope: body.scope,
    startTime: new Date(body.start_time),
    expireTime: new Date(body.expire_time),
    isStackable: body.is_stackable,
    creatorId: session.admin_id,
  });
  return c.json({ code: 200, message: "创建成功", data });
};

export const setCouponCenterController = async (c: any) => {
  const session = c.get("adminSession");
  await assertHasIdentity(session.identitys, marketingRoles);
  const body: CouponCenterRequest = await c.req.json();
  const data = await setCouponToCenter({
    couponId: body.coupon_id,
    startTime: new Date(body.start_time),
    endTime: new Date(body.end_time),
    totalNum: body.total_num,
    limitNum: body.limit_num,
    creatorId: session.admin_id,
  });
  return c.json({ code: 200, message: "设置成功", data });
};

export const listCouponUsersController = async (c: any) => {
  const session = c.get("adminSession");
  await assertHasIdentity(session.identitys, marketingRoles);
  const { coupon_id } = c.req.param();
  const data: CouponUserResponse[] = await listCouponUsers(coupon_id);
  return c.json({ code: 200, message: "success", data });
};

export const couponStatsController = async (c: any) => {
  const session = c.get("adminSession");
  await assertHasIdentity(session.identitys, marketingRoles);
  const { coupon_id } = c.req.param();
  const data: CouponStatsResponse = await couponStats(coupon_id);
  return c.json({ code: 200, message: "success", data });
};

export const listVouchersController = async (c: any) => {
  const session = c.get("adminSession");
  await assertHasIdentity(session.identitys, marketingRoles);
  const data: VoucherResponse[] = await listVouchers();
  return c.json({ code: 200, message: "success", data });
};

export const createVoucherController = async (c: any) => {
  const session = c.get("adminSession");
  await assertHasIdentity(session.identitys, marketingRoles);
  const body: VoucherCreateRequest = await c.req.json();
  const data = await createVoucher({
    title: body.title,
    description: body.description,
    originalAmount: body.original_amount,
    startTime: new Date(body.start_time),
    endTime: new Date(body.end_time),
    creatorId: session.admin_id,
    remark: body.remark,
  });
  return c.json({ code: 200, message: "创建成功", data });
};

export const listVoucherUsersController = async (c: any) => {
  const session = c.get("adminSession");
  await assertHasIdentity(session.identitys, marketingRoles);
  const { voucher_id } = c.req.param();
  const data: VoucherUserResponse[] = await listVoucherUsers(voucher_id);
  return c.json({ code: 200, message: "success", data });
};

export const issueVoucherController = async (c: any) => {
  const session = c.get("adminSession");
  await assertHasIdentity(session.identitys, marketingRoles);
  const { voucher_id } = c.req.param();
  const body: IssueVoucherRequest = await c.req.json();
  if (!Array.isArray(body.user_ids) || body.user_ids.length === 0) {
    throw new HTTPException(400, { message: "user_ids 不能为空" });
  }
  await issueVoucher({ voucherId: voucher_id, userIds: body.user_ids });
  return c.json({ code: 200, message: "发放成功", data: null });
};

export const listSeckillRoundsController = async (c: any) => {
  const session = c.get("adminSession");
  await assertHasIdentity(session.identitys, marketingRoles);
  const data: SeckillRoundResponse[] = await listSeckillRounds();
  return c.json({ code: 200, message: "success", data });
};

export const createSeckillRoundController = async (c: any) => {
  const session = c.get("adminSession");
  await assertHasIdentity(session.identitys, marketingRoles);
  const body: SeckillRoundCreateRequest = await c.req.json();
  const data = await createSeckillRound({
    title: body.title,
    startTime: new Date(body.start_time),
    endTime: new Date(body.end_time),
    creatorId: session.admin_id,
    status: body.status,
    remark: body.remark,
  });
  return c.json({ code: 200, message: "创建成功", data });
};

export const addSeckillProductController = async (c: any) => {
  const session = c.get("adminSession");
  await assertHasIdentity(session.identitys, marketingRoles);
  const body: SeckillProductCreateRequest = await c.req.json();
  const data = await addSeckillProduct({
    roundId: body.round_id,
    productId: body.product_id,
    type: body.type,
    reduceAmount: body.reduce_amount,
    discount: body.discount,
  });
  return c.json({ code: 200, message: "设置成功", data });
};

export const addSeckillConfigController = async (c: any) => {
  const session = c.get("adminSession");
  await assertHasIdentity(session.identitys, marketingRoles);
  const body: SeckillConfigCreateRequest = await c.req.json();
  const data = await addSeckillConfig({
    seckillProductId: body.seckill_product_id,
    configId: body.config_id,
    shelfNum: body.shelf_num,
    seckillPrice: body.seckill_price,
  });
  return c.json({ code: 200, message: "设置成功", data });
};

