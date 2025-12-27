
export interface UserCouponItem {
  id: string;               // userCoupon id
  couponId: string;         // coupon id
  status: "未使用" | "已使用" | "已过期"; // 未使用/已使用/已过期等
  receiveTime: Date;        // 不做日期格式化
  useTime?: Date | null;    // 不做日期格式化
  orderId?: string | null;
  actualAmount: number;     // 折后实减金额
  coupon: {
    id: string;
    name: string;
    type: "满减" | "折扣";
    amount: number;         // 金额类券面额（转 number）
    discount: number;       // 折扣类折扣率（转 number）
    threshold: number;      // 使用门槛（转 number）
    condition?: string | null;
    scope?: string | null;   
    startTime: Date;        // 不做日期格式化
    expireTime: Date;       // 不做日期格式化
    isStackable: boolean;
  };
  useOK?:boolean;
}

export interface UserCouponListResponse {
  items: UserCouponItem[];
}

