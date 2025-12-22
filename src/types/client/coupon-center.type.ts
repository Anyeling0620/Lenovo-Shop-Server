import { CouponItem } from './product.type';

// 单条领券中心可领优惠券项；当提供 userId 时，附带 received 字段
export interface CouponCenterItem extends CouponItem {
  received?: boolean;
}

export interface CouponCenterListResponse {
  items: CouponCenterItem[];
}

