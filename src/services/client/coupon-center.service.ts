import { db } from '../../utils/db';
import { CouponCenterListResponse } from '../../types/client/coupon-center.type';
import { UserCouponListResponse } from '../../types/client/user-coupon.type';
import { UserVoucherListResponse } from '../../types/client/user-voucher.type';
import { HTTPException } from 'hono/http-exception';
import { RelationStatus, UserCouponStatus } from '@prisma/client';

export async function listCouponCenterCouponsService(userId?: string): Promise<CouponCenterListResponse> {
  const now = new Date();

  // 查询未到截止时间的可领取券（携带券基础信息）
  const centers = await db.couponCenter.findMany({
    where: { endTime: { gt: now } },
    include: { coupon: true },
    orderBy: { createdAt: 'desc' },
  });

  if (!userId) {
    return { items: centers.map(c => ({ ...c, coupon: c.coupon })) };
  }

  // 判断用户是否已领取：存在 userCoupon 记录即可视为已领取（不关心使用状态）
  const couponIds = centers.map(c => c.couponId);
  if (couponIds.length === 0) return { items: [] };

  const userCoupons = await db.userCoupon.findMany({
    where: {
      userId,
      couponId: { in: couponIds },
    },
    select: { couponId: true },
  });
  const receivedSet = new Set(userCoupons.map(u => u.couponId));

  return {
    items: centers.map(c => ({
      ...c,
      coupon: c.coupon,
      received: receivedSet.has(c.couponId),
    })),
  };
}

export async function claimCouponService(userId: string, couponId: string) {
  if (!userId) throw new HTTPException(401, { message: '未登录' });
  if (!couponId) throw new HTTPException(400, { message: '缺少优惠券ID' });

  const now = new Date();

  // 使用事务确保所有操作原子性
  const result = await db.$transaction(async (tx) => {
    // 找到对应领券中心与优惠券，校验时间窗口
    const center = await tx.couponCenter.findFirst({
      where: { couponId },
      include: { coupon: true },
    });
    if (!center) throw new HTTPException(404, { message: '优惠券不存在或不可领取' });

    // 可领取期：center.startTime <= now <= center.endTime
    if (center.startTime > now || center.endTime < now) {
      throw new HTTPException(400, { message: '不在可领取时间范围内' });
    }
    // 券有效期：coupon.startTime <= now <= coupon.expireTime
    if (center.coupon.startTime > now || center.coupon.expireTime < now) {
      throw new HTTPException(400, { message: '优惠券不在有效期内' });
    }

    // 限领校验：默认每人限领 limitNum（默认1）
    const already = await tx.userCoupon.count({ where: { userId, couponId } });
    if (already >= (center.limitNum ?? 1)) {
      throw new HTTPException(400, { message: '已领取或达到限领次数' });
    }

    // 可选：校验是否还有余量（简化：totalNum > 0）
    if (center.totalNum <= 0) {
      throw new HTTPException(400, { message: '优惠券已被领完' });
    }

    // 创建用户优惠券记录（未使用）
    await tx.userCoupon.create({
      data: {
        userId,
        couponId,
        status: UserCouponStatus.未使用,
        // receiveTime 默认 now()
      },
    });

    // 扣减可领数量
    const updatedCenter = await tx.couponCenter.update({
      where: { id: center.id },
      data: {
        totalNum: {
          decrement: 1,
        },
      },
    });

    // 检查更新后的数量是否为负数（防止并发问题）
    if (updatedCenter.totalNum < 0) {
      throw new HTTPException(500, { message: '优惠券库存异常' });
    }

    return { centerId: center.id, couponId };
  });

  return result;
}



export async function getUserCouponsService(userId: string): Promise<UserCouponListResponse> {
  if (!userId) throw new HTTPException(401, { message: '未登录' });
  const rows = await db.userCoupon.findMany({
    where: { userId },
    include: { coupon: true },
    orderBy: { receiveTime: 'desc' },
  });

  const items = rows.map(uc => ({
    id: uc.id,
    couponId: uc.couponId,
    status: uc.status,
    receiveTime: uc.receiveTime,
    useTime: uc.useTime,
    orderId: uc.orderId,
    actualAmount: uc.actualAmount.toNumber(),
    coupon: {
      id: uc.coupon.id,
      name: uc.coupon.name,
      type: uc.coupon.type,
      amount: uc.coupon.amount.toNumber(),
      discount: uc.coupon.discount.toNumber(),
      threshold: uc.coupon.threshold.toNumber(),
      condition: uc.coupon.condition,
      scope: uc.coupon.scope,
      startTime: uc.coupon.startTime,
      expireTime: uc.coupon.expireTime,
      isStackable: uc.coupon.isStackable,
    },
  }));

  return { items };
}

export async function getUserVouchersService(userId: string): Promise<UserVoucherListResponse> {
  if (!userId) throw new HTTPException(401, { message: '未登录' });
  const rows = await db.userVoucher.findMany({
    where: { userId },
    include: { voucher: true },
    orderBy: { getTime: 'desc' },
  });

  const items = rows.map(uv => ({
    id: uv.id,
    userId: uv.userId,
    voucherId: uv.voucherId,
    status: uv.status,
    getTime: uv.getTime,
    useUpTime: uv.useUpTime,
    usedAmount: uv.usedAmount.toNumber(),
    remainAmount: uv.remainAmount.toNumber(),
    voucher: {
      id: uv.voucher.id,
      title: uv.voucher.title,
      description: uv.voucher.description,
      originalAmount: uv.voucher.originalAmount.toNumber(),
      startTime: uv.voucher.startTime,
      endTime: uv.voucher.endTime,
      creatorId: uv.voucher.creatorId,
      remark: uv.voucher.remark,
    },
  }));

  return { items };
}


export async function getCouponsByProductService(userId: string, productId: string): Promise<UserCouponListResponse> {
  if (!productId) throw new HTTPException(400, { message: "缺少参数" });

  // 获取用户的所有优惠券
  const items = await getUserCouponsService(userId);
  
  // 查询该商品可用的优惠券ID列表
  const validCouponRelations = await db.productCouponRelation.findMany({
    where: {
      productId,
      status: RelationStatus.生效, // 只查询状态为生效的关联
      couponId: {
        in: items.items.map(item => item.couponId) // 只查询用户拥有的优惠券
      }
    },
    select: {
      couponId: true
    }
  });
  
  // 创建可用的优惠券ID集合，便于快速查找
  const validCouponIds = new Set(validCouponRelations.map(rel => rel.couponId));
  
  // 为每个优惠券添加 useOK 字段
  const itemsWithUseOK = items.items.map(item => ({
    ...item,
    useOK: validCouponIds.has(item.couponId) // 如果优惠券在可用列表中，则 useOK 为 true
  }));
  
  return { items: itemsWithUseOK };
}
