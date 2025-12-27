-- AlterTable
ALTER TABLE `AfterSale` MODIFY `status` ENUM('申请中', '已退款', '已同意', '已拒绝', '已寄回', '已寄出', '已完成') NOT NULL DEFAULT '申请中';

-- AlterTable
ALTER TABLE `Order` MODIFY `status` ENUM('待支付', '已支付', '待发货', '已发货', '待收货', '已收货', '已取消') NOT NULL DEFAULT '待支付';
