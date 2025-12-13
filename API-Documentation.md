# 联想商城服务器 API 文档

## 目录

1. [认证相关 API](#认证相关-api)
   - [用户注册](#用户注册)
   - [用户登录](#用户登录)
   - [刷新令牌](#刷新令牌)
   - [退出登录](#退出登录)
   - [发送验证码](#发送验证码)

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
5. 密码等敏感信息在传输过程中应使用HTTPS加密
