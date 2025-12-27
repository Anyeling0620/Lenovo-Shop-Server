# 联想商城服务器完整 API 文档

## 目录

1. [认证相关 API](#认证相关-api)
   - [用户注册](#用户注册)
   - [用户登录](#用户登录)
   - [刷新令牌](#刷新令牌)
   - [退出登录](#退出登录)
   - [发送验证码](#发送验证码)
   - [管理员登录](#管理员登录)
   - [管理员退出登录](#管理员退出登录)
   - [获取管理员权限](#获取管理员权限)

2. [用户信息 API](#用户信息-api)
   - [获取登录用户信息](#获取登录用户信息)
   - [获取账户信息](#获取账户信息)
   - [上传头像](#上传头像)
   - [更新账户信息](#更新账户信息)
   - [修改邮箱](#修改邮箱)
   - [修改密码](#修改密码)

3. [设备管理 API](#设备管理-api)
   - [获取登录设备列表](#获取登录设备列表)
   - [注销指定设备](#注销指定设备)
   - [注销其他设备](#注销其他设备)

4. [商品相关 API](#商品相关-api)
   - [获取商品列表](#获取商品列表)
   - [获取新品商品列表](#获取新品商品列表)
   - [获取首页推荐商品](#获取首页推荐商品)
   - [获取秒杀商品列表](#获取秒杀商品列表)
   - [搜索商品](#搜索商品)
   - [获取商品评价列表](#获取商品评价列表)
   - [点赞商品评价](#点赞商品评价)
   - [获取商品详情（货架售卖）](#获取商品详情（货架售卖）)
   - [获取商品详情（秒杀区）](#获取商品详情（秒杀区）)
   - [获取优惠券列表](#获取优惠券列表)

5. [购物车 API](#购物车-api)
   - [添加商品到购物车](#添加商品到购物车)
   - [获取购物车列表](#获取购物车列表)
   - [删除购物车商品](#删除购物车商品)

6. [订单相关 API](#订单相关-api)
   - [创建订单](#创建订单)
   - [取消订单](#取消订单)
   - [使用代金券支付](#使用代金券支付)
   - [获取支付状态](#获取支付状态)
   - [获取简单订单列表](#获取简单订单列表)
   - [获取订单详情](#获取订单详情)
   - [获取订单统计](#获取订单统计)
   - [获取订单列表（带查询条件）](#获取订单列表（带查询条件）)
   - [删除订单](#删除订单)
   - [确认收货](#确认收货)

7. [地址管理 API](#地址管理-api)
   - [添加地址](#添加地址)
   - [更新地址](#更新地址)
   - [删除地址](#删除地址)
   - [获取地址列表](#获取地址列表)
   - [设置默认地址](#设置默认地址)

8. [售后相关 API](#售后相关-api)
   - [申请售后](#申请售后)
   - [取消售后](#取消售后)
   - [对完成的售后投诉](#对完成的售后投诉)
   - [评价已完成订单里的商品](#评价已完成订单里的商品)
   - [用户删除评价](#用户删除评价)
   - [用户删除投诉](#用户删除投诉)
   - [对订单吐槽](#对订单吐槽)
   - [获取评价列表](#获取评价列表)
   - [获取吐槽列表](#获取吐槽列表)
   - [获取售后列表](#获取售后列表)
   - [获取投诉列表](#获取投诉列表)
   - [获取售后详情](#获取售后详情)

---

## 认证相关 API

### 用户注册

**POST** `/api/auth/register`

注册一个新用户账号。

#### 请求头

| 名称 | 类型 | 必需 | 描述 |
|------|------|------|------|
| X-Device-Id | string | 否 | 设备ID |
| X-Device-Type | string | 否 | 设备类型 |
| X-Device-Name | string | 否 | 设备名称 |

#### 请求体

```json
{
  "email": "string",      // 邮箱地址
  "password": "string",   // 密码
  "code": "string"        // 邮箱验证码
}
```

#### 响应

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

### 用户登录

**POST** `/api/auth/login`

使用邮箱和密码登录。

#### 请求头

| 名称 | 类型 | 必需 | 描述 |
|------|------|------|------|
| X-Device-Id | string | 否 | 设备ID |
| X-Device-Type | string | 否 | 设备类型 |
| X-Device-Name | string | 否 | 设备名称 |

#### 请求体

```json
{
  "email": "string",      // 邮箱地址
  "password": "string"    // 密码
}
```

#### 响应

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

### 刷新令牌

**POST** `/api/auth/refresh`

使用刷新令牌获取新的访问令牌。

#### 请求头

| 名称 | 类型 | 必需 | 描述 |
|------|------|------|------|
| Cookie | string | 是 | 包含refresh_token |

#### 响应

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

### 退出登录

**POST** `/api/auth/logout`

退出当前会话，使令牌失效。

#### 请求头

| 名称 | 类型 | 必需 | 描述 |
|------|------|------|------|
| Cookie | string | 是 | 包含refresh_token |

#### 响应

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

### 发送验证码

**POST** `/api/send-verification-code`

向指定邮箱发送验证码。

#### 请求体

```json
{
  "email": "string",  // 邮箱地址
  "mode": "string"    // 验证码用途（可选）
}
```

#### 响应

**成功响应 (200)**

```json
{
  "code": 200,
  "data": null,
  "message": "验证码已发送"
}
```

---

### 管理员登录

**POST** `/api/admin/login`

管理员登录接口。

#### 请求体

```json
{
  "username": "string",  // 用户名
  "password": "string"   // 密码
}
```

#### 响应

**成功响应 (200)**

```json
{
  "code": 200,
  "data": {
    "access_token": "string"  // JWT访问令牌
  },
  "message": "登录成功"
}
```

---

### 管理员退出登录

**POST** `/api/admin/logout`

管理员退出登录。

#### 请求头

| 名称 | 类型 | 必需 | 描述 |
|------|------|------|------|
| Authorization | string | 是 | Bearer <access_token> |

#### 响应

**成功响应 (200)**

```json
{
  "code": 200,
  "data": null,
  "message": "退出登录成功"
}
```

---

### 获取管理员权限

**GET** `/api/admin/permissions`

获取当前管理员的权限列表。

#### 请求头

| 名称 | 类型 | 必需 | 描述 |
|------|------|------|------|
| Authorization | string | 是 | Bearer <access_token> |

#### 响应

**成功响应 (200)**

```json
{
  "code": 200,
  "data": {
    "permissions": [
      {
        "id": "string",
        "name": "string",
        "description": "string"
      }
    ]
  },
  "message": "获取权限列表成功"
}
```

---

## 用户信息 API

### 获取登录用户信息

**GET** `/api/user/login-user-info`

获取当前登录用户的基本信息。

#### 请求头

| 名称 | 类型 | 必需 | 描述 |
|------|------|------|------|
| Authorization | string | 是 | Bearer <access_token> |

#### 响应

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

### 获取账户信息

**GET** `/api/user/account-info`

获取当前登录用户的详细账户信息。

#### 请求头

| 名称 | 类型 | 必需 | 描述 |
|------|------|------|------|
| Authorization | string | 是 | Bearer <access_token> |

#### 响应

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

### 上传头像

**POST** `/api/user/upload-avatar`

上传用户头像图片。

#### 请求头

| 名称 | 类型 | 必需 | 描述 |
|------|------|------|------|
| Authorization | string | 是 | Bearer <access_token> |
| Content-Type | string | 是 | multipart/form-data |

#### 请求体

| 名称 | 类型 | 必需 | 描述 |
|------|------|------|------|
| file | File | 是 | 头像图片文件 |

#### 响应

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

### 更新账户信息

**POST** `/api/user/update-info`

更新用户的个人信息。

#### 请求头

| 名称 | 类型 | 必需 | 描述 |
|------|------|------|------|
| Authorization | string | 是 | Bearer <access_token> |

#### 请求体

```json
{
  "nickname": "string",    // 昵称
  "sex": "man|woman|secret",  // 性别
  "birthday": "string"     // 生日 (YYYY-MM-DD格式)
}
```

#### 响应

**成功响应 (200)**

```json
{
  "code": 200,
  "data": null,
  "message": "更新成功"
}
```

---

### 修改邮箱

**POST** `/api/user/change-email`

修改用户绑定的邮箱地址。

#### 请求头

| 名称 | 类型 | 必需 | 描述 |
|------|------|------|------|
| Authorization | string | 是 | Bearer <access_token> |

#### 请求体

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

#### 响应

**成功响应 (200)**

```json
{
  "code": 200,
  "data": null,
  "message": "更新成功"
}
```

---

### 修改密码

**POST** `/api/user/change-password`

修改用户登录密码。

#### 请求头

| 名称 | 类型 | 必需 | 描述 |
|------|------|------|------|
| Authorization | string | 是 | Bearer <access_token> |

#### 请求体

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

#### 响应

**成功响应 (200)**

```json
{
  "code": 200,
  "data": null,
  "message": "修改密码成功"
}
```

---

## 设备管理 API

### 获取登录设备列表

**GET** `/api/auth/devices`

获取当前用户所有已登录的设备列表。

#### 请求头

| 名称 | 类型 | 必需 | 描述 |
|------|------|------|------|
| Authorization | string | 是 | Bearer <access_token> |

#### 响应

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

### 注销指定设备

**POST** `/api/auth/logout-device`

注销用户指定的某个设备登录状态。

#### 请求头

| 名称 | 类型 | 必需 | 描述 |
|------|------|------|------|
| Authorization | string | 是 | Bearer <access_token> |

#### 请求体

```json
{
  "device_id": "string"  // 要注销的设备ID
}
```

#### 响应

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

### 注销其他设备

**POST** `/api/auth/logout-other-devices`

注销除当前设备外的所有其他设备登录状态。

#### 请求头

| 名称 | 类型 | 必需 | 描述 |
|------|------|------|------|
| Authorization | string | 是 | Bearer <access_token> |
| Cookie | string | 是 | 包含refresh_token |

#### 响应

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

## 商品相关 API

### 获取商品列表

**GET** `/api/product-cards/:category-code`

根据分类代码获取商品列表。

#### 请求头

| 名称 | 类型 | 必需 | 描述 |
|------|------|------|------|
| Authorization | string | 否 | Bearer <access_token> (可选) |

#### 路径参数

| 名称 | 类型 | 必需 | 描述 |
|------|------|------|------|
| category-code | string | 是 | 商品分类代码 |

#### 查询参数

| 名称 | 类型 | 必需 | 描述 |
|------|------|------|------|
| page | number | 否 | 页码，默认为1 |
| pageSize | number | 否 | 每页数量，默认为10 |

#### 响应

**成功响应 (200)**

```json
{
  "code": 200,
  "data": {
    "products": [
      {
        "id": "string",
        "name": "string",
        "price": number,
        "originalPrice": number,
        "imageUrl": "string",
        "sales": number,
        "rating": number,
        "tags": ["string"]
      }
    ],
    "pagination": {
      "page": number,
      "pageSize": number,
      "total": number,
      "totalPages": number
    }
  },
  "message": "获取商品列表成功"
}
```

---

### 获取新品商品列表

**GET** `/api/new-product-cards`

获取新品推荐商品列表。

#### 请求头

| 名称 | 类型 | 必需 | 描述 |
|------|------|------|------|
| Authorization | string | 否 | Bearer <access_token> (可选) |

#### 查询参数

| 名称 | 类型 | 必需 | 描述 |
|------|------|------|------|
| page | number | 否 | 页码，默认为1 |
| pageSize | number | 否 | 每页数量，默认为10 |

#### 响应

**成功响应 (200)**

```json
{
  "code": 200,
  "data": {
    "products": [
      {
        "id": "string",
        "name": "string",
        "price": number,
        "originalPrice": number,
        "imageUrl": "string",
        "sales": number,
        "rating": number,
        "tags": ["string"],
        "isNew": true
      }
    ],
    "pagination": {
      "page": number,
      "pageSize": number,
      "total": number,
      "totalPages": number
    }
  },
  "message": "获取新品商品列表成功"
}
```

---

### 获取首页推荐商品

**GET** `/api/index-product-cards`

获取首页推荐的商品列表。

#### 请求头

| 名称 | 类型 | 必需 | 描述 |
|------|------|------|------|
| Authorization | string | 否 | Bearer <access_token> (可选) |

#### 查询参数

| 名称 | 类型 | 必需 | 描述 |
|------|------|------|------|
| page | number | 否 | 页码，默认为1 |
| pageSize | number | 否 | 每页数量，默认为10 |

#### 响应

**成功响应 (200)**

```json
{
  "code": 200,
  "data": {
    "products": [
      {
        "id": "string",
        "name": "string",
        "price": number,
        "originalPrice": number,
        "imageUrl": "string",
        "sales": number,
        "rating": number,
        "tags": ["string"],
        "isRecommended": true
      }
    ],
    "pagination": {
      "page": number,
      "pageSize": number,
      "total": number,
      "totalPages": number
    }
  },
  "message": "获取首页推荐商品成功"
}
```

---

### 获取秒杀商品列表

**GET** `/api/seckill-product-cards`

获取秒杀商品列表。

#### 请求头

| 名称 | 类型 | 必需 | 描述 |
|------|------|------|------|
| Authorization | string | 否 | Bearer <access_token> (可选) |

#### 查询参数

| 名称 | 类型 | 必需 | 描述 |
|------|------|------|------|
| page | number | 否 | 页码，默认为1 |
| pageSize | number | 否 | 每页数量，默认为10 |

#### 响应

**成功响应 (200)**

```json
{
  "code": 200,
  "data": {
    "products": [
      {
        "id": "string",
        "name": "string",
        "seckillPrice": number,
        "originalPrice": number,
        "imageUrl": "string",
        "sales": number,
        "rating": number,
        "tags": ["string"],
        "seckillStartTime": "datetime",
        "seckillEndTime": "datetime",
        "seckillStock": number,
        "isSeckill": true
      }
    ],
    "pagination": {
      "page": number,
      "pageSize": number,
      "total": number,
      "totalPages": number
    }
  },
  "message": "获取秒杀商品列表成功"
}
```

---

### 搜索商品

**GET** `/api/search-product-cards`

根据关键词搜索商品。

#### 请求头

| 名称 | 类型 | 必需 | 描述 |
|------|------|------|------|
| Authorization | string | 否 | Bearer <access_token> (可选) |

#### 查询参数

| 名称 | 类型 | 必需 | 描述 |
|------|------|------|------|
| keyword | string | 是 | 搜索关键词 |
| page | number | 否 | 页码，默认为1 |
| pageSize | number | 否 | 每页数量，默认为10 |
| sort | string | 否 | 排序方式，默认为相关度 |
| priceMin | number | 否 | 最低价格 |
| priceMax | number | 否 | 最高价格 |
| category | string | 否 | 商品分类 |

#### 响应

**成功响应 (200)**

```json
{
  "code": 200,
  "data": {
    "products": [
      {
        "id": "string",
        "name": "string",
        "price": number,
        "originalPrice": number,
        "imageUrl": "string",
        "sales": number,
        "rating": number,
        "tags": ["string"]
      }
    ],
    "pagination": {
      "page": number,
      "pageSize": number,
      "total": number,
      "totalPages": number
    },
    "filters": {
      "categories": ["string"],
      "priceRanges": [
        {
          "min": number,
          "max": number,
          "count": number
        }
      ]
    }
  },
  "message": "搜索商品成功"
}
```

---

### 获取商品评价列表

**GET** `/api/:productId/evaluations`

获取指定商品的评价列表。

#### 路径参数

| 名称 | 类型 | 必需 | 描述 |
|------|------|------|------|
| productId | string | 是 | 商品ID |

#### 查询参数

| 名称 | 类型 | 必需 | 描述 |
|------|------|------|------|
| page | number | 否 | 页码，默认为1 |
| pageSize | number | 否 | 每页数量，默认为10 |
| rating | number | 否 | 评分筛选 (1-5) |
| sort | string | 否 | 排序方式，默认为最新 |

#### 响应

**成功响应 (200)**

```json
{
  "code": 200,
  "data": {
    "evaluations": [
      {
        "id": "string",
        "userId": "string",
        "userName": "string",
        "userAvatar": "string",
        "rating": number,
        "content": "string",
        "images": ["string"],
        "specifications": {
          "key": "value"
        },
        "likes": number,
        "isLiked": boolean,
        "createTime": "datetime",
        "reply": {
          "content": "string",
          "createTime": "datetime"
        }
      }
    ],
    "pagination": {
      "page": number,
      "pageSize": number,
      "total": number,
      "totalPages": number
    },
    "statistics": {
      "averageRating": number,
      "ratingDistribution": {
        "5": number,
        "4": number,
        "3": number,
        "2": number,
        "1": number
      }
    }
  },
  "message": "获取商品评价列表成功"
}
```

---

### 点赞商品评价

**GET** `/api/evaluations/:evaluationId/like`

点赞或取消点赞商品评价。

#### 请求头

| 名称 | 类型 | 必需 | 描述 |
|------|------|------|------|
| Authorization | string | 是 | Bearer <access_token> |

#### 路径参数

| 名称 | 类型 | 必需 | 描述 |
|------|------|------|------|
| evaluationId | string | 是 | 评价ID |

#### 响应

**成功响应 (200)**

```json
{
  "code": 200,
  "data": {
    "isLiked": boolean,
    "likes": number
  },
  "message": "操作成功"
}
```

---

### 获取商品详情（货架售卖）

**GET** `/api/shelf-products/:id/detail`

获取货架售卖商品的详细信息。

#### 请求头

| 名称 | 类型 | 必需 | 描述 |
|------|------|------|------|
| Authorization | string | 否 | Bearer <access_token> (可选) |

#### 路径参数

| 名称 | 类型 | 必需 | 描述 |
|------|------|------|------|
| id | string | 是 | 商品ID |

#### 响应

**成功响应 (200)**

```json
{
  "code": 200,
  "data": {
    "product": {
      "id": "string",
      "name": "string",
      "description": "string",
      "price": number,
      "originalPrice": number,
      "images": ["string"],
      "video": "string",
      "sales": number,
      "stock": number,
      "rating": number,
      "reviewCount": number,
      "category": {
        "id": "string",
        "name": "string",
        "code": "string"
      },
      "brand": {
        "id": "string",
        "name": "string"
      },
      "specifications": [
        {
          "name": "string",
          "options": [
            {
              "value": "string",
              "price": number,
              "stock": number,
              "image": "string"
            }
          ]
        }
      ],
      "details": {
        "key": "value"
      },
      "services": ["string"],
      "isFavorite": boolean,
      "promotion": {
        "type": "string",
        "title": "string",
        "description": "string",
        "discount": number,
        "startTime": "datetime",
        "endTime": "datetime"
      }
    }
  },
  "message": "获取商品详情成功"
}
```

---

### 获取商品详情（秒杀区）

**GET** `/api/seckill-products/:seckillId/:id/detail`

获取秒杀区商品的详细信息。

#### 请求头

| 名称 | 类型 | 必需 | 描述 |
|------|------|------|------|
| Authorization | string | 否 | Bearer <access_token> (可选) |

#### 路径参数

| 名称 | 类型 | 必需 | 描述 |
|------|------|------|------|
| seckillId | string | 是 | 秒杀活动ID |
| id | string | 是 | 商品ID |

#### 响应

**成功响应 (200)**

```json
{
  "code": 200,
  "data": {
    "product": {
      "id": "string",
      "name": "string",
      "description": "string",
      "seckillPrice": number,
      "originalPrice": number,
      "images": ["string"],
      "video": "string",
      "sales": number,
      "seckillStock": number,
      "totalStock": number,
      "rating": number,
      "reviewCount": number,
      "category": {
        "id": "string",
        "name": "string",
        "code": "string"
      },
      "brand": {
        "id": "string",
        "name": "string"
      },
      "specifications": [
        {
          "name": "string",
          "options": [
            {
              "value": "string",
              "seckillPrice": number,
              "originalPrice": number,
              "seckillStock": number,
              "image": "string"
            }
          ]
        }
      ],
      "details": {
        "key": "value"
      },
      "services": ["string"],
      "isFavorite": boolean,
      "seckill": {
        "id": "string",
        "startTime": "datetime",
        "endTime": "datetime",
        "status": "not_started|in_progress|ended",
        "limitPerUser": number,
        "userBoughtCount": number
      }
    }
  },
  "message": "获取秒杀商品详情成功"
}
```

---

### 获取优惠券列表

**GET** `/api/coupon-center/coupons`

获取优惠券中心的优惠券列表。

#### 请求头

| 名称 | 类型 | 必需 | 描述 |
|------|------|------|------|
| Authorization | string | 否 | Bearer <access_token> (可选) |

#### 查询参数

| 名称 | 类型 | 必需 | 描述 |
|------|------|------|------|
| page | number | 否 | 页码，默认为1 |
| pageSize | number | 否 | 每页数量，默认为10 |
| type | string | 否 | 优惠券类型 |
| status | string | 否 | 优惠券状态 |

#### 响应

**成功响应 (200)**

```json
{
  "code": 200,
  "data": {
    "coupons": [
      {
        "id": "string",
        "title": "string",
        "description": "string",
        "type": "discount|cash|gift",
        "value": number,
        "minAmount": number,
        "maxDiscount": number,
        "startTime": "datetime",
        "endTime": "datetime",
        "total": number,
        "received": number,
        "isReceived": boolean,
        "canReceive": boolean,
        "applicableProducts": ["string"],
        "applicableCategories": ["string"]
      }
    ],
    "pagination": {
      "page": number,
      "pageSize": number,
      "total": number,
      "totalPages": number
    }
  },
  "message": "获取优惠券列表成功"
}
```

---

## 购物车 API

### 添加商品到购物车

**POST** `/api/shopping-cart/add`

添加商品到购物车。

#### 请求头

| 名称 | 类型 | 必需 | 描述 |
|------|------|------|------|
| Authorization | string | 是 | Bearer <access_token> |

#### 请求体

```json
{
  "configId": "string"  // 商品配置ID
}
```

#### 响应

**成功响应 (201)**

```json
{
  "code": 201,
  "data": null,
  "message": "success"
}
```

---

### 获取购物车列表

**GET** `/api/shopping-cart/list`

获取当前用户的购物车商品列表。

#### 请求头

| 名称 | 类型 | 必需 | 描述 |
|------|------|------|------|
| Authorization | string | 是 | Bearer <access_token> |

#### 响应

**成功响应 (200)**

```json
{
  "code": 200,
  "data": {
    "items": [
      {
        "id": "string",
        "productId": "string",
        "productName": "string",
        "productImage": "string",
        "configId": "string",
        "specifications": {
          "key": "value"
        },
        "price": number,
        "originalPrice": number,
        "quantity": number,
        "stock": number,
        "isSelected": boolean,
        "isAvailable": boolean,
        "subtotal": number
      }
    ],
    "total": {
      "selectedCount": number,
      "selectedAmount": number,
      "totalAmount": number,
      "totalDiscount": number
    }
  },
  "message": "success"
}
```

---

### 删除购物车商品

**DELETE** `/api/shopping-cart/delete`

删除购物车中的商品。

#### 请求头

| 名称 | 类型 | 必需 | 描述 |
|------|------|------|------|
| Authorization | string | 是 | Bearer <access_token> |

#### 请求体

```json
{
  "card_ids": ["string"]  // 购物车项ID数组
}
```

#### 响应

**成功响应 (201)**

```json
{
  "code": 201,
  "data": {
    "count": number  // 删除的商品数量
  },
  "message": "删除购物车成功"
}
```

---

## 订单相关 API

### 创建订单

**POST** `/api/order/create`

创建新订单。

#### 请求头

| 名称 | 类型 | 必需 | 描述 |
|------|------|------|------|
| Authorization | string | 是 | Bearer <access_token> |

#### 请求体

```json
{
  "addressId": "string",           // 收货地址ID
  "paymentMethod": "string",        // 支付方式
  "items": [                       // 订单商品列表
    {
      "productId": "string",        // 商品ID
      "configId": "string",         // 商品配置ID
      "quantity": number,           // 购买数量
      "price": number,              // 商品单价
      "isSeckill": boolean          // 是否为秒杀商品
    }
  ],
  "couponId": "string",            // 优惠券ID（可选）
  "remark": "string"               // 订单备注（可选）
}
```

#### 响应

**成功响应 (201)**

```json
{
  "code": 201,
  "data": {
    "orderId": "string",
    "orderNo": "string",
    "totalAmount": number,
    "discountAmount": number,
    "payableAmount": number,
    "paymentUrl": "string"
  },
  "message": "订单创建成功"
}
```

---

### 取消订单

**POST** `/api/order/cancel`

取消未支付的订单。

#### 请求头

| 名称 | 类型 | 必需 | 描述 |
|------|------|------|------|
| Authorization | string | 是 | Bearer <access_token> |

#### 请求体

```json
{
  "orderId": "string",     // 订单ID
  "reason": "string"       // 取消原因
}
```

#### 响应

**成功响应 (200)**

```json
{
  "code": 200,
  "data": null,
  "message": "订单取消成功"
}
```

---

### 使用代金券支付

**POST** `/api/order/pay/voucher`

使用代金券支付订单。

#### 请求头

| 名称 | 类型 | 必需 | 描述 |
|------|------|------|------|
| Authorization | string | 是 | Bearer <access_token> |

#### 请求体

```json
{
  "orderId": "string",     // 订单ID
  "voucherCode": "string"  // 代金券代码
}
```

#### 响应

**成功响应 (200)**

```json
{
  "code": 200,
  "data": {
    "orderId": "string",
    "status": "string",
    "paymentTime": "datetime"
  },
  "message": "支付成功"
}
```

---

### 获取支付状态

**POST** `/api/order/payment/status`

获取订单支付状态。

#### 请求头

| 名称 | 类型 | 必需 | 描述 |
|------|------|------|------|
| Authorization | string | 是 | Bearer <access_token> |

#### 请求体

```json
{
  "orderId": "string"  // 订单ID
}
```

#### 响应

**成功响应 (200)**

```json
{
  "code": 200,
  "data": {
    "orderId": "string",
    "status": "pending|paid|failed|cancelled",
    "paymentTime": "datetime",
    "paymentMethod": "string",
    "transactionId": "string"
  },
  "message": "获取支付状态成功"
}
```

---

### 获取简单订单列表

**GET** `/api/order/list`

获取当前用户的简单订单列表。

#### 请求头

| 名称 | 类型 | 必需 | 描述 |
|------|------|------|------|
| Authorization | string | 是 | Bearer <access_token> |

#### 查询参数

| 名称 | 类型 | 必需 | 描述 |
|------|------|------|------|
| page | number | 否 | 页码，默认为1 |
| pageSize | number | 否 | 每页数量，默认为10 |
| status | string | 否 | 订单状态筛选 |

#### 响应

**成功响应 (200)**

```json
{
  "code": 200,
  "data": {
    "orders": [
      {
        "id": "string",
        "orderNo": "string",
        "status": "string",
        "totalAmount": number,
        "createTime": "datetime",
        "items": [
          {
            "productId": "string",
            "productName": "string",
            "productImage": "string",
            "quantity": number,
            "price": number
          }
        ]
      }
    ],
    "pagination": {
      "page": number,
      "pageSize": number,
      "total": number,
      "totalPages": number
    }
  },
  "message": "获取订单列表成功"
}
```

---

### 获取订单详情

**GET** `/api/order/order-detail/:id`

获取指定订单的详细信息。

#### 请求头

| 名称 | 类型 | 必需 | 描述 |
|------|------|------|------|
| Authorization | string | 是 | Bearer <access_token> |

#### 路径参数

| 名称 | 类型 | 必需 | 描述 |
|------|------|------|------|
| id | string | 是 | 订单ID |

#### 响应

**成功响应 (200)**

```json
{
  "code": 200,
  "data": {
    "order": {
      "id": "string",
      "orderNo": "string",
      "status": "string",
      "totalAmount": number,
      "discountAmount": number,
      "payableAmount": number,
      "paymentMethod": "string",
      "paymentTime": "datetime",
      "createTime": "datetime",
      "remark": "string",
      "address": {
        "receiver": "string",
        "phone": "string",
        "province": "string",
        "city": "string",
        "area": "string",
        "street": "string",
        "detail": "string"
      },
      "items": [
        {
          "productId": "string",
          "productName": "string",
          "productImage": "string",
          "configId": "string",
          "specifications": {
            "key": "value"
          },
          "quantity": number,
          "price": number,
          "subtotal": number
        }
      ],
      "timeline": [
        {
          "status": "string",
          "title": "string",
          "description": "string",
          "time": "datetime"
        }
      ]
    }
  },
  "message": "获取订单详情成功"
}
```

---

### 获取订单统计

**GET** `/api/order/stats`

获取当前用户的订单统计数据。

#### 请求头

| 名称 | 类型 | 必需 | 描述 |
|------|------|------|------|
| Authorization | string | 是 | Bearer <access_token> |

#### 响应

**成功响应 (200)**

```json
{
  "code": 200,
  "data": {
    "stats": {
      "pendingPayment": number,
      "pendingDelivery": number,
      "pendingReceipt": number,
      "completed": number,
      "afterSale": number,
      "totalAmount": number
    }
  },
  "message": "获取订单统计成功"
}
```

---

### 获取订单列表（带查询条件）

**GET** `/api/order/list/query`

根据查询条件获取订单列表。

#### 请求头

| 名称 | 类型 | 必需 | 描述 |
|------|------|------|------|
| Authorization | string | 是 | Bearer <access_token> |

#### 查询参数

| 名称 | 类型 | 必需 | 描述 |
|------|------|------|------|
| page | number | 否 | 页码，默认为1 |
| pageSize | number | 否 | 每页数量，默认为10 |
| status | string | 否 | 订单状态筛选 |
| startTime | string | 否 | 开始时间 (YYYY-MM-DD) |
| endTime | string | 否 | 结束时间 (YYYY-MM-DD) |
| keyword | string | 否 | 关键词搜索（商品名称或订单号） |

#### 响应

**成功响应 (200)**

```json
{
  "code": 200,
  "data": {
    "orders": [
      {
        "id": "string",
        "orderNo": "string",
        "status": "string",
        "totalAmount": number,
        "createTime": "datetime",
        "items": [
          {
            "productId": "string",
            "productName": "string",
            "productImage": "string",
            "quantity": number,
            "price": number
          }
        ]
      }
    ],
    "pagination": {
      "page": number,
      "pageSize": number,
      "total": number,
      "totalPages": number
    },
    "filters": {
      "statusOptions": [
        {
          "value": "string",
          "label": "string",
          "count": number
        }
      ]
    }
  },
  "message": "获取订单列表成功"
}
```

---

### 删除订单

**DELETE** `/api/order/delete-order/:orderId`

删除已取消或已完成的订单。

#### 请求头

| 名称 | 类型 | 必需 | 描述 |
|------|------|------|------|
| Authorization | string | 是 | Bearer <access_token> |

#### 路径参数

| 名称 | 类型 | 必需 | 描述 |
|------|------|------|------|
| orderId | string | 是 | 订单ID |

#### 响应

**成功响应 (200)**

```json
{
  "code": 200,
  "data": null,
  "message": "订单删除成功"
}
```

---

### 确认收货

**POST** `/api/order/confirm-receipt`

确认收货，将订单状态更新为已完成。

#### 请求头

| 名称 | 类型 | 必需 | 描述 |
|------|------|------|------|
| Authorization | string | 是 | Bearer <access_token> |

#### 请求体

```json
{
  "orderId": "string"  // 订单ID
}
```

#### 响应

**成功响应 (200)**

```json
{
  "code": 200,
  "data": null,
  "message": "确认收货成功"
}
```

---

## 地址管理 API

### 添加地址

**POST** `/api/address/add`

添加新的收货地址。

#### 请求头

| 名称 | 类型 | 必需 | 描述 |
|------|------|------|------|
| Authorization | string | 是 | Bearer <access_token> |

#### 请求体

```json
{
  "provinceCode": "string",  // 省份代码
  "cityCode": "string",      // 城市代码
  "areaCode": "string",      // 区域代码
  "streetCode": "string",    // 街道代码
  "address": "string",       // 详细地址
  "receiver": "string",      // 收货人姓名
  "phone": "string",         // 收货人手机号
  "isDefault": boolean       // 是否设为默认地址
}
```

#### 响应

**成功响应 (201)**

```json
{
  "code": 201,
  "data": {
    "id": "string"  // 新增地址ID
  },
  "message": "success"
}
```

---

### 更新地址

**PUT** `/api/address/update/:address-id`

更新现有的收货地址。

#### 请求头

| 名称 | 类型 | 必需 | 描述 |
|------|------|------|------|
| Authorization | string | 是 | Bearer <access_token> |

#### 路径参数

| 名称 | 类型 | 必需 | 描述 |
|------|------|------|------|
| address-id | string | 是 | 地址ID |

#### 请求体

```json
{
  "provinceCode": "string",  // 省份代码
  "cityCode": "string",      // 城市代码
  "areaCode": "string",      // 区域代码
  "streetCode": "string",    // 街道代码
  "address": "string",       // 详细地址
  "receiver": "string",      // 收货人姓名
  "phone": "string",         // 收货人手机号
  "isDefault": boolean       // 是否设为默认地址
}
```

#### 响应

**成功响应 (200)**

```json
{
  "code": 200,
  "data": null,
  "message": "success"
}
```

---

### 删除地址

**DELETE** `/api/address/remove/:address-id`

删除指定的收货地址。

#### 请求头

| 名称 | 类型 | 必需 | 描述 |
|------|------|------|------|
| Authorization | string | 是 | Bearer <access_token> |

#### 路径参数

| 名称 | 类型 | 必需 | 描述 |
|------|------|------|------|
| address-id | string | 是 | 地址ID |

#### 响应

**成功响应 (200)**

```json
{
  "code": 200,
  "data": null,
  "message": "success"
}
```

---

### 获取地址列表

**GET** `/api/address/list`

获取当前用户的收货地址列表。

#### 请求头

| 名称 | 类型 | 必需 | 描述 |
|------|------|------|------|
| Authorization | string | 是 | Bearer <access_token> |

#### 响应

**成功响应 (200)**

```json
{
  "code": 200,
  "data": {
    "list": [
      {
        "id": "string",
        "provinceCode": "string",
        "cityCode": "string",
        "areaCode": "string",
        "streetCode": "string",
        "provinceName": "string",
        "cityName": "string",
        "areaName": "string",
        "streetName": "string",
        "address": "string",
        "receiver": "string",
        "phone": "string",
        "isDefault": boolean
      }
    ]
  },
  "message": "success"
}
```

---

### 设置默认地址

**PUT** `/api/address/set-default/:address-id`

将指定地址设为默认收货地址。

#### 请求头

| 名称 | 类型 | 必需 | 描述 |
|------|------|------|------|
| Authorization | string | 是 | Bearer <access_token> |

#### 路径参数

| 名称 | 类型 | 必需 | 描述 |
|------|------|------|------|
| address-id | string | 是 | 地址ID |

#### 响应

**成功响应 (200)**

```json
{
  "code": 200,
  "data": null,
  "message": "success"
}
```

---

## 售后相关 API

### 申请售后

**POST** `/api/after-sale/apply`

申请售后服务。

#### 请求头

| 名称 | 类型 | 必需 | 描述 |
|------|------|------|------|
| Authorization | string | 是 | Bearer <access_token> |
| Content-Type | string | 是 | multipart/form-data |

#### 请求体

| 名称 | 类型 | 必需 | 描述 |
|------|------|------|------|
| orderId | string | 是 | 订单ID |
| itemId | string | 是 | 订单项ID |
| type | string | 是 | 售后类型（退货/换货/维修） |
| reason | string | 是 | 申请原因 |
| description | string | 否 | 详细描述 |
| images | File[] | 否 | 证明图片（可上传多张） |
| returnAmount | number | 否 | 退款金额（退货时） |

#### 响应

**成功响应 (201)**

```json
{
  "code": 201,
  "data": {
    "id": "string",
    "afterSaleNo": "string"
  },
  "message": "售后申请提交成功"
}
```

---

### 取消售后

**PUT** `/api/after-sale/cancel/:id`

取消售后申请。

#### 请求头

| 名称 | 类型 | 必需 | 描述 |
|------|------|------|------|
| Authorization | string | 是 | Bearer <access_token> |

#### 路径参数

| 名称 | 类型 | 必需 | 描述 |
|------|------|------|------|
| id | string | 是 | 售后申请ID |

#### 响应

**成功响应 (200)**

```json
{
  "code": 200,
  "data": null,
  "message": "售后申请已取消"
}
```

---

### 对完成的售后投诉

**POST** `/api/after-sale/complaint`

对已完成的售后服务进行投诉。

#### 请求头

| 名称 | 类型 | 必需 | 描述 |
|------|------|------|------|
| Authorization | string | 是 | Bearer <access_token> |
| Content-Type | string | 是 | multipart/form-data |

#### 请求体

| 名称 | 类型 | 必需 | 描述 |
|------|------|------|------|
| afterSaleId | string | 是 | 售后ID |
| content | string | 是 | 投诉内容 |
| images | File[] | 否 | 证明图片（可上传多张） |

#### 响应

**成功响应 (201)**

```json
{
  "code": 201,
  "data": {
    "id": "string",
    "complaintNo": "string"
  },
  "message": "投诉提交成功"
}
```

---

### 评价已完成订单里的商品

**POST** `/api/after-sale/evaluation`

对已完成订单的商品进行评价。

#### 请求头

| 名称 | 类型 | 必需 | 描述 |
|------|------|------|------|
| Authorization | string | 是 | Bearer <access_token> |
| Content-Type | string | 是 | multipart/form-data |

#### 请求体

| 名称 | 类型 | 必需 | 描述 |
|------|------|------|------|
| orderId | string | 是 | 订单ID |
| itemId | string | 是 | 订单项ID |
| rating | number | 是 | 评分（1-5） |
| content | string | 是 | 评价内容 |
| images | File[] | 否 | 评价图片（可上传多张） |
| specifications | object | 否 | 商品规格信息 |

#### 响应

**成功响应 (201)**

```json
{
  "code": 201,
  "data": {
    "id": "string"
  },
  "message": "评价提交成功"
}
```

---

### 用户删除评价

**DELETE** `/api/after-sale/evaluation/:id`

删除自己提交的商品评价。

#### 请求头

| 名称 | 类型 | 必需 | 描述 |
|------|------|------|------|
| Authorization | string | 是 | Bearer <access_token> |

#### 路径参数

| 名称 | 类型 | 必需 | 描述 |
|------|------|------|------|
| id | string | 是 | 评价ID |

#### 响应

**成功响应 (200)**

```json
{
  "code": 200,
  "data": null,
  "message": "评价删除成功"
}
```

---

### 用户删除投诉

**DELETE** `/api/after-sale/complaint/:id`

删除自己提交的投诉。

#### 请求头

| 名称 | 类型 | 必需 | 描述 |
|------|------|------|------|
| Authorization | string | 是 | Bearer <access_token> |

#### 路径参数

| 名称 | 类型 | 必需 | 描述 |
|------|------|------|------|
| id | string | 是 | 投诉ID |

#### 响应

**成功响应 (200)**

```json
{
  "code": 200,
  "data": null,
  "message": "投诉删除成功"
}
```

---

### 对订单吐槽

**POST** `/api/after-sale/comment`

对订单进行吐槽/评论。

#### 请求头

| 名称 | 类型 | 必需 | 描述 |
|------|------|------|------|
| Authorization | string | 是 | Bearer <access_token> |
| Content-Type | string | 是 | multipart/form-data |

#### 请求体

| 名称 | 类型 | 必需 | 描述 |
|------|------|------|------|
| orderId | string | 是 | 订单ID |
| content | string | 是 | 吐槽内容 |
| images | File[] | 否 | 证明图片（可上传多张） |

#### 响应

**成功响应 (201)**

```json
{
  "code": 201,
  "data": {
    "id": "string"
  },
  "message": "吐槽提交成功"
}
```

---

### 获取评价列表

**GET** `/api/after-sale/evaluations`

获取当前用户提交的商品评价列表。

#### 请求头

| 名称 | 类型 | 必需 | 描述 |
|------|------|------|------|
| Authorization | string | 是 | Bearer <access_token> |

#### 查询参数

| 名称 | 类型 | 必需 | 描述 |
|------|------|------|------|
| page | number | 否 | 页码，默认为1 |
| pageSize | number | 否 | 每页数量，默认为10 |

#### 响应

**成功响应 (200)**

```json
{
  "code": 200,
  "data": {
    "evaluations": [
      {
        "id": "string",
        "orderId": "string",
        "orderNo": "string",
        "itemId": "string",
        "productId": "string",
        "productName": "string",
        "productImage": "string",
        "specifications": {
          "key": "value"
        },
        "rating": number,
        "content": "string",
        "images": ["string"],
        "likes": number,
        "reply": {
          "content": "string",
          "createTime": "datetime"
        },
        "createTime": "datetime",
        "status": "string"
      }
    ],
    "pagination": {
      "page": number,
      "pageSize": number,
      "total": number,
      "totalPages": number
    }
  },
  "message": "获取评价列表成功"
}
```

---

### 获取吐槽列表

**GET** `/api/after-sale/comments`

获取当前用户提交的订单吐槽列表。

#### 请求头

| 名称 | 类型 | 必需 | 描述 |
|------|------|------|------|
| Authorization | string | 是 | Bearer <access_token> |

#### 查询参数

| 名称 | 类型 | 必需 | 描述 |
|------|------|------|------|
| page | number | 否 | 页码，默认为1 |
| pageSize | number | 否 | 每页数量，默认为10 |

#### 响应

**成功响应 (200)**

```json
{
  "code": 200,
  "data": {
    "comments": [
      {
        "id": "string",
        "orderId": "string",
        "orderNo": "string",
        "content": "string",
        "images": ["string"],
        "reply": {
          "content": "string",
          "createTime": "datetime"
        },
        "createTime": "datetime",
        "status": "string"
      }
    ],
    "pagination": {
      "page": number,
      "pageSize": number,
      "total": number,
      "totalPages": number
    }
  },
  "message": "获取吐槽列表成功"
}
```

---

### 获取售后列表

**GET** `/api/after-sale/after-sales`

获取当前用户的售后申请列表。

#### 请求头

| 名称 | 类型 | 必需 | 描述 |
|------|------|------|------|
| Authorization | string | 是 | Bearer <access_token> |

#### 查询参数

| 名称 | 类型 | 必需 | 描述 |
|------|------|------|------|
| page | number | 否 | 页码，默认为1 |
| pageSize | number | 否 | 每页数量，默认为10 |
| status | string | 否 | 售后状态筛选 |

#### 响应

**成功响应 (200)**

```json
{
  "code": 200,
  "data": {
    "afterSales": [
      {
        "id": "string",
        "afterSaleNo": "string",
        "orderId": "string",
        "orderNo": "string",
        "itemId": "string",
        "productId": "string",
        "productName": "string",
        "productImage": "string",
        "type": "string",
        "status": "string",
        "reason": "string",
        "description": "string",
        "images": ["string"],
        "createTime": "datetime",
        "updateTime": "datetime",
        "timeline": [
          {
            "status": "string",
            "title": "string",
            "description": "string",
            "time": "datetime"
          }
        ]
      }
    ],
    "pagination": {
      "page": number,
      "pageSize": number,
      "total": number,
      "totalPages": number
    }
  },
  "message": "获取售后列表成功"
}
```

---

### 获取投诉列表

**GET** `/api/after-sale/complaints`

获取当前用户提交的投诉列表。

#### 请求头

| 名称 | 类型 | 必需 | 描述 |
|------|------|------|------|
| Authorization | string | 是 | Bearer <access_token> |

#### 查询参数

| 名称 | 类型 | 必需 | 描述 |
|------|------|------|------|
| page | number | 否 | 页码，默认为1 |
| pageSize | number | 否 | 每页数量，默认为10 |
| status | string | 否 | 投诉状态筛选 |

#### 响应

**成功响应 (200)**

```json
{
  "code": 200,
  "data": {
    "complaints": [
      {
        "id": "string",
        "complaintNo": "string",
        "afterSaleId": "string",
        "afterSaleNo": "string",
        "content": "string",
        "images": ["string"],
        "status": "string",
        "createTime": "datetime",
        "updateTime": "datetime",
        "reply": {
          "content": "string",
          "createTime": "datetime"
        }
      }
    ],
    "pagination": {
      "page": number,
      "pageSize": number,
      "total": number,
      "totalPages": number
    }
  },
  "message": "获取投诉列表成功"
}
```

---

### 获取售后详情

**GET** `/api/after-sale/after-sales/:id`

获取指定售后申请的详细信息。

#### 请求头

| 名称 | 类型 | 必需 | 描述 |
|------|------|------|------|
| Authorization | string | 是 | Bearer <access_token> |

#### 路径参数

| 名称 | 类型 | 必需 | 描述 |
|------|------|------|------|
| id | string | 是 | 售后ID |

#### 响应

**成功响应 (200)**

```json
{
  "code": 200,
  "data": {
    "afterSale": {
      "id": "string",
      "afterSaleNo": "string",
      "orderId": "string",
      "orderNo": "string",
      "itemId": "string",
      "productId": "string",
      "productName": "string",
      "productImage": "string",
      "specifications": {
        "key": "value"
      },
      "type": "string",
      "status": "string",
      "reason": "string",
      "description": "string",
      "images": ["string"],
      "returnAmount": number,
      "createTime": "datetime",
      "updateTime": "datetime",
      "timeline": [
        {
          "status": "string",
          "title": "string",
          "description": "string",
          "time": "datetime",
          "operator": "string"
        }
      ],
      "logistics": {
        "company": "string",
        "trackingNo": "string",
        "status": "string",
        "updateTime": "datetime"
      },
      "complaint": {
        "id": "string",
        "content": "string",
        "images": ["string"],
        "status": "string",
        "createTime": "datetime",
        "reply": {
          "content": "string",
          "createTime": "datetime"
        }
      }
    }
  },
  "message": "获取售后详情成功"
}
```

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
3. 文件上传（如头像上传、售后图片上传）需要使用multipart/form-data格式
4. 所有日期时间格式遵循ISO 8601标准
5. 分页查询参数：page（页码，从1开始）和pageSize（每页数量）
6. 列表接口通常返回pagination对象，包含分页信息
