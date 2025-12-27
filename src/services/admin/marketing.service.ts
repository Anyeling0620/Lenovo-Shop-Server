import { HTTPException } from "hono/http-exception";
import { db } from "../../utils/db";
import {
  RelationStatus,
  SeckillProductConfigStatus,
  SeckillRoundStatus,
  SeckillType,
} from "@prisma/client";
import {
  CouponCenterResponse,
  CouponResponse,
  CouponStatsResponse,
  CouponUserResponse,
  SeckillRoundResponse,
  VoucherResponse,
  VoucherUserResponse,
} from "../../types/admin/api.type";

export const listCoupons = async (): Promise<CouponResponse[]> => {
  const coupons = await db.coupon.findMany({
    include: { center: true },
    orderBy: { createdAt: "desc" },
  });
  return coupons.map((c) => ({
    coupon_id: c.id,
    name: c.name,
    type: c.type,
    amount: c.amount,
    discount: c.discount,
    threshold: c.threshold,
    start_time: c.startTime,
    expire_time: c.expireTime,
    is_stackable: c.isStackable,
    center: c.center
      ? {
          coupon_center_id: c.center.id,
          coupon_id: c.id,
          coupon_name: c.name,
          start_time: c.center.startTime,
          end_time: c.center.endTime,
          total_num: c.center.totalNum,
          limit_num: c.center.limitNum,
        }
      : null,
  })) as CouponResponse[];
};

export const listCouponCenter = async (): Promise<CouponCenterResponse[]> => {
  const list = await db.couponCenter.findMany({
    include: { coupon: true },
  });
  return list.map((c) => ({
    coupon_center_id: c.id,
    coupon_id: c.couponId,
    coupon_name: c.coupon.name,
    start_time: c.startTime,
    end_time: c.endTime,
    total_num: c.totalNum,
    limit_num: c.limitNum,
  })) as CouponCenterResponse[];
};

export const getCouponDetail = async (couponId: string): Promise<CouponResponse> => {
  const coupon = await db.coupon.findUnique({
    where: { id: couponId },
    include: {
      center: true,
      productRelations: true,
    },
  });
  if (!coupon) throw new HTTPException(404, { message: "优惠券不存在" });

  return {
    coupon_id: coupon.id,
    name: coupon.name,
    type: coupon.type,
    amount: coupon.amount,
    discount: coupon.discount,
    threshold: coupon.threshold,
    start_time: coupon.startTime,
    expire_time: coupon.expireTime,
    is_stackable: coupon.isStackable,
    center: coupon.center
      ? {
          coupon_center_id: coupon.center.id,
          coupon_id: coupon.id,
          coupon_name: coupon.name,
          start_time: coupon.center.startTime,
          end_time: coupon.center.endTime,
          total_num: coupon.center.totalNum,
          limit_num: coupon.center.limitNum,
        }
      : null,
    products: coupon.productRelations.map((r) => ({
      product_coupon_relation_id: r.id,
      product_id: r.productId,
      status: r.status,
    })),
  } as CouponResponse;
};

export const createCoupon = async (payload: {
  name: string;
  type: any;
  amount: any;
  discount: any;
  threshold: any;
  condition?: string | null;
  scope?: string | null;
  startTime: Date;
  expireTime: Date;
  isStackable?: boolean;
  creatorId: string;
}) => {
  const coupon = await db.coupon.create({
    data: {
      name: payload.name,
      type: payload.type,
      amount: payload.amount,
      discount: payload.discount,
      threshold: payload.threshold,
      condition: payload.condition,
      scope: payload.scope,
      startTime: payload.startTime,
      expireTime: payload.expireTime,
      isStackable: payload.isStackable ?? false,
      creatorId: payload.creatorId,
    },
  });
  return { coupon_id: coupon.id };
};

export const setCouponToCenter = async (payload: {
  couponId: string;
  startTime: Date;
  endTime: Date;
  totalNum: number;
  limitNum: number;
  creatorId: string;
}) => {
  const center = await db.couponCenter.upsert({
    where: { couponId: payload.couponId },
    update: {
      startTime: payload.startTime,
      endTime: payload.endTime,
      totalNum: payload.totalNum,
      limitNum: payload.limitNum,
    },
    create: {
      couponId: payload.couponId,
      startTime: payload.startTime,
      endTime: payload.endTime,
      totalNum: payload.totalNum,
      limitNum: payload.limitNum,
      creatorId: payload.creatorId,
    },
  });
  return { coupon_center_id: center.id };
};

export const listCouponUsers = async (couponId: string): Promise<CouponUserResponse[]> => {
  const list = await db.userCoupon.findMany({
    where: { couponId },
    include: { user: true },
  });
  return list.map((u) => ({
    user_coupon_id: u.id,
    user_id: u.userId,
    user_account: u.user.account,
    status: u.status,
    receive_time: u.receiveTime,
    use_time: u.useTime,
    order_id: u.orderId,
    actual_amount: u.actualAmount,
  })) as CouponUserResponse[];
};

export const couponStats = async (couponId: string): Promise<CouponStatsResponse> => {
  const total = await db.userCoupon.count({ where: { couponId } });
  const used = await db.userCoupon.count({ where: { couponId, useTime: { not: null } } });
  return { total, used, unused: total - used } as CouponStatsResponse;
};

export const listVouchers = async (): Promise<VoucherResponse[]> => {
  const vouchers = await db.voucher.findMany({
    orderBy: { startTime: "desc" },
  });
  return vouchers.map((v) => ({
    voucher_id: v.id,
    title: v.title,
    original_amount: v.originalAmount,
    start_time: v.startTime,
    end_time: v.endTime,
  })) as VoucherResponse[];
};

export const createVoucher = async (payload: {
  title: string;
  description?: string | null;
  originalAmount: any;
  startTime: Date;
  endTime: Date;
  creatorId: string;
  remark?: string | null;
}) => {
  const voucher = await db.voucher.create({
    data: {
      title: payload.title,
      description: payload.description,
      originalAmount: payload.originalAmount,
      startTime: payload.startTime,
      endTime: payload.endTime,
      creatorId: payload.creatorId,
      remark: payload.remark,
    },
  });
  return { voucher_id: voucher.id };
};

export const listVoucherUsers = async (voucherId: string): Promise<VoucherUserResponse[]> => {
  const list = await db.userVoucher.findMany({
    where: { voucherId },
    include: { user: true },
  });
  return list.map((u) => ({
    user_voucher_id: u.id,
    user_id: u.userId,
    user_account: u.user.account,
    status: u.status,
    get_time: u.getTime,
    use_up_time: u.useUpTime,
    remain_amount: u.remainAmount,
  })) as VoucherUserResponse[];
};

export const issueVoucher = async (payload: { voucherId: string; userIds: string[] }) => {
  const data = payload.userIds.map((userId) => ({
    userId,
    voucherId: payload.voucherId,
    remainAmount: 0,
  }));
  await db.userVoucher.createMany({ data, skipDuplicates: true });
  return true;
};

export const listSeckillRounds = async (): Promise<SeckillRoundResponse[]> => {
  const rounds = await db.seckillRound.findMany({
    orderBy: { startTime: "desc" },
  });
  return rounds.map((r) => ({
    seckill_round_id: r.id,
    title: r.title,
    start_time: r.startTime,
    end_time: r.endTime,
    status: r.status,
  })) as SeckillRoundResponse[];
};

export const createSeckillRound = async (payload: {
  title: string;
  startTime: Date;
  endTime: Date;
  creatorId: string;
  status?: SeckillRoundStatus;
  remark?: string | null;
}) => {
  const round = await db.seckillRound.create({
    data: {
      title: payload.title,
      startTime: payload.startTime,
      endTime: payload.endTime,
      creatorId: payload.creatorId,
      status: payload.status ?? SeckillRoundStatus.启用,
      remark: payload.remark,
    },
  });
  return { seckill_round_id: round.id };
};

export const addSeckillProduct = async (payload: {
  roundId: string;
  productId: string;
  type: SeckillType;
  reduceAmount?: any;
  discount?: any;
}) => {
  const round = await db.seckillRound.findUnique({ where: { id: payload.roundId } });
  if (!round) throw new HTTPException(404, { message: "轮次不存在" });
  const product = await db.product.findUnique({ where: { id: payload.productId } });
  if (!product) throw new HTTPException(404, { message: "商品不存在" });

  const record = await db.seckillProduct.upsert({
    where: { roundId_productId: { roundId: payload.roundId, productId: payload.productId } },
    update: {
      type: payload.type,
      reduceAmount: payload.reduceAmount ?? 0,
      discount: payload.discount ?? 1,
    },
    create: {
      roundId: payload.roundId,
      productId: payload.productId,
      type: payload.type,
      reduceAmount: payload.reduceAmount ?? 0,
      discount: payload.discount ?? 1,
    },
  });
  return { seckill_product_id: record.id };
};

export const addSeckillConfig = async (payload: {
  seckillProductId: string;
  configId: string;
  shelfNum: number;
  seckillPrice: any;
}) => {
  // 确保上架库存够
  const shelfItem = await db.shelfProductItem.findFirst({
    where: { configId: payload.configId },
  });
  if (!shelfItem || shelfItem.shelfNum < payload.shelfNum) {
    throw new HTTPException(400, { message: "上架数量不足，无法用于秒杀" });
  }

  const record = await db.seckillProductConfig.upsert({
    where: {
      seckillProductId_configId: {
        seckillProductId: payload.seckillProductId,
        configId: payload.configId,
      },
    },
    update: {
      shelfNum: payload.shelfNum,
      remainNum: payload.shelfNum,
      seckillPrice: payload.seckillPrice,
    },
    create: {
      seckillProductId: payload.seckillProductId,
      configId: payload.configId,
      shelfNum: payload.shelfNum,
      remainNum: payload.shelfNum,
      seckillPrice: payload.seckillPrice,
      status: SeckillProductConfigStatus.正常,
    },
  });

  // 扣减上架数量
  await db.shelfProductItem.update({
    where: { id: shelfItem.id },
    data: { shelfNum: shelfItem.shelfNum - payload.shelfNum },
  });

  return { seckill_product_config_id: record.id };
};
