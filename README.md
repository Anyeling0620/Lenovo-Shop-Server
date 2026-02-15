# lenovo-shop-server

联想商城后端服务（配套 `lenovo-shop` 前台与 `lenovo-admin` 管理端）。

- 技术栈：Hono + Prisma(MySQL) + TypeScript
- 本地运行：`tsx watch src/index.ts`
- 静态资源：本地开发时可通过 `/static/*` 访问 `public/`

## 主要功能（按代码实际路由）

| 模块 | 前缀 | 说明 |
|---|---|---|
| 客户端认证 | `/api/auth/*` | 注册/登录/刷新/登出（JWT） |
| 用户信息 | `/api/user/*` | 用户资料等 |
| 商品 | `/api/products/*` | 商品卡片、搜索、详情、评价、领券中心 |
| 订单 | `/api/order/*` | 下单、取消、支付(代金券)、列表、详情、确认收货 |
| 售后 | `/api/after-sale/*` | 退换修、投诉等 |
| 管理端 | `/admin/*` | 管理后台接口（Cookie Session） |

> 路由装配见 `src/index.ts`。

## 快速上手：3 分钟跑通一次完整流程

1) 启动服务后先确认健康检查：

- `GET /api/ping`
- `GET /api/ping-test`

2) 客户端登录（获取 JWT）：

- `POST /api/auth/register`（可选，首次注册）
- `POST /api/auth/login`

3) 带 JWT 调用需要登录的接口：

- 例如：`GET /api/user/login-user-info`
- 例如：`POST /api/order/create`

4) 管理端登录（拿到 Cookie Session）：

- `POST /admin/login`
- 后续请求自动携带 `admin_session` cookie（浏览器场景）

> 下面的“接口速查”给了按模块整理的清单与示例。

## 鉴权说明

- 客户端（`/api/*`）：JWT
	- 严格鉴权：`src/middleware/jwt.middleware.ts`
	- 宽松鉴权（可选登录态）：`src/middleware/jwt-loose.middleware.ts`
- 管理端（`/admin/*`）：Cookie Session
	- cookie 名：`admin_session`
	- 中间件：`src/middleware/session.middleware.ts`
	- 白名单：`POST /admin/login` 不需要 session

## 请求与返回约定（联调必看）

### 基础 URL

- 本地：`http://localhost:3003`
- 所有接口 Path 都是相对路径，例如：`/api/auth/login`

### 客户端 JWT 怎么传

项目里 JWT 中间件会从请求头读取 token（常见方案是 `Authorization: Bearer <token>`）。如果你前端里用了其它 key，请以 `src/middleware/jwt.middleware.ts` 的实现为准。

推荐写法（示例）：

```http
Authorization: Bearer <ACCESS_TOKEN>
```

### 管理端 Session 怎么传

管理端鉴权依赖 Cookie：`admin_session`，中间件见 `src/middleware/session.middleware.ts`。

浏览器同域/跨域时要注意：

- 前端请求需要 `credentials: 'include'`
- 后端已开启 `cors({ credentials: true })`

### 返回结构

全局错误处理在 `src/index.ts`：

- 业务抛出 `HTTPException` 时：返回 `{ code, message, data }`
- 未捕获异常：`code=500`、`message=服务器内部错误`

不同 controller 的成功返回结构可能不完全统一；联调时建议优先查看对应 controller 文件。

## 接口速查（更可视化 / 按模块）

> 说明：这里是“按路由文件”整理的接口索引，细节参数以 controller 为准。

### 1) 健康检查

| Method | Path | 鉴权 | 备注 |
|---|---|---|---|
| GET | `/api/ping` | 无 | 文本 Pong |
| GET | `/api/ping-test` | 无 | 返回 json+时间 |

### 2) 客户端认证 `/api/auth/*`

路由文件：`src/routes/client/auth.routes.ts`

| Method | Path | 鉴权 | 说明 |
|---|---|---|---|
| POST | `/api/auth/register` | 无 | 注册 |
| POST | `/api/auth/login` | 无 | 登录，返回 token |
| POST | `/api/auth/refresh` | 无 | 刷新 token |
| POST | `/api/auth/logout` | JWT | 登出 |

#### 发送验证码

路由文件：`src/routes/client/send-code.routes.ts`

| Method | Path | 鉴权 | 说明 |
|---|---|---|---|
| POST | `/api/send-verification-code` | 无 | 发送邮箱验证码（依赖 QQ 邮箱配置） |

### 3) 设备管理（登录设备）

路由文件：`src/routes/client/device.routes.ts`

| Method | Path | 鉴权 | 说明 |
|---|---|---|---|
| GET | `/api/auth/devices` | JWT | 查询已登录设备 |
| POST | `/api/auth/logout-device` | JWT | 注销指定设备 |
| POST | `/api/auth/logout-other-devices` | JWT | 注销其它设备 |

### 4) 用户与账户 `/api/user/*`

路由文件：`src/routes/client/user-info.routes.ts`

| Method | Path | 鉴权 | 说明 |
|---|---|---|---|
| GET | `/api/user/login-user-info` | JWT | 获取当前登录用户信息 |
| GET | `/api/user/account-info` | JWT | 获取账号信息 |
| POST | `/api/user/upload-avatar` | JWT | 上传头像（multipart） |
| POST | `/api/user/update-info` | JWT | 更新资料 |
| POST | `/api/user/change-email` | JWT | 修改邮箱 |
| POST | `/api/user/change-password` | JWT | 修改密码 |

#### 购物车

| Method | Path | 鉴权 | 说明 |
|---|---|---|---|
| POST | `/api/user/add-shopping-card` | JWT | 加入购物车 |
| DELETE | `/api/user/delete-shop-cards` | JWT | 批量删除购物车项 |
| GET | `/api/user/shopping-cards` | JWT | 获取购物车列表 |

#### 优惠券 / 代金券

| Method | Path | 鉴权 | 说明 |
|---|---|---|---|
| POST | `/api/user/coupon-center/claim` | JWT | 领券 |
| GET | `/api/user/coupons` | JWT | 我的优惠券 |
| GET | `/api/user/vouchers` | JWT | 我的代金券 |
| GET | `/api/user/coupons/:product-id` | JWT | 指定商品可用券 |

#### 收货地址

| Method | Path | 鉴权 | 说明 |
|---|---|---|---|
| POST | `/api/user/add-address` | JWT | 新增地址 |
| PUT | `/api/user/update-address/:address-id` | JWT | 修改地址 |
| DELETE | `/api/user/remove-address/:address-id` | JWT | 删除地址 |
| GET | `/api/user/address-list` | JWT | 地址列表 |
| PATCH | `/api/user/set-default/:address-id` | JWT | 设为默认地址 |

### 5) 商品 `/api/products/*`

路由文件：`src/routes/client/product.routes.ts`

| Method | Path | 鉴权 | 说明 |
|---|---|---|---|
| GET | `/api/products/product-cards/:category-code` | 可选 JWT | 分类商品卡片 |
| GET | `/api/products/new-product-cards` | 可选 JWT | 新品 |
| GET | `/api/products/index-product-cards` | 可选 JWT | 首页推荐 |
| GET | `/api/products/seckill-product-cards` | 可选 JWT | 秒杀商品卡片 |
| GET | `/api/products/search-product-cards` | 可选 JWT | 搜索 |
| GET | `/api/products/:productId/evaluations` | 无 | 商品评价列表 |
| GET | `/api/products/evaluations/:evaluationId/like` | JWT | 点赞评价 |
| GET | `/api/products/shelf-products/:id/detail` | 可选 JWT | 货架商品详情 |
| GET | `/api/products/seckill-products/:seckillId/:id/detail` | 可选 JWT | 秒杀商品详情 |
| GET | `/api/products/coupon-center/coupons` | 可选 JWT | 领券中心列表 |

### 6) 订单 `/api/order/*`

路由文件：`src/routes/client/order.route.ts`

| Method | Path | 鉴权 | 说明 |
|---|---|---|---|
| POST | `/api/order/create` | JWT | 创建订单 |
| POST | `/api/order/cancel` | JWT | 取消订单 |
| POST | `/api/order/pay/voucher` | JWT | 代金券支付 |
| POST | `/api/order/payment/status` | JWT | 查询支付状态 |
| GET | `/api/order/list` | JWT | 简单订单列表 |
| GET | `/api/order/order-detail/:id` | JWT | 订单详情 |
| GET | `/api/order/stats` | JWT | 用户订单统计 |
| GET | `/api/order/list/query` | JWT | 订单列表（带筛选） |
| DELETE | `/api/order/delete-order/:orderId` | JWT | 删除订单 |
| POST | `/api/order/confirm-receipt` | JWT | 确认收货 |

### 7) 售后 / 评价 / 吐槽 / 投诉 `/api/after-sale/*`

路由文件：`src/routes/client/after-sale.route.ts`

| Method | Path | 鉴权 | 说明 |
|---|---|---|---|
| POST | `/api/after-sale/apply` | JWT | 申请售后（支持上传） |
| PUT | `/api/after-sale/cancel/:id` | JWT | 取消售后 |
| POST | `/api/after-sale/complaint` | JWT | 提交投诉（支持上传） |
| POST | `/api/after-sale/evaluation` | JWT | 提交评价（支持上传） |
| DELETE | `/api/after-sale/evaluation/:id` | JWT | 删除评价 |
| DELETE | `/api/after-sale/complaint/:id` | JWT | 删除投诉 |
| POST | `/api/after-sale/comment` | JWT | 吐槽/评论（支持上传） |
| GET | `/api/after-sale/evaluations` | JWT | 我的评价列表 |
| GET | `/api/after-sale/comments` | JWT | 我的吐槽列表 |
| GET | `/api/after-sale/after-sales` | JWT | 售后列表 |
| GET | `/api/after-sale/complaints` | JWT | 投诉列表 |
| GET | `/api/after-sale/after-sales/:id` | JWT | 售后详情 |

### 8) 管理端 `/admin/*`

路由文件：`src/routes/admin/admin.routes.ts`

管理端接口较多，建议按菜单维度查看路由文件。这里列出关键入口：

| Method | Path | 鉴权 | 说明 |
|---|---|---|---|
| POST | `/admin/login` | 无 | 管理端登录（写入 `admin_session`） |
| POST | `/admin/logout` | Session | 登出 |
| GET | `/admin/permissions` | Session | 当前管理员权限 |
| GET | `/admin/account/profile` | Session | 个人信息 |
| PATCH | `/admin/account/profile` | Session | 更新个人信息（支持上传） |

## 文件上传接口说明（multipart/form-data）

项目使用 `multer`，中间件为 `src/middleware/upload.middleware.ts`。

常见上传接口：

- 客户端：`POST /api/user/upload-avatar`
- 售后：`POST /api/after-sale/apply`、`/complaint`、`/evaluation`、`/comment`
- 管理端：大量 `POST/PATCH` 接口支持上传（品牌 logo、商品图、banner 等）

建议联调方式：先在浏览器控制台/Swagger-like 工具里用 form-data 试通，再接入前端。

## 本地开发

### 1) 安装依赖

```sh
pnpm install
```

### 2) 配置环境变量

在 `lenovo-shop-server` 根目录创建 `.env`（不要提交到 git）。最小可用示例：

```ini
PORT=3003
HOST=0.0.0.0
NODE_ENV=development

# Prisma(MySQL) 连接串
# 例：mysql://USER:PASSWORD@HOST:3306/DB_NAME?connection_limit=5
DATABASE_URL="mysql://root:password@localhost:3306/lenovo_shop"

# JWT（请在生产环境替换为强随机串）
ACCESS_TOKEN_SECRET="please-change-me"
REFRESH_TOKEN_SECRET="please-change-me"

# 发送验证码/邮件（可选；不配时相关功能会失败）
QQ_EMAIL_USER=""
QQ_EMAIL_PASS=""
QQ_EMAIL_HOST="smtp.qq.com"

# 管理端 cookie 域名
COOKIE_DOMAIN="localhost"

# 允许跨域的来源（代码里还额外放行 localhost、127.0.0.1、.vercel.app、https://shop.jxutcm.top）
CORS_ORIGINS="http://localhost:3000,http://localhost:5173"
```

### 3) 初始化数据库（Prisma）

```sh
pnpm prisma generate
pnpm prisma migrate dev --name init
```

Prisma schema：`prisma/schema.prisma`。

### 4) 启动服务

```sh
pnpm dev
```

默认地址：`http://localhost:3003`

### 5) 冒烟检查

- `GET /api/ping`
- `GET /api/ping-test`
- 本地静态资源：`GET /static/images/...`（映射到 `public/`）

## 生产构建与运行

```sh
pnpm build
pnpm start
```

## 部署到 Vercel

Vercel Serverless 入口：`api/[...route].ts`。

- 在 Vercel 的环境变量中配置 `.env` 对应的值（至少 `DATABASE_URL`、JWT secrets）。
- `src/index.ts` 中会检测 `process.env.VERCEL`：Vercel 环境下不会调用 `serve()`，由 Vercel runtime 托管。

## 代码位置速查

- 服务入口：`src/index.ts`
- 客户端路由：`src/routes/client/*`
- 管理端路由：`src/routes/admin/*`
- 控制器：`src/controllers/**`
- 中间件：`src/middleware/**`
- Prisma：`prisma/schema.prisma`
- 静态资源：`public/`


售后表
id
订单id
售后单号
订单商品id
售后类型 （退货/换货/维修）
售后状态 （申请中/已同意/已拒绝/已寄回/已寄出/已完成）
创建者id （创建该身份的管理员id）


身份-权限关联表
id
身份id
权限id  
分配者id （分配该权限的管理员id）
分配时间
状态 （启用/禁用）


权限表
id
权限名称 （（比如商品管理 - 查询、商品管理 - 新增、商品管理 - 编辑、商品管理 - 删除、订单管理 - 核销 等等）
权限类型
父级权限id （如 “商品管理” 是 “商品管理 - 查询” 的父级）
模块名称 （权限所属模块）
状态 （启用/禁用）



系统全局消息表
id
发送者id （管理员）
通知类型（公告，提醒，活动，通知）
标题
内容
发送时间
生效时间 （支持定时推送）
过期时间 （过期后自动隐藏）
状态 （正常/撤回/下架）

个人通知消息表
id
发送者id （管理员）
通知类型（公告，提醒，活动，通知）
标题
内容
发送时间
生效时间 （支持定时推送）
过期时间 （过期后自动隐藏）
状态 （正常/撤回/下架）

用户-系统通知表
id
用户id
消息类型 （个人/全局）
个人通知id
全局通知id
通知时间 （消息推送给用户的时间（个人消息）/ 用户首次查看的时间（全局消息））
已读 bool
已读时间
是否删除 bool


用户-客服对话新消息通知表
id
用户id
会话室id
关联消息id
通知对象类型 （用户/管理员）
对象id （用户id/管理员id）
回复源消息id
删除 bool
删除时间
通知时间
状态 （已读/未读）


用户-客服对话窗口列表
用户id
会话室id
管理员id 
用户删除 bool
用户删除时间
管理员删除 bool 
管理员删除时间

客服-用户会话室
id
用户id
管理员id （客服身份）
用户未读消息数量
管理员未读消息数量
会话创建时间
结束时间
状态 （已结束/进行中）

客服-用户会话室-消息表
消息主键id
会话室id
发送者身份 （用户/管理员）
发送者id （用户id/管理员id）
接收者身份 （用户/管理员）
接收者id （用户id/管理员id）
接收者已读 bool
已读时间
消息内容
发送时间
状态 （撤回/正常）两分钟内可撤回
撤回时间
被回复信息id
回复层级数

用户-客服评价表
id
用户id
会话室id
客服id （管理员id）
评价内容
评价星星数 （1~5，可以0.5为单位）
添加时间
更新时间
状态 （撤回/正常）
撤回原因 

客服指标表
id
客服id （管理员id）
会话数
已评价会话数
平均星星数
好评数 （4以上）
好评率 （好评数/评价会话数）
统计时间

管理员Session 表
id
管理员id
session唯一标识符
存储的管理员信息（json格式）
过期时间
创建时间
修改时间

管理员登陆表
id
管理员id
session id
设备名称
设备类型（手机/电脑）
登陆时间
登陆ip
登出时间
session过期时间