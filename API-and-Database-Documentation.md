# 联想商城服务器 API 文档和数据库模型

## 目录

1. [API 文档](#api-文档)
   - [认证相关 API](#认证相关-api)
     - [用户注册](#用户注册)
     - [用户登录](#用户登录)
     - [刷新令牌](#刷新令牌)
     - [退出登录](#退出登录)
     - [发送验证码](#发送验证码)
   - [用户信息 API](#用户信息-api)
     - [获取登录用户信息](#获取登录用户信息)
     - [获取账户信息](#获取账户信息)
     - [上传头像](#上传头像)
     - [更新账户信息](#更新账户信息)
     - [修改邮箱](#修改邮箱)
     - [修改密码](#修改密码)
   - [设备管理 API](#设备管理-api)
     - [获取登录设备列表](#获取登录设备列表)
     - [注销指定设备](#注销指定设备)
     - [注销其他设备](#注销其他设备)
   - [产品相关 API](#产品相关-api)
     - [按类型获取产品列表](#按类型获取产品列表)

2. [数据库模型](#数据库模型)
   - [用户相关模型](#用户相关模型)
     - [User](#user)
     - [UserLogin](#userlogin)
   - [产品相关模型](#产品相关模型)
     - [Product](#product)
     - [Tag](#tag)
     - [ProductTagRel](#producttagrel)
     - [ProductPromoImage](#productpromoimage)
     - [ProductAppearance](#productappearance)
     - [ProductConfig](#productconfig)
   - [优惠券相关模型](#优惠券相关模型)
     - [Coupon](#coupon)
     - [ProductCoupon](#productcoupon)
     - [UserCoupon](#usercoupon)
   - [代金券相关模型](#代金券相关模型)
     - [Voucher](#voucher)
     - [UserVoucher](#uservoucher)

3. [错误响应](#错误响应)

4. [认证机制](#认证机制)

---

## API 文档

### 认证相关 API

#### 用户注册

**POST** `/api/auth/register`

注册一个新用户账号。

##### 请求头

| 名称 | 类型 | 必需 | 描述 |
|------|------|------|------|
| X-Device-Id | string | 否 | 设备ID |
| X-Device-Type | string | 否 | 设备类型 |
| X-Device-Name | string | 否 | 设备名称 |

##### 请求体

```json
{
  "email": "string",      // 邮箱地址
  "password": "string",   // 密码
  "code": "string"        // 邮箱验证码
}
```

##### 响应

**成功响应 (201)**

```json
{
  "code": 201,
  "data": {
    "access_token": "string"  // JWT访问令牌
  },
  "message": "注册成功"
}
```

**Set-Cookie**

```
refresh_token=<token>; HttpOnly; Path=/; Max-Age=1209600; Domain=<domain>; SameSite=Lax
```

---

#### 用户登录

**POST** `/api/auth/login`

使用邮箱和密码登录。

##### 请求头

| 名称 | 类型 | 必需 | 描述 |
|------|------|------|------|
| X-Device-Id | string | 否 | 设备ID |
| X-Device-Type | string | 否 | 设备类型 |
| X-Device-Name | string | 否 | 设备名称 |

##### 请求体

```json
{
  "email": "string",      // 邮箱地址
  "password": "string"    // 密码
}
```

##### 响应

**成功响应 (200)**

```json
{
  "code": 200,
  "data": {
    "access_token": "string",        // JWT访问令牌
    "multi_login_warning": boolean   // 是否存在多设备登录警告
  },
  "message": "登录成功"
}
```

**Set-Cookie**

```
refresh_token=<token>; HttpOnly; Path=/; Max-Age=1209600; Domain=<domain>; SameSite=Lax
```

---

#### 刷新令牌

**POST** `/api/auth/refresh`

使用刷新令牌获取新的访问令牌。

##### 请求头

| 名称 | 类型 | 必需 | 描述 |
|------|------|------|------|
| Cookie | string | 是 | 包含refresh_token |

##### 响应

**成功响应 (200)**

```json
{
  "code": 200,
  "data": {
    "access_token": "string"  // 新的JWT访问令牌
  },
  "message": "令牌刷新成功"
}
```

**Set-Cookie**

```
refresh_token=<new_token>; HttpOnly; Path=/; Max-Age=1209600; Domain=<domain>; SameSite=Lax
```

---

#### 退出登录

**POST** `/api/auth/logout`

退出当前会话，使令牌失效。

##### 请求头

| 名称 | 类型 | 必需 | 描述 |
|------|------|------|------|
| Cookie | string | 是 | 包含refresh_token |

##### 响应

**成功响应 (200)**

```json
{
  "code": 200,
  "data": {
    "device": {
      "device_id": "string",
      "device_type": "string",
      "device_name": "string",
      "ip_address": "string",
      "login_time": "datetime"
    }
  },
  "message": "退出登录成功"
}
```

**Set-Cookie**

```
refresh_token=; HttpOnly; Path=/; Max-Age=0; Domain=<domain>; SameSite=Lax
```

---

#### 发送验证码

**POST** `/api/send-verification-code`

向指定邮箱发送验证码。

##### 请求体

```json
{
  "email": "string",  // 邮箱地址
  "mode": "string"    // 验证码用途（可选）
}
```

##### 响应

**成功响应 (200)**

```json
{
  "code": 200,
  "data": null,
  "message": "验证码已发送"
}
```

---

### 用户信息 API

#### 获取登录用户信息

**GET** `/api/user/login-user-info`

获取当前登录用户的基本信息。

##### 请求头

| 名称 | 类型 | 必需 | 描述 |
|------|------|------|------|
| Authorization | string | 是 | Bearer <access_token> |

##### 响应

**成功响应 (200)**

```json
{
  "code": 200,
  "data": {
    "userInfo": {
      "userId": "string",
      "avatar": "string",
      "nikeName": "string",
      "memberType": "string"
    }
  },
  "message": "success"
}
```

---

#### 获取账户信息

**GET** `/api/user/account-info`

获取当前登录用户的详细账户信息。

##### 请求头

| 名称 | 类型 | 必需 | 描述 |
|------|------|------|------|
| Authorization | string | 是 | Bearer <access_token> |

##### 响应

**成功响应 (200)**

```json
{
  "code": 200,
  "data": {
    "accountInfo": {
      "account": "string",
      "memberType": "string",
      "nickName": "string",
      "birthday": "string",
      "sex": "man|woman|secret",
      "email": "string",
      "avatarUrl": "string"
    }
  },
  "message": "success"
}
```

---

#### 上传头像

**POST** `/api/user/upload-avatar`

上传用户头像图片。

##### 请求头

| 名称 | 类型 | 必需 | 描述 |
|------|------|------|------|
| Authorization | string | 是 | Bearer <access_token> |
| Content-Type | string | 是 | multipart/form-data |

##### 请求体

| 名称 | 类型 | 必需 | 描述 |
|------|------|------|------|
| file | File | 是 | 头像图片文件 |

##### 响应

**成功响应 (200)**

```json
{
  "code": 200,
  "data": {
    "url": "string"  // 头像图片URL
  },
  "message": "上传成功"
}
```

---

#### 更新账户信息

**POST** `/api/user/update-info`

更新用户的个人信息。

##### 请求头

| 名称 | 类型 | 必需 | 描述 |
|------|------|------|------|
| Authorization | string | 是 | Bearer <access_token> |

##### 请求体

```json
{
  "nickname": "string",    // 昵称
  "sex": "man|woman|secret",  // 性别
  "birthday": "string"     // 生日 (YYYY-MM-DD格式)
}
```

##### 响应

**成功响应 (200)**

```json
{
  "code": 200,
  "data": null,
  "message": "更新成功"
}
```

---

#### 修改邮箱

**POST** `/api/user/change-email`

修改用户绑定的邮箱地址。

##### 请求头

| 名称 | 类型 | 必需 | 描述 |
|------|------|------|------|
| Authorization | string | 是 | Bearer <access_token> |

##### 请求体

```json
{
  "type": "code|password",    // 验证方式
  "old_email": "string",      // 当前邮箱 (code模式时必需)
  "old_code": "string",       // 当前邮箱验证码 (code模式时必需)
  "new_email": "string",      // 新邮箱地址
  "new_code": "string",       // 新邮箱验证码
  "password": "string"        // 用户密码 (password模式时必需)
}
```

##### 响应

**成功响应 (200)**

```json
{
  "code": 200,
  "data": null,
  "message": "更新成功"
}
```

---

#### 修改密码

**POST** `/api/user/change-password`

修改用户登录密码。

##### 请求头

| 名称 | 类型 | 必需 | 描述 |
|------|------|------|------|
| Authorization | string | 是 | Bearer <access_token> |

##### 请求体

```json
{
  "type": "email|password",   // 验证方式
  "email": "string",          // 邮箱地址 (email模式时必需)
  "code": "string",           // 邮箱验证码 (email模式时必需)
  "old_password": "string",   // 当前密码 (password模式时必需)
  "new_password": "string",   // 新密码
  "confirm_password": "string" // 确认新密码
}
```

##### 响应

**成功响应 (200)**

```json
{
  "code": 200,
  "data": null,
  "message": "修改密码成功"
}
```

---

### 设备管理 API

#### 获取登录设备列表

**GET** `/api/auth/devices`

获取当前用户所有已登录的设备列表。

##### 请求头

| 名称 | 类型 | 必需 | 描述 |
|------|------|------|------|
| Authorization | string | 是 | Bearer <access_token> |

##### 响应

**成功响应 (200)**

```json
{
  "code": 200,
  "data": {
    "devices": [
      {
        "device_id": "string",
        "device_type": "string",
        "device_name": "string",
        "ip_address": "string",
        "login_time": "datetime",
        "is_current": boolean
      }
    ]
  },
  "message": "获取登录设备列表成功"
}
```

---

#### 注销指定设备

**POST** `/api/auth/logout-device`

注销用户指定的某个设备登录状态。

##### 请求头

| 名称 | 类型 | 必需 | 描述 |
|------|------|------|------|
| Authorization | string | 是 | Bearer <access_token> |

##### 请求体

```json
{
  "device_id": "string"  // 要注销的设备ID
}
```

##### 响应

**成功响应 (200)**

```json
{
  "code": 200,
  "data": {
    "device": {
      "device_id": "string",
      "device_type": "string",
      "device_name": "string",
      "ip_address": "string",
      "login_time": "datetime"
    }
  },
  "message": "注销设备成功"
}
```

---

#### 注销其他设备

**POST** `/api/auth/logout-other-devices`

注销除当前设备外的所有其他设备登录状态。

##### 请求头

| 名称 | 类型 | 必需 | 描述 |
|------|------|------|------|
| Authorization | string | 是 | Bearer <access_token> |
| Cookie | string | 是 | 包含refresh_token |

##### 响应

**成功响应 (200)**

```json
{
  "code": 200,
  "data": {
    "devices": [
      {
        "device_id": "string",
        "device_type": "string",
        "device_name": "string",
        "ip_address": "string",
        "login_time": "datetime"
      }
    ]
  },
  "message": "注销其他设备成功"
}
```

---

### 产品相关 API

#### 按类型获取产品列表

**GET** `/api/products/:type`

根据产品类型获取产品列表。

##### 路径参数

| 名称 | 类型 | 必需 | 描述 |
|------|------|------|------|
| type | string | 是 | 产品类型，可选值：笔记本、台式机、显示器、平板、手机、配件 |

##### 响应

**成功响应 (200)**

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "title": "string",  // 产品品类名称
    "productList": [
      {
        "productId": "string",  // 产品id
        "productName": "string",  // 产品名
        "description": "string",  // 产品描述
        "mainImage": "string",  // 主图
        "isCarousel": boolean,  // 是否轮播
        "carouselImage": "string",  // 轮播图
        "minPrice": number,  // 最低配置当前价格
        "originalPrice": number,  // 原价
        "configId": "string",  // 最低价格对应的配置id
        "isSelfOperated": boolean,  // 是否自营
        "hasCoupon": boolean,  // 是否有优惠券
        "couponInfo": {  // 优惠券信息(有则返回)
          "type": "CASH|DISCOUNT",  // 优惠类型：现金减免/折扣
          "value": number  // 优惠值：现金金额/折扣比例(如0.85表示85折)
        },
        "isCustomizable": boolean,  // 是否可定制
        "supportInstallment": boolean,  // 是否支持分期付款
        "installmentNum": number,  // 分期数
        "supportTradeIn": boolean,  // 是否支持以旧换新
        "hasStock": boolean  // 是否有库存（所有配置都无库存则为false）
      }
    ]
  }
}
```

---

## 数据库模型

### 用户相关模型

#### User

用户基本信息表。

| 字段 | 类型 | 必需 | 默认值 | 描述 |
|------|------|------|--------|------|
| id | String | 是 | uuid() | 主键 |
| email | String | 是 | - | 邮箱地址（唯一） |
| password | String | 是 | - | 密码（加密存储） |
| account | String | 是 | - | 账户名（唯一） |
| memberType | MemberType | 否 | 普通会员 | 会员类型 |
| gender | Gender | 否 | secret | 性别 |
| birthday | DateTime | 否 | - | 生日 |
| avatar | String | 否 | - | 头像URL |
| nickname | String | 否 | - | 昵称 |
| createdAt | DateTime | 否 | now() | 创建时间 |
| updatedAt | DateTime | 否 | updatedAt | 更新时间 |

**关联关系**
- 一对多关联 UserLogin
- 一对多关联 UserCoupon
- 一对多关联 UserVoucher

---

#### UserLogin

用户登录记录表。

| 字段 | 类型 | 必需 | 默认值 | 描述 |
|------|------|------|--------|------|
| id | String | 是 | uuid() | 主键 |
| userId | String | 是 | - | 用户ID（外键） |
| deviceName | String | 是 | - | 设备名称 |
| deviceType | String | 是 | - | 设备类型 |
| deviceId | String | 是 | - | 设备ID |
| refreshToken | String | 是 | - | 刷新令牌 |
| loginAt | DateTime | 否 | now() | 登录时间 |
| logoutAt | DateTime | 否 | - | 登出时间 |
| ipAddress | String | 否 | - | IP地址 |
| userAgent | String | 否 | - | 用户代理 |

**关联关系**
- 多对一关联 User

**约束**
- @@unique([userId, deviceId])

---

### 产品相关模型

#### Product

产品基本信息表。

| 字段 | 类型 | 必需 | 默认值 | 描述 |
|------|------|------|--------|------|
| id | String | 是 | uuid() | 主键 |
| category | ProductCategory | 是 | - | 产品类别 |
| brand | String | 是 | - | 品牌 |
| name | String | 是 | - | 产品名称 |
| description | String | 否 | - | 产品描述 |
| mainImage | String | 否 | - | 主图URL |
| homeRecommend | Boolean | 否 | false | 是否首页推荐 |
| homeCarousel | Boolean | 否 | false | 是否首页轮播 |
| homeCarouselImg | String | 否 | - | 首页轮播图URL |
| carousel | Boolean | 否 | false | 是否轮播展示 |
| carouselImg | String | 否 | - | 轮播图URL |
| selfOperated | Boolean | 否 | false | 是否自营 |
| customizable | Boolean | 否 | false | 是否可定制 |
| installment | Boolean | 否 | false | 是否支持分期 |
| installmentNum | Int | 否 | - | 分期数 |
| supportTradeIn | Boolean | 否 | false | 是否支持以旧换新 |
| publishedAt | DateTime | 否 | - | 发布时间 |
| updatedAt | DateTime | 否 | updatedAt | 更新时间 |
| unpublishedAt | DateTime | 否 | - | 下架时间 |

**关联关系**
- 一对多关联 ProductTagRel
- 一对多关联 ProductPromoImage
- 一对多关联 ProductAppearance
- 一对多关联 ProductConfig
- 一对多关联 ProductCoupon

---

#### Tag

产品标签表。

| 字段 | 类型 | 必需 | 默认值 | 描述 |
|------|------|------|--------|------|
| id | String | 是 | uuid() | 主键 |
| name | String | 是 | - | 标签名称（唯一） |

**关联关系**
- 一对多关联 ProductTagRel

---

#### ProductTagRel

产品标签关联表。

| 字段 | 类型 | 必需 | 默认值 | 描述 |
|------|------|------|--------|------|
| productId | String | 是 | - | 产品ID（外键） |
| tagId | String | 是 | - | 标签ID（外键） |

**关联关系**
- 多对一关联 Product
- 多对一关联 Tag

**约束**
- @@id([productId, tagId])

---

#### ProductPromoImage

产品促销图片表。

| 字段 | 类型 | 必需 | 默认值 | 描述 |
|------|------|------|--------|------|
| id | String | 是 | uuid() | 主键 |
| productId | String | 是 | - | 产品ID（外键） |
| index | Int | 是 | - | 图片顺序 |
| image | String | 是 | - | 图片URL |

**关联关系**
- 多对一关联 Product

---

#### ProductAppearance

产品外观图片表。

| 字段 | 类型 | 必需 | 默认值 | 描述 |
|------|------|------|--------|------|
| id | String | 是 | uuid() | 主键 |
| productId | String | 是 | - | 产品ID（外键） |
| image | String | 是 | - | 图片URL |

**关联关系**
- 多对一关联 Product

---

#### ProductConfig

产品配置表。

| 字段 | 类型 | 必需 | 默认值 | 描述 |
|------|------|------|--------|------|
| id | String | 是 | uuid() | 主键 |
| productId | String | 是 | - | 产品ID（外键） |
| style | String | 否 | - | 配置风格 |
| name | String | 是 | - | 配置名称 |
| price | Float | 是 | - | 价格 |
| originalPrice | Float | 否 | - | 原价 |
| stock | Int | 是 | - | 库存数量 |
| image | String | 否 | - | 配置图片URL |
| createdAt | DateTime | 否 | now() | 创建时间 |
| updatedAt | DateTime | 否 | updatedAt | 更新时间 |

**关联关系**
- 多对一关联 Product

---

### 优惠券相关模型

#### Coupon

优惠券表。

| 字段 | 类型 | 必需 | 默认值 | 描述 |
|------|------|------|--------|------|
| id | String | 是 | uuid() | 主键 |
| name | String | 是 | - | 优惠券名称 |
| type | CouponType | 是 | - | 优惠券类型（CASH-现金减免，DISCOUNT-折扣） |
| value | Float | 是 | - | 优惠券值（现金金额或折扣比例） |
| threshold | Float | 否 | - | 使用门槛金额 |
| scope | String | 否 | - | 使用范围 |
| usageLimit | String | 否 | - | 使用限制 |
| stackable | Boolean | 否 | false | 是否可叠加使用 |
| startAt | DateTime | 是 | - | 生效时间 |
| expireAt | DateTime | 是 | - | 过期时间 |

**关联关系**
- 一对多关联 ProductCoupon
- 一对多关联 UserCoupon

---

#### ProductCoupon

产品优惠券关联表。

| 字段 | 类型 | 必需 | 默认值 | 描述 |
|------|------|------|--------|------|
| productId | String | 是 | - | 产品ID（外键） |
| couponId | String | 是 | - | 优惠券ID（外键） |

**关联关系**
- 多对一关联 Product
- 多对一关联 Coupon

**约束**
- @@id([productId, couponId])

---

#### UserCoupon

用户优惠券表。

| 字段 | 类型 | 必需 | 默认值 | 描述 |
|------|------|------|--------|------|
| userId | String | 是 | - | 用户ID（外键） |
| couponId | String | 是 | - | 优惠券ID（外键） |
| status | CouponStatus | 否 | UNUSED | 状态（UNUSED-未使用，USED-已使用，EXPIRED-已过期） |
| usedAt | DateTime | 否 | - | 使用时间 |
| discountUsed | Float | 否 | - | 已使用折扣金额 |

**关联关系**
- 多对一关联 User
- 多对一关联 Coupon

**约束**
- @@id([userId, couponId])

---

### 代金券相关模型

#### Voucher

代金券表。

| 字段 | 类型 | 必需 | 默认值 | 描述 |
|------|------|------|--------|------|
| id | String | 是 | uuid() | 主键 |
| title | String | 是 | - | 代金券标题 |
| amount | Float | 是 | - | 代金券金额 |
| startAt | DateTime | 是 | - | 生效时间 |
| endAt | DateTime | 是 | - | 过期时间 |

**关联关系**
- 一对多关联 UserVoucher

---

#### UserVoucher

用户代金券表。

| 字段 | 类型 | 必需 | 默认值 | 描述 |
|------|------|------|--------|------|
| userId | String | 是 | - | 用户ID（外键） |
| voucherId | String | 是 | - | 代金券ID（外键） |
| status | VoucherStatus | 否 | UNUSED | 状态（UNUSED-未使用，USED-已使用，EXPIRED-已过期） |
| usedAt | DateTime | 否 | - | 使用时间 |
| usedAmount | Float | 否 | - | 已使用金额 |
| remaining | Float | 否 | - | 剩余金额 |

**关联关系**
- 多对一关联 User
- 多对一关联 Voucher

**约束**
- @@id([userId, voucherId])

---

## 错误响应

所有API在出错时都会返回以下格式的错误响应：

```json
{
  "code": number,       // HTTP状态码
  "message": "string",  // 错误信息
  "data": null          // 错误时数据为null
}
```

常见错误码：

- `400`: 请求参数错误
- `401`: 未授权/未登录/令牌过期
- `403`: 权限不足
- `404`: 资源不存在
- `500`: 服务器内部错误

---

## 认证机制

本API使用基于JWT（JSON Web Token）的认证机制：

1. **访问令牌 (Access Token)**:
   - 通过Authorization头发送，格式为`Bearer <access_token>`
   - 有效期较短（通常为1小时）
   - 用于访问需要认证的API

2. **刷新令牌 (Refresh Token)**:
   - 存储在HTTP-only Cookie中
   - 有效期较长（通常为14天）
   - 用于获取新的访问令牌

---

## 注意事项

1. 所有需要认证的API都需要在请求头中提供有效的访问令牌
2. 刷新令牌操作会生成新的刷新令牌并更新Cookie
3. 文件上传（如头像上传）需要使用multipart/form-data格式
4. 所有日期时间格式遵循ISO 8601标准
5. 产品API支持按类型查询，类型包括：笔记本、台式机、显示器、平板、手机、配件
