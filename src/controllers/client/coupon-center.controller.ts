import { Context } from 'hono';
import { claimCouponService, getUserCouponsService, getUserVouchersService, listCouponCenterCouponsService } from '../../services/client/coupon-center.service';

export async function getCouponCenterCouponsController(c: Context) {
  const user = c.get('user');
  const userId = (user?.user_id) as string | undefined;
  const data = await listCouponCenterCouponsService(userId);
  return c.json({ code: 200, message: 'success', data });
}

export async function claimCouponController(c: Context) {
  const user = c.get('user');
  const userId = ( user?.user_id) as string 

  const body = await c.req.json();
  const couponId = body?.couponId as string | undefined;
  await claimCouponService(userId, couponId || '');
  return c.json({ code: 201, message: 'success', data: null }, 201);
}


export async function getUserCouponsController(c: Context) {
  const user = c.get('user');
  const userId = user?.user_id as string;
  const userCoupons = await getUserCouponsService(userId);
  return c.json({
    code:200,
     message: 'success', 
     data: userCoupons
  },200)
}

export async function getUserVouchersController(c: Context) {
  const user = c.get('user');
  const userId = user?.user_id as string;
  const data = await getUserVouchersService(userId);
  return c.json({ code: 200, message: 'success', data }, 200);
}
