# 联想商城数据库设计文档

## 1. 数据库概述

联想商城数据库是一个基于 MySQL 的关系型数据库，使用 Prisma ORM 进行数据访问和管理。数据库设计遵循规范化原则，支持完整的电商业务流程，包括商品管理、订单处理、用户服务、后台管理等核心功能模块。

## 2. 数据库配置

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}
```

## 3. 核心数据模型

### 3.1 用户模块

#### 3.1.1 用户表 (User)

用户基本信息表，存储商城注册用户的基本资料。

| 字段名 | 类型 | 说明 | 约束 |
|--------|------|------|------|
| id | String | 用户唯一标识 | 主键，UUID |
| email | String | 用户邮箱 | 唯一 |
| password | String | 用户密码 | 非空 |
| account | String | 用户账号 | 唯一 |
| memberType | MemberType | 会员类型 | 默认：普通会员 |
| gender | Gender | 性别 | 默认：secret |
| birthday | DateTime? | 生日 | 可选 |
| avatar | String? | 头像URL | 可选 |
| nickname | String? | 昵称 | 可选 |
| createdAt | DateTime | 创建时间 | 默认当前时间 |
| updatedAt | DateTime | 更新时间 | 自动更新 |

**关联关系:**
- 一对多关联用户登录记录 (UserLogin)
- 一对多关联购物车 (Cart)
- 一对多关联用户优惠券 (UserCoupon)
- 一对多关联用户代金券 (UserVoucher)
- 一对多关联订单 (Order)
- 一对多关联评论 (Comment)
- 一对多关联评价 (ProductEvaluation)
- 一对多关联投诉 (AfterSaleComplaint)
- 一对多关联收货地址 (ReceiptAddress)
- 一对多关联用户通知 (UserNotification)
- 一对多关联客服会话 (ServiceSessionRoom)
- 一对多关联服务评价 (ServiceEvaluation)
- 一对多关联服务通知 (ServiceNotification)
- 一对多关联服务会话列表 (ServiceSessionList)

#### 3.1.2 用户登录记录表 (UserLogin)

记录用户登录设备和会话信息。

| 字段名 | 类型 | 说明 | 约束 |
|--------|------|------|------|
| id | String | 记录唯一标识 | 主键，UUID |
| userId | String | 用户ID | 外键 |
| deviceName | String | 设备名称 | 非空 |
| deviceType | String | 设备类型 | 非空 |
| deviceId | String | 设备ID | 非空 |
| refreshToken | String | 刷新令牌 | 非空 |
| loginAt | DateTime | 登录时间 | 默认当前时间 |
| logoutAt | DateTime? | 登出时间 | 可选 |
| ipAddress | String? | IP地址 | 可选 |
| userAgent | String? | 用户代理 | 可选 |

**索引:**
- 唯一索引：[userId, deviceId]

#### 3.1.3 收货地址表 (ReceiptAddress)

用户收货地址信息。

| 字段名 | 类型 | 说明 | 约束 |
|--------|------|------|------|
| id | String | 地址唯一标识 | 主键，UUID |
| userId | String | 用户ID | 外键 |
| provinceCode | String | 省份编码 | 非空 |
| cityCode | String | 城市编码 | 非空 |
| areaCode | String | 区县编码 | 非空 |
| streetCode | String | 街道编码 | 非空 |
| address | String | 详细地址 | 非空 |
| receiver | String | 收货人 | 非空 |
| phone | String | 手机号 | 非空 |
| isDefault | Boolean | 是否默认地址 | 默认：false |
| createdAt | DateTime | 创建时间 | 默认当前时间 |
| updatedAt | DateTime | 更新时间 | 自动更新 |

**索引:**
- 索引：[userId, isDefault]

### 3.2 商品模块

#### 3.2.1 品牌表 (Brand)

商品品牌信息。

| 字段名 | 类型 | 说明 | 约束 |
|--------|------|------|------|
| id | String | 品牌唯一标识 | 主键，UUID |
| name | String | 品牌名称 | 唯一 |
| code | String | 品牌编码 | 唯一 |
| description | String? | 品牌描述 | 可选 |
| logo | String? | 品牌logo | 可选 |
| status | BrandStatus | 状态 | 默认：启用 |
| createdAt | DateTime | 创建时间 | 默认当前时间 |
| creatorId | String | 创建者ID | 非空 |
| updatedAt | DateTime | 更新时间 | 自动更新 |
| remark | String? | 备注 | 可选 |

**关联关系:**
- 一对多关联商品 (Product)

#### 3.2.2 商品品类表 (Category)

商品分类信息，支持多级分类。

| 字段名 | 类型 | 说明 | 约束 |
|--------|------|------|------|
| id | String | 品类唯一标识 | 主键，UUID |
| name | String | 品类名称 | 非空 |
| code | String | 品类编码 | 唯一 |
| parentId | String? | 父级品类ID | 可选 |
| status | CategoryStatus | 状态 | 默认：启用 |
| createdAt | DateTime | 创建时间 | 默认当前时间 |
| creatorId | String | 创建者ID | 非空 |

**关联关系:**
- 自关联：父子分类关系
- 一对多关联商品 (Product)
- 一对多关联货架商品 (ShelfProduct)
- 一对多关联管理员-商品专区 (AdminProductCategory)

#### 3.2.3 商品基本信息表 (Product)

商品核心信息表。

| 字段名 | 类型 | 说明 | 约束 |
|--------|------|------|------|
| id | String | 商品唯一标识 | 主键，UUID |
| brandId | String | 品牌ID | 外键 |
| categoryId | String | 品类ID | 外键 |
| name | String | 商品名称 | 非空 |
| subTitle | String? | 商品副标题 | 可选 |
| description | String? | 商品描述 | 可选 |
| mainImage | String? | 商品主图 | 可选 |
| createdAt | DateTime | 创建时间 | 默认当前时间 |
| creatorId | String | 创建者ID | 非空 |
| updatedAt | DateTime | 更新时间 | 自动更新 |
| status | ProductStatus | 状态 | 默认：正常 |

**关联关系:**
- 多对一关联品牌 (Brand)
- 多对一关联品类 (Category)
- 一对多关联商品标签关系 (ProductTagRelation)
- 一对多关联商品配置 (ProductConfig)
- 一对多关联商品宣传图 (ProductBanner)
- 一对多关联商品外观图 (ProductAppearance)
- 一对多关联货架商品 (ShelfProduct)
- 一对多关联秒杀商品 (SeckillProduct)
- 一对多关联购物车 (Cart)
- 一对多关联优惠券关系 (ProductCouponRelation)
- 一对多关联订单商品 (OrderItem)
- 一对多关联评价 (ProductEvaluation)
- 一对多关联货架商品项 (ShelfProductItem)

#### 3.2.4 商品配置表 (ProductConfig)

商品不同配置（颜色、内存、尺寸等）及价格信息。

| 字段名 | 类型 | 说明 | 约束 |
|--------|------|------|------|
| id | String | 配置唯一标识 | 主键，UUID |
| productId | String | 商品ID | 外键 |
| config1 | String | 配置1（颜色等） | 非空 |
| config2 | String | 配置2（内存等） | 非空 |
| config3 | String? | 配置3（尺寸等） | 可选 |
| salePrice | Decimal | 售价 | 非空 |
| originalPrice | Decimal | 原价 | 非空 |
| configImage | String? | 配置图片 | 可选 |
| createdAt | DateTime | 创建时间 | 默认当前时间 |
| updatedAt | DateTime | 更新时间 | 自动更新 |
| status | ProductConfigStatus | 状态 | 默认：正常 |

**关联关系:**
- 多对一关联商品 (Product)
- 一对多关联库存 (Stock)
- 一对多关联货架商品项 (ShelfProductItem)
- 一对多关联秒杀配置 (SeckillProductConfig)
- 一对多关联购物车 (Cart)
- 一对多关联订单商品 (OrderItem)
- 一对多关联评价 (ProductEvaluation)

#### 3.2.5 库存表 (Stock)

商品配置库存信息。

| 字段名 | 类型 | 说明 | 约束 |
|--------|------|------|------|
| id | String | 库存唯一标识 | 主键，UUID |
| configId | String | 商品配置ID | 外键 |
| stockNum | Int | 库存数量 | 默认：0 |
| freezeNum | Int | 冻结数量 | 默认：0 |
| warnNum | Int | 库存预警数量 | 默认：10 |
| updatedAt | DateTime | 更新时间 | 默认当前时间 |
| lastInTime | DateTime? | 最后入库时间 | 可选 |
| lastOutTime | DateTime? | 最后出库时间 | 可选 |

**关联关系:**
- 多对一关联商品配置 (ProductConfig)

**索引:**
- 唯一索引：[configId]

#### 3.2.6 货架商品表 (ShelfProduct)

已上架到商城的商品信息。

| 字段名 | 类型 | 说明 | 约束 |
|--------|------|------|------|
| id | String | 货架商品唯一标识 | 主键，UUID |
| categoryId | String | 货架专区ID | 外键 |
| productId | String | 商品ID | 外键 |
| isCarousel | Boolean | 专栏轮播 | 默认：false |
| carouselImage | String? | 专栏轮播海报 | 可选 |
| isSelfOperated | Boolean | 自营 | 默认：true |
| isCustomizable | Boolean | 可定制 | 默认：false |
| installment | Int | 分期 | 默认：0 |
| shelfTime | DateTime | 上架时间 | 默认当前时间 |
| updatedAt | DateTime | 更新时间 | 自动更新 |
| offShelfTime | DateTime? | 下架时间 | 可选 |
| status | ShelfProductStatus | 状态 | 默认：在售 |

**关联关系:**
- 多对一关联品类 (Category)
- 多对一关联商品 (Product)
- 一对多关联货架商品项 (ShelfProductItem)
- 一对多关联新品推送 (NewProductPush)
- 一对多关联首页推送 (HomePush)

**索引:**
- 唯一索引：[categoryId, productId]

### 3.3 订单模块

#### 3.3.1 订单表 (Order)

用户订单信息。

| 字段名 | 类型 | 说明 | 约束 |
|--------|------|------|------|
| id | String | 订单唯一标识 | 主键，UUID |
| userId | String | 用户ID | 外键 |
| orderNo | String | 订单号 | 唯一 |
| status | OrderStatus | 订单状态 | 默认：待支付 |
| payType | String? | 支付方式 | 可选 |
| payAmount | Decimal | 支付金额 | 非空 |
| actualPayAmount | Decimal | 实际支付金额 | 非空 |
| payTime | DateTime? | 支付时间 | 可选 |
| provinceCode | String | 收货快照-省编码 | 非空 |
| cityCode | String | 收货快照-市编码 | 非空 |
| areaCode | String | 收货快照-区县编码 | 非空 |
| streetCode | String | 收货快照-街道编码 | 非空 |
| address | String | 收货快照-详细地址 | 非空 |
| remark | String? | 订单备注 | 可选 |
| receiver | String | 收货快照-收货人 | 非空 |
| phone | String | 收货快照-手机号 | 非空 |
| logisticsNo | String? | 物流单号 | 可选 |
| createdAt | DateTime | 订单创建时间 | 默认当前时间 |
| payLimitTime | DateTime | 支付限制时间 | 非空 |
| cancelTime | DateTime? | 订单取消时间 | 可选 |
| shipTime | DateTime? | 订单发货时间 | 可选 |
| receiveTime | DateTime? | 订单收货时间 | 可选 |
| completeTime | DateTime? | 订单完成时间 | 可选 |
| isVisible | Boolean | 用户可见状态 | 默认：true |

**关联关系:**
- 多对一关联用户 (User)
- 一对多关联订单商品 (OrderItem)
- 一对多关联售后 (AfterSale)
- 一对多关联用户优惠券 (UserCoupon)
- 一对多关联代金券使用 (OrderVoucherRelation)
- 一对多关联评论 (Comment)

#### 3.3.2 订单商品表 (OrderItem)

订单中的具体商品信息。

| 字段名 | 类型 | 说明 | 约束 |
|--------|------|------|------|
| id | String | 订单商品唯一标识 | 主键，UUID |
| orderId | String | 订单ID | 外键 |
| productId | String | 商品ID | 外键 |
| configId | String | 商品配置ID | 外键 |
| quantity | Int | 商品数量 | 非空 |
| priceSnapshot | Decimal | 商品价格快照 | 非空 |
| discountSnapshot | Decimal | 商品优惠快照 | 非空 |
| payAmountSnapshot | Decimal | 商品实付金额快照 | 非空 |
| nameSnapshot | String | 商品名称快照 | 非空 |
| imageSnapshot | String? | 商品主图快照 | 可选 |
| config1Snapshot | String | 配置1快照 | 非空 |
| config2Snapshot | String | 配置2快照 | 非空 |
| config3Snapshot | String? | 配置3快照 | 可选 |

**关联关系:**
- 多对一关联订单 (Order)
- 多对一关联商品 (Product)
- 多对一关联商品配置 (ProductConfig)
- 一对多关联售后 (AfterSale)
- 一对多关联评论 (Comment)

### 3.4 营销模块

#### 3.4.1 优惠券表 (Coupon)

优惠券基本信息。

| 字段名 | 类型 | 说明 | 约束 |
|--------|------|------|------|
| id | String | 优惠券唯一标识 | 主键，UUID |
| name | String | 优惠券名称 | 非空 |
| type | CouponType | 优惠券类型 | 非空 |
| amount | Decimal | 优惠金额 | 默认：0 |
| discount | Decimal | 优惠折扣率 | 默认：1.00 |
| threshold | Decimal | 门槛金额 | 默认：0 |
| condition | String? | 使用条件描述 | 可选 |
| scope | String? | 使用范围描述 | 可选 |
| startTime | DateTime | 开始时间 | 非空 |
| expireTime | DateTime | 过期时间 | 非空 |
| isStackable | Boolean | 可叠加 | 默认：false |
| creatorId | String | 创建者ID | 非空 |
| createdAt | DateTime | 创建时间 | 默认当前时间 |
| remark | String? | 备注 | 可选 |

**关联关系:**
- 一对一关联领券中心 (CouponCenter)
- 一对多关联商品关系 (ProductCouponRelation)
- 一对多关联用户优惠券 (UserCoupon)

#### 3.4.2 用户优惠券表 (UserCoupon)

用户持有的优惠券信息。

| 字段名 | 类型 | 说明 | 约束 |
|--------|------|------|------|
| id | String | 用户优惠券唯一标识 | 主键，UUID |
| userId | String | 用户ID | 外键 |
| couponId | String | 优惠券ID | 外键 |
| status | UserCouponStatus | 优惠券状态 | 默认：未使用 |
| receiveTime | DateTime | 领取时间 | 默认当前时间 |
| useTime | DateTime? | 使用时间 | 可选 |
| orderId | String? | 关联订单ID | 可选 |
| actualAmount | Decimal | 实际优惠金额 | 默认：0 |

**关联关系:**
- 多对一关联用户 (User)
- 多对一关联优惠券 (Coupon)
- 多对一关联订单 (Order)

**索引:**
- 唯一索引：[userId, couponId, orderId]

### 3.5 客服模块

#### 3.5.1 客服会话室表 (ServiceSessionRoom)

用户与客服的会话信息。

| 字段名 | 类型 | 说明 | 约束 |
|--------|------|------|------|
| id | String | 会话室唯一标识 | 主键，UUID |
| userId | String | 用户ID | 外键 |
| adminId | String | 管理员ID | 外键 |
| userUnread | Int | 用户未读消息数量 | 默认：0 |
| adminUnread | Int | 管理员未读消息数量 | 默认：0 |
| createdAt | DateTime | 会话创建时间 | 默认当前时间 |
| endTime | DateTime? | 结束时间 | 可选 |
| status | SessionRoomStatus | 状态 | 默认：进行中 |

**关联关系:**
- 多对一关联用户 (User)
- 多对一关联管理员 (Admin)
- 一对多关联消息 (ServiceMessage)
- 一对多关联通知 (ServiceNotification)
- 一对多关联会话列表 (ServiceSessionList)
- 一对多关联服务评价 (ServiceEvaluation)

#### 3.5.2 客服消息表 (ServiceMessage)

客服会话中的消息记录。

| 字段名 | 类型 | 说明 | 约束 |
|--------|------|------|------|
| id | String | 消息唯一标识 | 主键，UUID |
| roomId | String | 会话室ID | 外键 |
| senderType | MessageSenderType | 发送者身份 | 非空 |
| senderId | String | 发送者ID | 非空 |
| receiverType | MessageSenderType | 接收者身份 | 非空 |
| receiverId | String | 接收者ID | 非空 |
| isRead | Boolean | 接收者已读 | 默认：false |
| readTime | DateTime? | 已读时间 | 可选 |
| content | String | 消息内容 | 非空 |
| sendTime | DateTime | 发送时间 | 默认当前时间 |
| status | ServiceMessageStatus | 状态 | 默认：正常 |
| withdrawTime | DateTime? | 撤回时间 | 可选 |
| replyMessageId | String? | 被回复信息id | 可选 |
| replyLevel | Int | 回复层级数 | 默认：0 |

**关联关系:**
- 多对一关联会话室 (ServiceSessionRoom)
- 一对多关联通知 (ServiceNotification)

### 3.6 管理员模块

#### 3.6.1 管理员表 (Admin)

后台管理员信息。

| 字段名 | 类型 | 说明 | 约束 |
|--------|------|------|------|
| id | String | 管理员唯一标识 | 主键，UUID |
| account | String | 账号 | 唯一 |
| password | String | 密码 | 非空 |
| name | String | 姓名 | 非空 |
| email | String? | 邮箱 | 唯一，可选 |
| avatar | String? | 头像 | 可选 |
| nickname | String? | 工作昵称 | 可选 |
| status | AdminStatus | 状态 | 默认：启用 |
| createdAt | DateTime | 创建时间 | 默认当前时间 |
| lastLoginTime | DateTime? | 最后登陆时间 | 可选 |
| creatorId | String? | 创建者ID | 可选 |

**关联关系:**
- 一对多关联管理员身份 (AdminIdentity)
- 一对多关联管理员商品专区 (AdminProductCategory)
- 一对多关联身份权限分配 (IdentityPermission)
- 一对多关联评论回复 (CommentReply)
- 一对多关联评价回复 (EvaluationReply)
- 一对多关联管理员会话 (AdminSession)
- 一对多关联管理员登录 (AdminLogin)
- 一对多关联客服会话 (ServiceSessionRoom)
- 一对多关联服务评价 (ServiceEvaluation)
- 一对多关联客服指标 (ServiceMetric)
- 一对多关联全局消息 (GlobalMessage)
- 一对多关联个人消息 (PersonalMessage)
- 一对多关联服务会话列表 (ServiceSessionList)

#### 3.6.2 身份表 (Identity)

管理员角色身份信息。

| 字段名 | 类型 | 说明 | 约束 |
|--------|------|------|------|
| id | String | 身份唯一标识 | 主键，UUID |
| name | String | 身份名称 | 唯一 |
| code | String | 身份编码 | 唯一 |
| description | String? | 身份描述 | 可选 |
| isSystem | Boolean | 系统预设 | 默认：false |
| status | IdentityStatus | 状态 | 默认：启用 |
| createdAt | DateTime | 创建时间 | 默认当前时间 |
| creatorId | String? | 创建者ID | 可选 |

**关联关系:**
- 一对多关联管理员身份 (AdminIdentity)
- 一对多关联身份权限 (IdentityPermission)

#### 3.6.3 权限表 (Permission)

系统权限信息，支持多级权限结构。

| 字段名 | 类型 | 说明 | 约束 |
|--------|------|------|------|
| id | String | 权限唯一标识 | 主键，UUID |
| name | String | 权限名称 | 非空 |
| type | String | 权限类型 | 非空 |
| parentId | String? | 父级权限ID | 可选 |
| module | String | 模块名称 | 非空 |
| status | PermissionStatus | 状态 | 默认：启用 |

**关联关系:**
- 自关联：父子权限关系
- 一对多关联身份权限 (IdentityPermission)

## 4. 枚举类型定义

### 4.1 商品相关枚举

#### BrandStatus (品牌状态)
- 启用
- 禁用
- 下架

#### CategoryStatus (品类状态)
- 启用
- 禁用

#### ProductStatus (商品状态)
- 正常
- 下架
- 删除

#### TagStatus (标签状态)
- 启用
- 禁用

#### RelationStatus (关系状态)
- 生效
- 失效

#### ProductConfigStatus (商品配置状态)
- 正常
- 下架

#### ShelfProductStatus (货架商品状态)
- 在售
- 售罄
- 下架

### 4.2 秒杀相关枚举

#### SeckillRoundStatus (秒杀轮次状态)
- 启用
- 禁用
- 已结束

#### SeckillType (秒杀类型)
- 立减
- 打折

#### SeckillProductConfigStatus (秒杀商品配置状态)
- 正常
- 售罄

### 4.3 购物车相关枚举

#### CartStatus (购物车状态)
- 有效
- 无效

### 4.4 优惠券相关枚举

#### CouponType (优惠券类型)
- 满减
- 折扣

#### UserCouponStatus (用户优惠券状态)
- 未使用
- 已使用
- 已过期

### 4.5 订单相关枚举

#### OrderStatus (订单状态)
- 待支付
- 待发货
- 已发货
- 待收货
- 已收货
- 已取消

#### AfterSaleType (售后类型)
- 退货
- 换货
- 维修

#### AfterSaleStatus (售后状态)
- 申请中
- 已同意
- 已拒绝
- 已寄回
- 已寄出
- 已完成

### 4.6 评价相关枚举

#### CommentStatus (评论状态)
- 撤回
- 正常
- 用户删除

#### EvaluationStatus (评价状态)
- 撤回
- 正常
- 用户删除

#### ComplaintStatus (投诉状态)
- 撤回
- 正常
- 用户删除

### 4.7 管理员相关枚举

#### AdminStatus (管理员状态)
- 启用
- 禁用

#### IdentityStatus (身份状态)
- 启用
- 禁用

#### PermissionStatus (权限状态)
- 启用
- 禁用

### 4.8 消息相关枚举

#### MessageType (消息类型)
- 公告
- 提醒
- 活动
- 通知

#### MessageStatus (消息状态)
- 正常
- 撤回
- 下架

#### NotificationObjectType (通知对象类型)
- 用户
- 管理员

#### NotificationStatus (通知状态)
- 已读
- 未读

### 4.9 客服相关枚举

#### SessionRoomStatus (会话室状态)
- 已结束
- 进行中

#### MessageSenderType (消息发送者类型)
- 用户
- 管理员

#### ServiceMessageStatus (客服消息状态)
- 撤回
- 正常

#### ServiceEvaluationStatus (服务评价状态)
- 撤回
- 正常

### 4.10 用户相关枚举

#### MemberType (会员类型)
- 普通会员
- 超级会员
- 至尊会员

#### Gender (性别)
- man
- woman
- secret

## 5. 数据库关系图

```
用户模块
├── User (用户)
│   ├── UserLogin (用户登录记录)
│   ├── Cart (购物车)
│   ├── UserCoupon (用户优惠券)
│   ├── UserVoucher (用户代金券)
│   ├── Order (订单)
│   ├── Comment (评论)
│   ├── ProductEvaluation (商品评价)
│   ├── AfterSaleComplaint (售后投诉)
│   ├── ReceiptAddress (收货地址)
│   ├── UserNotification (用户通知)
│   ├── ServiceSessionRoom (客服会话室)
│   ├── ServiceEvaluation (服务评价)
│   ├── ServiceNotification (服务通知)
│   └── ServiceSessionList (服务会话列表)

商品模块
├── Brand (品牌)
├── Category (商品品类)
│   └── Category (自关联父子关系)
├── Product (商品)
│   ├── ProductTagRelation (商品标签关系)
│   │   └── Tag (标签)
│   ├── ProductConfig (商品配置)
│   │   └── Stock (库存)
│   ├── ProductBanner (商品宣传图)
│   ├── ProductAppearance (商品外观图)
│   ├── ShelfProduct (货架商品)
│   │   └── ShelfProductItem (货架商品项)
│   ├── SeckillProduct (秒杀商品)
│   │   └── SeckillProductConfig (秒杀商品配置)
│   ├── ProductCouponRelation (商品优惠券关系)
│   ├── OrderItem (订单商品)
│   └── ProductEvaluation (商品评价)
│       └── EvaluationImage (评价图片)

营销模块
├── CouponCenter (领券中心)
│   └── Coupon (优惠券)
│       ├── ProductCouponRelation (商品优惠券关系)
│       └── UserCoupon (用户优惠券)
├── Voucher (代金券)
│   ├── UserVoucher (用户代金券)
│   └── OrderVoucherRelation (订单代金券关系)
├── SeckillRound (秒杀轮次)
│   └── SeckillProduct (秒杀商品)
│       └── SeckillProductConfig (秒杀商品配置)
├── NewProductPush (新品推送)
└── HomePush (首页推送)

订单模块
├── Order (订单)
│   ├── OrderItem (订单商品)
│   ├── AfterSale (售后)
│   │   └── AfterSaleImage (售后图片)
│   ├── UserCoupon (用户优惠券)
│   └── OrderVoucherRelation (订单代金券关系)
└── AfterSaleComplaint (售后投诉)
    └── ComplaintImage (投诉图片)

客服模块
├── ServiceSessionRoom (客服会话室)
│   ├── ServiceMessage (客服消息)
│   ├── ServiceNotification (服务通知)
│   ├── ServiceSessionList (服务会话列表)
│   └── ServiceEvaluation (服务评价)

管理员模块
├── Admin (管理员)
│   ├── AdminSession (管理员会话)
│   │   └── AdminLogin (管理员登录)
│   ├── AdminIdentity (管理员身份)
│   │   └── Identity (身份)
│   │       └── IdentityPermission (身份权限)
│   │           └── Permission (权限)
│   ├── AdminProductCategory (管理员商品专区)
│   ├── CommentReply (评论回复)
│   ├── EvaluationReply (评价回复)
│   ├── ServiceSessionRoom (客服会话室)
│   ├── ServiceEvaluation (服务评价)
│   ├── ServiceMetric (客服指标)
│   ├── GlobalMessage (全局消息)
│   ├── PersonalMessage (个人消息)
│   └── ServiceSessionList (服务会话列表)

辅助模块
├── Region (行政区划)
│   └── Region (自关联父子关系)
├── Comment (评论)
│   ├── CommentImage (评论图片)
│   └── CommentReply (评论回复)
├── ProductEvaluation (商品评价)
│   ├── EvaluationImage (评价图片)
│   └── EvaluationReply (评价回复)
└── UserNotification (用户通知)
    ├── PersonalMessage (个人消息)
    └── GlobalMessage (全局消息)
```

## 6. 数据库设计特点

1. **规范化设计**：数据库设计遵循第三范式，减少数据冗余，提高数据一致性。

2. **UUID主键**：所有表使用UUID作为主键，避免自增ID带来的安全风险和分布式环境下的主键冲突问题。

3. **软删除机制**：关键数据采用状态字段而非物理删除，保留历史记录便于追踪和恢复。

4. **审计字段**：包含创建时间、更新时间、创建者等审计字段，便于数据追踪。

5. **关系完整性**：通过外键约束确保数据引用完整性，级联删除确保数据一致性。

6. **索引优化**：在常用查询字段上建立索引，提高查询性能。

7. **枚举约束**：使用枚举类型限制字段取值范围，确保数据规范性。

8. **JSON字段**：在AdminSession表中使用JSON字段存储灵活的结构化数据。

9. **状态机设计**：订单、售后等关键业务流程采用状态机模式，确保流程规范。

10. **快照机制**：订单商品表保存商品信息快照，避免商品信息变更影响历史订单。

## 7. 数据库使用建议

1. **读写分离**：对于高并发场景，建议采用读写分离架构，提高系统性能。

2. **分库分表**：随着业务增长，可考虑对订单表、日志表等大数据量表进行分库分表。

3. **缓存策略**：对热点数据如商品信息、用户信息等采用缓存策略，减轻数据库压力。

4. **定期备份**：制定定期备份策略，确保数据安全。

5. **监控告警**：建立数据库监控告警机制，及时发现和解决性能问题。

6. **SQL优化**：定期分析慢查询，优化SQL语句和索引。

7. **连接池配置**：合理配置数据库连接池参数，提高连接复用率。

8. **事务管理**：合理使用事务，确保数据一致性，避免长事务。

9. **安全防护**：加强数据库安全防护，防止SQL注入等安全风险。

10. **版本管理**：使用数据库版本管理工具，如Prisma Migrate，管理数据库结构变更。
