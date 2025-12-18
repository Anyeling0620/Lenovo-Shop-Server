-- CreateTable
CREATE TABLE `User` (
    `id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `account` VARCHAR(191) NOT NULL,
    `memberType` ENUM('普通会员', '超级会员', '至尊会员') NOT NULL DEFAULT '普通会员',
    `gender` ENUM('man', 'woman', 'secret') NOT NULL DEFAULT 'secret',
    `birthday` DATETIME(3) NULL,
    `avatar` VARCHAR(191) NULL,
    `nickname` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `User_email_key`(`email`),
    UNIQUE INDEX `User_account_key`(`account`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `UserLogin` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `deviceName` VARCHAR(191) NOT NULL,
    `deviceType` VARCHAR(191) NOT NULL,
    `deviceId` VARCHAR(191) NOT NULL,
    `refreshToken` VARCHAR(191) NOT NULL,
    `loginAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `logoutAt` DATETIME(3) NULL,
    `ipAddress` VARCHAR(191) NULL,
    `userAgent` VARCHAR(191) NULL,

    UNIQUE INDEX `UserLogin_userId_deviceId_key`(`userId`, `deviceId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Brand` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `logo` VARCHAR(191) NULL,
    `status` ENUM('启用', '禁用', '下架') NOT NULL DEFAULT '启用',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `creatorId` VARCHAR(191) NOT NULL,
    `updatedAt` DATETIME(3) NOT NULL,
    `remark` VARCHAR(191) NULL,

    UNIQUE INDEX `Brand_name_key`(`name`),
    UNIQUE INDEX `Brand_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Category` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `parentId` VARCHAR(36) NULL,
    `status` ENUM('启用', '禁用') NOT NULL DEFAULT '启用',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `creatorId` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `Category_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Product` (
    `id` VARCHAR(191) NOT NULL,
    `brandId` VARCHAR(36) NOT NULL,
    `categoryId` VARCHAR(36) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `subTitle` VARCHAR(191) NULL,
    `description` VARCHAR(191) NULL,
    `mainImage` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `creatorId` VARCHAR(191) NOT NULL,
    `updatedAt` DATETIME(3) NOT NULL,
    `status` ENUM('正常', '下架', '删除') NOT NULL DEFAULT '正常',

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Tag` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `priority` INTEGER NOT NULL DEFAULT 0,
    `status` ENUM('启用', '禁用') NOT NULL DEFAULT '启用',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `creatorId` VARCHAR(191) NOT NULL,
    `remark` VARCHAR(191) NULL,

    UNIQUE INDEX `Tag_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ProductTagRelation` (
    `id` VARCHAR(191) NOT NULL,
    `productId` VARCHAR(36) NOT NULL,
    `tagId` VARCHAR(36) NOT NULL,
    `relationTime` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `status` ENUM('生效', '失效') NOT NULL DEFAULT '生效',

    UNIQUE INDEX `ProductTagRelation_productId_tagId_key`(`productId`, `tagId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ProductConfig` (
    `id` VARCHAR(191) NOT NULL,
    `productId` VARCHAR(36) NOT NULL,
    `config1` VARCHAR(191) NOT NULL,
    `config2` VARCHAR(191) NOT NULL,
    `config3` VARCHAR(191) NULL,
    `salePrice` DECIMAL(10, 2) NOT NULL,
    `originalPrice` DECIMAL(10, 2) NOT NULL,
    `configImage` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `status` ENUM('正常', '下架') NOT NULL DEFAULT '正常',

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ProductBanner` (
    `id` VARCHAR(191) NOT NULL,
    `productId` VARCHAR(36) NOT NULL,
    `sort` INTEGER NOT NULL DEFAULT 0,
    `image` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ProductBanner_productId_sort_idx`(`productId`, `sort`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ProductAppearance` (
    `id` VARCHAR(191) NOT NULL,
    `productId` VARCHAR(36) NOT NULL,
    `image` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ShelfProduct` (
    `id` VARCHAR(191) NOT NULL,
    `categoryId` VARCHAR(36) NOT NULL,
    `productId` VARCHAR(36) NOT NULL,
    `isCarousel` BOOLEAN NOT NULL DEFAULT false,
    `carouselImage` VARCHAR(191) NULL,
    `isSelfOperated` BOOLEAN NOT NULL DEFAULT true,
    `isCustomizable` BOOLEAN NOT NULL DEFAULT false,
    `installment` INTEGER NOT NULL DEFAULT 0,
    `shelfTime` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `offShelfTime` DATETIME(3) NULL,
    `status` ENUM('在售', '售罄', '下架') NOT NULL DEFAULT '在售',

    UNIQUE INDEX `ShelfProduct_categoryId_productId_key`(`categoryId`, `productId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Stock` (
    `id` VARCHAR(191) NOT NULL,
    `configId` VARCHAR(36) NOT NULL,
    `stockNum` INTEGER NOT NULL DEFAULT 0,
    `freezeNum` INTEGER NOT NULL DEFAULT 0,
    `warnNum` INTEGER NOT NULL DEFAULT 10,
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `lastInTime` DATETIME(3) NULL,
    `lastOutTime` DATETIME(3) NULL,

    UNIQUE INDEX `Stock_configId_key`(`configId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ShelfProductItem` (
    `id` VARCHAR(191) NOT NULL,
    `shelfProductId` VARCHAR(36) NOT NULL,
    `productId` VARCHAR(36) NOT NULL,
    `configId` VARCHAR(36) NOT NULL,
    `shelfNum` INTEGER NOT NULL DEFAULT 0,
    `lockNum` INTEGER NOT NULL DEFAULT 0,
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `ShelfProductItem_shelfProductId_configId_key`(`shelfProductId`, `configId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `NewProductPush` (
    `id` VARCHAR(191) NOT NULL,
    `shelfProductId` VARCHAR(36) NOT NULL,
    `isCarousel` BOOLEAN NOT NULL DEFAULT false,
    `carouselImage` VARCHAR(191) NULL,
    `startTime` DATETIME(3) NOT NULL,
    `endTime` DATETIME(3) NOT NULL,
    `status` ENUM('在售', '售罄', '下架') NOT NULL DEFAULT '在售',

    UNIQUE INDEX `NewProductPush_shelfProductId_key`(`shelfProductId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `HomePush` (
    `id` VARCHAR(191) NOT NULL,
    `shelfProductId` VARCHAR(36) NOT NULL,
    `isCarousel` BOOLEAN NOT NULL DEFAULT false,
    `carouselImage` VARCHAR(191) NULL,
    `startTime` DATETIME(3) NOT NULL,
    `endTime` DATETIME(3) NOT NULL,
    `status` ENUM('在售', '售罄', '下架') NOT NULL DEFAULT '在售',

    UNIQUE INDEX `HomePush_shelfProductId_key`(`shelfProductId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SeckillRound` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `startTime` DATETIME(3) NOT NULL,
    `endTime` DATETIME(3) NOT NULL,
    `status` ENUM('启用', '禁用', '已结束') NOT NULL DEFAULT '启用',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `creatorId` VARCHAR(191) NOT NULL,
    `remark` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SeckillProduct` (
    `id` VARCHAR(191) NOT NULL,
    `roundId` VARCHAR(36) NOT NULL,
    `productId` VARCHAR(36) NOT NULL,
    `type` ENUM('立减', '打折') NOT NULL,
    `reduceAmount` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `discount` DECIMAL(3, 2) NOT NULL DEFAULT 1.00,

    UNIQUE INDEX `SeckillProduct_roundId_productId_key`(`roundId`, `productId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SeckillProductConfig` (
    `id` VARCHAR(191) NOT NULL,
    `seckillProductId` VARCHAR(36) NOT NULL,
    `configId` VARCHAR(36) NOT NULL,
    `shelfNum` INTEGER NOT NULL DEFAULT 0,
    `remainNum` INTEGER NOT NULL DEFAULT 0,
    `lockNum` INTEGER NOT NULL DEFAULT 0,
    `seckillPrice` DECIMAL(10, 2) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `status` ENUM('正常', '售罄') NOT NULL DEFAULT '正常',

    UNIQUE INDEX `SeckillProductConfig_seckillProductId_configId_key`(`seckillProductId`, `configId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Cart` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(36) NOT NULL,
    `productId` VARCHAR(36) NOT NULL,
    `configId` VARCHAR(36) NOT NULL,
    `quantity` INTEGER NOT NULL DEFAULT 1,
    `status` ENUM('有效', '无效') NOT NULL DEFAULT '有效',
    `price` DECIMAL(10, 2) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Cart_userId_productId_configId_key`(`userId`, `productId`, `configId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CouponCenter` (
    `id` VARCHAR(191) NOT NULL,
    `couponId` VARCHAR(36) NOT NULL,
    `startTime` DATETIME(3) NOT NULL,
    `totalNum` INTEGER NOT NULL DEFAULT 0,
    `endTime` DATETIME(3) NOT NULL,
    `limitNum` INTEGER NOT NULL DEFAULT 1,
    `creatorId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `CouponCenter_couponId_key`(`couponId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Coupon` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `type` ENUM('满减', '折扣') NOT NULL,
    `amount` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `discount` DECIMAL(3, 2) NOT NULL DEFAULT 1.00,
    `threshold` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `condition` VARCHAR(191) NULL,
    `scope` VARCHAR(191) NULL,
    `startTime` DATETIME(3) NOT NULL,
    `expireTime` DATETIME(3) NOT NULL,
    `isStackable` BOOLEAN NOT NULL DEFAULT false,
    `creatorId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `remark` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Voucher` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `originalAmount` DECIMAL(10, 2) NOT NULL,
    `startTime` DATETIME(3) NOT NULL,
    `endTime` DATETIME(3) NOT NULL,
    `creatorId` VARCHAR(191) NOT NULL,
    `remark` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ProductCouponRelation` (
    `id` VARCHAR(191) NOT NULL,
    `productId` VARCHAR(36) NOT NULL,
    `couponId` VARCHAR(36) NOT NULL,
    `status` ENUM('生效', '失效') NOT NULL DEFAULT '生效',
    `relationTime` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `operatorId` VARCHAR(191) NOT NULL,
    `remark` VARCHAR(191) NULL,

    UNIQUE INDEX `ProductCouponRelation_productId_couponId_key`(`productId`, `couponId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `UserCoupon` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(36) NOT NULL,
    `couponId` VARCHAR(36) NOT NULL,
    `status` ENUM('未使用', '已使用', '已过期') NOT NULL DEFAULT '未使用',
    `receiveTime` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `useTime` DATETIME(3) NULL,
    `orderId` VARCHAR(36) NULL,
    `actualAmount` DECIMAL(10, 2) NOT NULL DEFAULT 0,

    UNIQUE INDEX `UserCoupon_userId_couponId_orderId_key`(`userId`, `couponId`, `orderId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `UserVoucher` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(36) NOT NULL,
    `voucherId` VARCHAR(36) NOT NULL,
    `status` BOOLEAN NOT NULL DEFAULT true,
    `getTime` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `useUpTime` DATETIME(3) NULL,
    `usedAmount` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `remainAmount` DECIMAL(10, 2) NOT NULL,

    UNIQUE INDEX `UserVoucher_userId_voucherId_key`(`userId`, `voucherId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `OrderVoucherRelation` (
    `id` VARCHAR(191) NOT NULL,
    `orderId` VARCHAR(36) NOT NULL,
    `voucherId` VARCHAR(36) NOT NULL,
    `usedAmount` DECIMAL(10, 2) NOT NULL,
    `useTime` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `OrderVoucherRelation_orderId_voucherId_key`(`orderId`, `voucherId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `OrderItem` (
    `id` VARCHAR(191) NOT NULL,
    `orderId` VARCHAR(36) NOT NULL,
    `productId` VARCHAR(36) NOT NULL,
    `configId` VARCHAR(36) NOT NULL,
    `quantity` INTEGER NOT NULL,
    `priceSnapshot` DECIMAL(10, 2) NOT NULL,
    `discountSnapshot` DECIMAL(10, 2) NOT NULL,
    `payAmountSnapshot` DECIMAL(10, 2) NOT NULL,
    `nameSnapshot` VARCHAR(191) NOT NULL,
    `imageSnapshot` VARCHAR(191) NULL,
    `config1Snapshot` VARCHAR(191) NOT NULL,
    `config2Snapshot` VARCHAR(191) NOT NULL,
    `config3Snapshot` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Order` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(36) NOT NULL,
    `orderNo` VARCHAR(191) NOT NULL,
    `status` ENUM('待支付', '待发货', '已发货', '待收货', '已收货', '已取消') NOT NULL DEFAULT '待支付',
    `payType` VARCHAR(191) NULL,
    `payAmount` DECIMAL(10, 2) NOT NULL,
    `actualPayAmount` DECIMAL(10, 2) NOT NULL,
    `payTime` DATETIME(3) NULL,
    `provinceCode` VARCHAR(191) NOT NULL,
    `cityCode` VARCHAR(191) NOT NULL,
    `areaCode` VARCHAR(191) NOT NULL,
    `streetCode` VARCHAR(191) NOT NULL,
    `address` VARCHAR(191) NOT NULL,
    `remark` VARCHAR(191) NULL,
    `receiver` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NOT NULL,
    `logisticsNo` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `payLimitTime` DATETIME(3) NOT NULL,
    `cancelTime` DATETIME(3) NULL,
    `shipTime` DATETIME(3) NULL,
    `receiveTime` DATETIME(3) NULL,
    `completeTime` DATETIME(3) NULL,
    `isVisible` BOOLEAN NOT NULL DEFAULT true,

    UNIQUE INDEX `Order_orderNo_key`(`orderNo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AfterSaleImage` (
    `id` VARCHAR(191) NOT NULL,
    `afterSaleId` VARCHAR(36) NOT NULL,
    `image` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AfterSale` (
    `id` VARCHAR(191) NOT NULL,
    `orderId` VARCHAR(36) NOT NULL,
    `afterSaleNo` VARCHAR(191) NOT NULL,
    `orderItemId` VARCHAR(36) NOT NULL,
    `type` ENUM('退货', '换货', '维修') NOT NULL,
    `status` ENUM('申请中', '已同意', '已拒绝', '已寄回', '已寄出', '已完成') NOT NULL DEFAULT '申请中',
    `reason` VARCHAR(191) NOT NULL,
    `remark` VARCHAR(191) NULL,
    `applyTime` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `agreeTime` DATETIME(3) NULL,
    `rejectTime` DATETIME(3) NULL,
    `rejectReason` VARCHAR(191) NULL,
    `userLogisticsNo` VARCHAR(191) NULL,
    `receiverProvince` VARCHAR(191) NOT NULL,
    `receiverCity` VARCHAR(191) NOT NULL,
    `receiverArea` VARCHAR(191) NOT NULL,
    `receiverStreet` VARCHAR(191) NOT NULL,
    `receiverAddress` VARCHAR(191) NOT NULL,
    `receiverRemark` VARCHAR(191) NULL,
    `receiverName` VARCHAR(191) NOT NULL,
    `receiverPhone` VARCHAR(191) NOT NULL,
    `merchantLogisticsNo` VARCHAR(191) NULL,
    `shipProvince` VARCHAR(191) NULL,
    `shipCity` VARCHAR(191) NULL,
    `shipArea` VARCHAR(191) NULL,
    `shipStreet` VARCHAR(191) NULL,
    `shipAddress` VARCHAR(191) NULL,
    `shipRemark` VARCHAR(191) NULL,
    `shipName` VARCHAR(191) NULL,
    `shipPhone` VARCHAR(191) NULL,
    `sendBackTime` DATETIME(3) NULL,
    `sendOutTime` DATETIME(3) NULL,
    `completeTime` DATETIME(3) NULL,
    `handlerId` VARCHAR(191) NULL,

    UNIQUE INDEX `AfterSale_afterSaleNo_key`(`afterSaleNo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CommentImage` (
    `id` VARCHAR(191) NOT NULL,
    `commentId` VARCHAR(36) NOT NULL,
    `image` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Comment` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(36) NOT NULL,
    `orderId` VARCHAR(36) NOT NULL,
    `orderItemId` VARCHAR(36) NOT NULL,
    `content` VARCHAR(191) NOT NULL,
    `likeNum` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `status` ENUM('撤回', '正常', '用户删除') NOT NULL DEFAULT '正常',

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CommentReply` (
    `id` VARCHAR(191) NOT NULL,
    `commentId` VARCHAR(36) NOT NULL,
    `content` VARCHAR(191) NOT NULL,
    `replyTime` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `replierId` VARCHAR(191) NOT NULL,
    `likeNum` INTEGER NOT NULL DEFAULT 0,
    `status` ENUM('撤回', '正常', '用户删除') NOT NULL DEFAULT '正常',

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `EvaluationImage` (
    `id` VARCHAR(191) NOT NULL,
    `evaluationId` VARCHAR(36) NOT NULL,
    `image` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ProductEvaluation` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(36) NOT NULL,
    `productId` VARCHAR(36) NOT NULL,
    `configId` VARCHAR(36) NOT NULL,
    `star` DECIMAL(2, 1) NOT NULL,
    `likeNum` INTEGER NOT NULL DEFAULT 0,
    `content` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `status` ENUM('撤回', '正常', '用户删除') NOT NULL DEFAULT '正常',

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `EvaluationReply` (
    `id` VARCHAR(191) NOT NULL,
    `evaluationId` VARCHAR(36) NOT NULL,
    `content` VARCHAR(191) NOT NULL,
    `replyTime` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `replierId` VARCHAR(191) NOT NULL,
    `likeNum` INTEGER NOT NULL DEFAULT 0,
    `status` ENUM('撤回', '正常', '用户删除') NOT NULL DEFAULT '正常',

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ComplaintImage` (
    `id` VARCHAR(191) NOT NULL,
    `complaintId` VARCHAR(36) NOT NULL,
    `image` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AfterSaleComplaint` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(36) NOT NULL,
    `afterSaleId` VARCHAR(36) NOT NULL,
    `content` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `isHandled` BOOLEAN NOT NULL DEFAULT false,
    `handlerId` VARCHAR(191) NULL,
    `handleTime` DATETIME(3) NULL,
    `handleResult` VARCHAR(191) NULL,
    `status` ENUM('撤回', '正常', '用户删除') NOT NULL DEFAULT '正常',

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Region` (
    `code` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `parentCode` VARCHAR(191) NULL,
    `level` INTEGER NOT NULL,

    PRIMARY KEY (`code`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ReceiptAddress` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(36) NOT NULL,
    `provinceCode` VARCHAR(191) NOT NULL,
    `cityCode` VARCHAR(191) NOT NULL,
    `areaCode` VARCHAR(191) NOT NULL,
    `streetCode` VARCHAR(191) NOT NULL,
    `address` VARCHAR(191) NOT NULL,
    `receiver` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NOT NULL,
    `isDefault` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `ReceiptAddress_userId_isDefault_idx`(`userId`, `isDefault`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Admin` (
    `id` VARCHAR(191) NOT NULL,
    `account` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NULL,
    `avatar` VARCHAR(191) NULL,
    `nickname` VARCHAR(191) NULL,
    `status` ENUM('启用', '禁用') NOT NULL DEFAULT '启用',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `lastLoginTime` DATETIME(3) NULL,
    `creatorId` VARCHAR(191) NULL,

    UNIQUE INDEX `Admin_account_key`(`account`),
    UNIQUE INDEX `Admin_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AdminIdentity` (
    `id` VARCHAR(191) NOT NULL,
    `adminId` VARCHAR(36) NOT NULL,
    `identityId` VARCHAR(36) NOT NULL,
    `assignerId` VARCHAR(191) NOT NULL,
    `assignTime` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `status` ENUM('启用', '禁用') NOT NULL DEFAULT '启用',
    `expireTime` DATETIME(3) NULL,

    UNIQUE INDEX `AdminIdentity_adminId_identityId_key`(`adminId`, `identityId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AdminProductCategory` (
    `id` VARCHAR(191) NOT NULL,
    `adminId` VARCHAR(36) NOT NULL,
    `categoryId` VARCHAR(36) NOT NULL,
    `creatorId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `status` ENUM('启用', '禁用') NOT NULL DEFAULT '启用',

    UNIQUE INDEX `AdminProductCategory_adminId_categoryId_key`(`adminId`, `categoryId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Identity` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `isSystem` BOOLEAN NOT NULL DEFAULT false,
    `status` ENUM('启用', '禁用') NOT NULL DEFAULT '启用',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `creatorId` VARCHAR(191) NULL,

    UNIQUE INDEX `Identity_name_key`(`name`),
    UNIQUE INDEX `Identity_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `IdentityPermission` (
    `id` VARCHAR(191) NOT NULL,
    `identityId` VARCHAR(36) NOT NULL,
    `permissionId` VARCHAR(36) NOT NULL,
    `assignerId` VARCHAR(191) NOT NULL,
    `assignTime` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `status` ENUM('启用', '禁用') NOT NULL DEFAULT '启用',

    UNIQUE INDEX `IdentityPermission_identityId_permissionId_key`(`identityId`, `permissionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Permission` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `parentId` VARCHAR(36) NULL,
    `module` VARCHAR(191) NOT NULL,
    `status` ENUM('启用', '禁用') NOT NULL DEFAULT '启用',

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `GlobalMessage` (
    `id` VARCHAR(191) NOT NULL,
    `senderId` VARCHAR(36) NOT NULL,
    `type` ENUM('公告', '提醒', '活动', '通知') NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `content` VARCHAR(191) NOT NULL,
    `sendTime` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `startTime` DATETIME(3) NOT NULL,
    `expireTime` DATETIME(3) NOT NULL,
    `status` ENUM('正常', '撤回', '下架') NOT NULL DEFAULT '正常',

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PersonalMessage` (
    `id` VARCHAR(191) NOT NULL,
    `senderId` VARCHAR(36) NOT NULL,
    `type` ENUM('公告', '提醒', '活动', '通知') NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `content` VARCHAR(191) NOT NULL,
    `sendTime` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `startTime` DATETIME(3) NOT NULL,
    `expireTime` DATETIME(3) NOT NULL,
    `status` ENUM('正常', '撤回', '下架') NOT NULL DEFAULT '正常',

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `UserNotification` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(36) NOT NULL,
    `messageType` VARCHAR(191) NOT NULL,
    `personalMessageId` VARCHAR(36) NULL,
    `globalMessageId` VARCHAR(36) NULL,
    `notifyTime` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `isRead` BOOLEAN NOT NULL DEFAULT false,
    `readTime` DATETIME(3) NULL,
    `isDeleted` BOOLEAN NOT NULL DEFAULT false,

    UNIQUE INDEX `UserNotification_userId_personalMessageId_key`(`userId`, `personalMessageId`),
    UNIQUE INDEX `UserNotification_userId_globalMessageId_key`(`userId`, `globalMessageId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ServiceNotification` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(36) NOT NULL,
    `roomId` VARCHAR(36) NOT NULL,
    `messageId` VARCHAR(36) NOT NULL,
    `objectType` ENUM('用户', '管理员') NOT NULL,
    `objectId` VARCHAR(191) NOT NULL,
    `replyMessageId` VARCHAR(191) NULL,
    `isDeleted` BOOLEAN NOT NULL DEFAULT false,
    `deleteTime` DATETIME(3) NULL,
    `notifyTime` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `status` ENUM('已读', '未读') NOT NULL DEFAULT '未读',

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ServiceSessionList` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(36) NOT NULL,
    `roomId` VARCHAR(36) NOT NULL,
    `adminId` VARCHAR(36) NOT NULL,
    `userDeleted` BOOLEAN NOT NULL DEFAULT false,
    `userDeleteTime` DATETIME(3) NULL,
    `adminDeleted` BOOLEAN NOT NULL DEFAULT false,
    `adminDeleteTime` DATETIME(3) NULL,

    UNIQUE INDEX `ServiceSessionList_userId_roomId_key`(`userId`, `roomId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ServiceSessionRoom` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(36) NOT NULL,
    `adminId` VARCHAR(36) NOT NULL,
    `userUnread` INTEGER NOT NULL DEFAULT 0,
    `adminUnread` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `endTime` DATETIME(3) NULL,
    `status` ENUM('已结束', '进行中') NOT NULL DEFAULT '进行中',

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ServiceMessage` (
    `id` VARCHAR(191) NOT NULL,
    `roomId` VARCHAR(36) NOT NULL,
    `senderType` ENUM('用户', '管理员') NOT NULL,
    `senderId` VARCHAR(191) NOT NULL,
    `receiverType` ENUM('用户', '管理员') NOT NULL,
    `receiverId` VARCHAR(191) NOT NULL,
    `isRead` BOOLEAN NOT NULL DEFAULT false,
    `readTime` DATETIME(3) NULL,
    `content` VARCHAR(191) NOT NULL,
    `sendTime` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `status` ENUM('撤回', '正常') NOT NULL DEFAULT '正常',
    `withdrawTime` DATETIME(3) NULL,
    `replyMessageId` VARCHAR(191) NULL,
    `replyLevel` INTEGER NOT NULL DEFAULT 0,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ServiceEvaluation` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(36) NOT NULL,
    `roomId` VARCHAR(36) NOT NULL,
    `adminId` VARCHAR(36) NOT NULL,
    `content` VARCHAR(191) NULL,
    `star` DECIMAL(2, 1) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `status` ENUM('撤回', '正常') NOT NULL DEFAULT '正常',
    `withdrawReason` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ServiceMetric` (
    `id` VARCHAR(191) NOT NULL,
    `adminId` VARCHAR(36) NOT NULL,
    `sessionNum` INTEGER NOT NULL DEFAULT 0,
    `evaluatedNum` INTEGER NOT NULL DEFAULT 0,
    `avgStar` DECIMAL(2, 1) NOT NULL DEFAULT 0,
    `goodNum` INTEGER NOT NULL DEFAULT 0,
    `goodRate` DECIMAL(2, 2) NOT NULL DEFAULT 0,
    `statTime` DATETIME(3) NOT NULL,

    UNIQUE INDEX `ServiceMetric_adminId_statTime_key`(`adminId`, `statTime`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AdminSession` (
    `id` VARCHAR(191) NOT NULL,
    `adminId` VARCHAR(36) NOT NULL,
    `sessionId` VARCHAR(191) NOT NULL,
    `data` JSON NOT NULL,
    `expireTime` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `AdminSession_sessionId_key`(`sessionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AdminLogin` (
    `id` VARCHAR(191) NOT NULL,
    `adminId` VARCHAR(36) NOT NULL,
    `sessionId` VARCHAR(36) NOT NULL,
    `deviceName` VARCHAR(191) NOT NULL,
    `deviceType` VARCHAR(191) NOT NULL,
    `loginTime` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `loginIp` VARCHAR(191) NULL,
    `logoutTime` DATETIME(3) NULL,
    `sessionExpireTime` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `UserLogin` ADD CONSTRAINT `UserLogin_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Category` ADD CONSTRAINT `Category_parentId_fkey` FOREIGN KEY (`parentId`) REFERENCES `Category`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Product` ADD CONSTRAINT `Product_brandId_fkey` FOREIGN KEY (`brandId`) REFERENCES `Brand`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Product` ADD CONSTRAINT `Product_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `Category`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProductTagRelation` ADD CONSTRAINT `ProductTagRelation_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `Product`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProductTagRelation` ADD CONSTRAINT `ProductTagRelation_tagId_fkey` FOREIGN KEY (`tagId`) REFERENCES `Tag`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProductConfig` ADD CONSTRAINT `ProductConfig_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `Product`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProductBanner` ADD CONSTRAINT `ProductBanner_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `Product`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProductAppearance` ADD CONSTRAINT `ProductAppearance_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `Product`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ShelfProduct` ADD CONSTRAINT `ShelfProduct_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `Category`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ShelfProduct` ADD CONSTRAINT `ShelfProduct_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `Product`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Stock` ADD CONSTRAINT `Stock_configId_fkey` FOREIGN KEY (`configId`) REFERENCES `ProductConfig`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ShelfProductItem` ADD CONSTRAINT `ShelfProductItem_shelfProductId_fkey` FOREIGN KEY (`shelfProductId`) REFERENCES `ShelfProduct`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ShelfProductItem` ADD CONSTRAINT `ShelfProductItem_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `Product`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ShelfProductItem` ADD CONSTRAINT `ShelfProductItem_configId_fkey` FOREIGN KEY (`configId`) REFERENCES `ProductConfig`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `NewProductPush` ADD CONSTRAINT `NewProductPush_shelfProductId_fkey` FOREIGN KEY (`shelfProductId`) REFERENCES `ShelfProduct`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `HomePush` ADD CONSTRAINT `HomePush_shelfProductId_fkey` FOREIGN KEY (`shelfProductId`) REFERENCES `ShelfProduct`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SeckillProduct` ADD CONSTRAINT `SeckillProduct_roundId_fkey` FOREIGN KEY (`roundId`) REFERENCES `SeckillRound`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SeckillProduct` ADD CONSTRAINT `SeckillProduct_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `Product`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SeckillProductConfig` ADD CONSTRAINT `SeckillProductConfig_seckillProductId_fkey` FOREIGN KEY (`seckillProductId`) REFERENCES `SeckillProduct`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SeckillProductConfig` ADD CONSTRAINT `SeckillProductConfig_configId_fkey` FOREIGN KEY (`configId`) REFERENCES `ProductConfig`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Cart` ADD CONSTRAINT `Cart_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Cart` ADD CONSTRAINT `Cart_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `Product`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Cart` ADD CONSTRAINT `Cart_configId_fkey` FOREIGN KEY (`configId`) REFERENCES `ProductConfig`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CouponCenter` ADD CONSTRAINT `CouponCenter_couponId_fkey` FOREIGN KEY (`couponId`) REFERENCES `Coupon`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProductCouponRelation` ADD CONSTRAINT `ProductCouponRelation_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `Product`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProductCouponRelation` ADD CONSTRAINT `ProductCouponRelation_couponId_fkey` FOREIGN KEY (`couponId`) REFERENCES `Coupon`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserCoupon` ADD CONSTRAINT `UserCoupon_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserCoupon` ADD CONSTRAINT `UserCoupon_couponId_fkey` FOREIGN KEY (`couponId`) REFERENCES `Coupon`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserCoupon` ADD CONSTRAINT `UserCoupon_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `Order`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserVoucher` ADD CONSTRAINT `UserVoucher_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserVoucher` ADD CONSTRAINT `UserVoucher_voucherId_fkey` FOREIGN KEY (`voucherId`) REFERENCES `Voucher`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `OrderVoucherRelation` ADD CONSTRAINT `OrderVoucherRelation_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `Order`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `OrderVoucherRelation` ADD CONSTRAINT `OrderVoucherRelation_voucherId_fkey` FOREIGN KEY (`voucherId`) REFERENCES `Voucher`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `OrderItem` ADD CONSTRAINT `OrderItem_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `Order`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `OrderItem` ADD CONSTRAINT `OrderItem_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `Product`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `OrderItem` ADD CONSTRAINT `OrderItem_configId_fkey` FOREIGN KEY (`configId`) REFERENCES `ProductConfig`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Order` ADD CONSTRAINT `Order_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AfterSaleImage` ADD CONSTRAINT `AfterSaleImage_afterSaleId_fkey` FOREIGN KEY (`afterSaleId`) REFERENCES `AfterSale`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AfterSale` ADD CONSTRAINT `AfterSale_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `Order`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AfterSale` ADD CONSTRAINT `AfterSale_orderItemId_fkey` FOREIGN KEY (`orderItemId`) REFERENCES `OrderItem`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CommentImage` ADD CONSTRAINT `CommentImage_commentId_fkey` FOREIGN KEY (`commentId`) REFERENCES `Comment`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Comment` ADD CONSTRAINT `Comment_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Comment` ADD CONSTRAINT `Comment_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `Order`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Comment` ADD CONSTRAINT `Comment_orderItemId_fkey` FOREIGN KEY (`orderItemId`) REFERENCES `OrderItem`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CommentReply` ADD CONSTRAINT `CommentReply_commentId_fkey` FOREIGN KEY (`commentId`) REFERENCES `Comment`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CommentReply` ADD CONSTRAINT `CommentReply_replierId_fkey` FOREIGN KEY (`replierId`) REFERENCES `Admin`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EvaluationImage` ADD CONSTRAINT `EvaluationImage_evaluationId_fkey` FOREIGN KEY (`evaluationId`) REFERENCES `ProductEvaluation`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProductEvaluation` ADD CONSTRAINT `ProductEvaluation_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProductEvaluation` ADD CONSTRAINT `ProductEvaluation_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `Product`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProductEvaluation` ADD CONSTRAINT `ProductEvaluation_configId_fkey` FOREIGN KEY (`configId`) REFERENCES `ProductConfig`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EvaluationReply` ADD CONSTRAINT `EvaluationReply_evaluationId_fkey` FOREIGN KEY (`evaluationId`) REFERENCES `ProductEvaluation`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EvaluationReply` ADD CONSTRAINT `EvaluationReply_replierId_fkey` FOREIGN KEY (`replierId`) REFERENCES `Admin`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ComplaintImage` ADD CONSTRAINT `ComplaintImage_complaintId_fkey` FOREIGN KEY (`complaintId`) REFERENCES `AfterSaleComplaint`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AfterSaleComplaint` ADD CONSTRAINT `AfterSaleComplaint_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AfterSaleComplaint` ADD CONSTRAINT `AfterSaleComplaint_afterSaleId_fkey` FOREIGN KEY (`afterSaleId`) REFERENCES `AfterSale`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Region` ADD CONSTRAINT `Region_parentCode_fkey` FOREIGN KEY (`parentCode`) REFERENCES `Region`(`code`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ReceiptAddress` ADD CONSTRAINT `ReceiptAddress_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ReceiptAddress` ADD CONSTRAINT `ReceiptAddress_provinceCode_fkey` FOREIGN KEY (`provinceCode`) REFERENCES `Region`(`code`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ReceiptAddress` ADD CONSTRAINT `ReceiptAddress_cityCode_fkey` FOREIGN KEY (`cityCode`) REFERENCES `Region`(`code`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ReceiptAddress` ADD CONSTRAINT `ReceiptAddress_areaCode_fkey` FOREIGN KEY (`areaCode`) REFERENCES `Region`(`code`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ReceiptAddress` ADD CONSTRAINT `ReceiptAddress_streetCode_fkey` FOREIGN KEY (`streetCode`) REFERENCES `Region`(`code`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AdminIdentity` ADD CONSTRAINT `AdminIdentity_adminId_fkey` FOREIGN KEY (`adminId`) REFERENCES `Admin`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AdminIdentity` ADD CONSTRAINT `AdminIdentity_assignerId_fkey` FOREIGN KEY (`assignerId`) REFERENCES `Admin`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AdminIdentity` ADD CONSTRAINT `AdminIdentity_identityId_fkey` FOREIGN KEY (`identityId`) REFERENCES `Identity`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AdminProductCategory` ADD CONSTRAINT `AdminProductCategory_adminId_fkey` FOREIGN KEY (`adminId`) REFERENCES `Admin`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AdminProductCategory` ADD CONSTRAINT `AdminProductCategory_creatorId_fkey` FOREIGN KEY (`creatorId`) REFERENCES `Admin`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AdminProductCategory` ADD CONSTRAINT `AdminProductCategory_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `Category`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `IdentityPermission` ADD CONSTRAINT `IdentityPermission_identityId_fkey` FOREIGN KEY (`identityId`) REFERENCES `Identity`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `IdentityPermission` ADD CONSTRAINT `IdentityPermission_permissionId_fkey` FOREIGN KEY (`permissionId`) REFERENCES `Permission`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `IdentityPermission` ADD CONSTRAINT `IdentityPermission_assignerId_fkey` FOREIGN KEY (`assignerId`) REFERENCES `Admin`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Permission` ADD CONSTRAINT `Permission_parentId_fkey` FOREIGN KEY (`parentId`) REFERENCES `Permission`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `GlobalMessage` ADD CONSTRAINT `GlobalMessage_senderId_fkey` FOREIGN KEY (`senderId`) REFERENCES `Admin`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PersonalMessage` ADD CONSTRAINT `PersonalMessage_senderId_fkey` FOREIGN KEY (`senderId`) REFERENCES `Admin`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserNotification` ADD CONSTRAINT `UserNotification_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserNotification` ADD CONSTRAINT `UserNotification_personalMessageId_fkey` FOREIGN KEY (`personalMessageId`) REFERENCES `PersonalMessage`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserNotification` ADD CONSTRAINT `UserNotification_globalMessageId_fkey` FOREIGN KEY (`globalMessageId`) REFERENCES `GlobalMessage`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ServiceNotification` ADD CONSTRAINT `ServiceNotification_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ServiceNotification` ADD CONSTRAINT `ServiceNotification_roomId_fkey` FOREIGN KEY (`roomId`) REFERENCES `ServiceSessionRoom`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ServiceNotification` ADD CONSTRAINT `ServiceNotification_messageId_fkey` FOREIGN KEY (`messageId`) REFERENCES `ServiceMessage`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ServiceSessionList` ADD CONSTRAINT `ServiceSessionList_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ServiceSessionList` ADD CONSTRAINT `ServiceSessionList_roomId_fkey` FOREIGN KEY (`roomId`) REFERENCES `ServiceSessionRoom`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ServiceSessionList` ADD CONSTRAINT `ServiceSessionList_adminId_fkey` FOREIGN KEY (`adminId`) REFERENCES `Admin`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ServiceSessionRoom` ADD CONSTRAINT `ServiceSessionRoom_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ServiceSessionRoom` ADD CONSTRAINT `ServiceSessionRoom_adminId_fkey` FOREIGN KEY (`adminId`) REFERENCES `Admin`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ServiceMessage` ADD CONSTRAINT `ServiceMessage_roomId_fkey` FOREIGN KEY (`roomId`) REFERENCES `ServiceSessionRoom`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ServiceEvaluation` ADD CONSTRAINT `ServiceEvaluation_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ServiceEvaluation` ADD CONSTRAINT `ServiceEvaluation_roomId_fkey` FOREIGN KEY (`roomId`) REFERENCES `ServiceSessionRoom`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ServiceEvaluation` ADD CONSTRAINT `ServiceEvaluation_adminId_fkey` FOREIGN KEY (`adminId`) REFERENCES `Admin`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ServiceMetric` ADD CONSTRAINT `ServiceMetric_adminId_fkey` FOREIGN KEY (`adminId`) REFERENCES `Admin`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AdminSession` ADD CONSTRAINT `AdminSession_adminId_fkey` FOREIGN KEY (`adminId`) REFERENCES `Admin`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AdminLogin` ADD CONSTRAINT `AdminLogin_adminId_fkey` FOREIGN KEY (`adminId`) REFERENCES `Admin`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AdminLogin` ADD CONSTRAINT `AdminLogin_sessionId_fkey` FOREIGN KEY (`sessionId`) REFERENCES `AdminSession`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
