export interface UserVoucherItem {
  id: string;              // userVoucher id
  userId: string;
  voucherId: string;
  status: boolean;         // 代金券状态（true 有效/false 失效）
  getTime: Date;           // 不做日期格式化
  useUpTime?: Date | null; // 不做日期格式化
  usedAmount: number;      // 已使用金额（number）
  remainAmount: number;    // 剩余金额（number）
  voucher: {
    id: string;
    title: string;
    description?: string | null;
    originalAmount: number; // number
    startTime: Date;        // 不做日期格式化
    endTime: Date;          // 不做日期格式化
    creatorId: string;
    remark?: string | null;
  };
}

export interface UserVoucherListResponse {
  items: UserVoucherItem[];
}

