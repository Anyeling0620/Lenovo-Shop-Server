# lenovo-shop-server

联想商城后端服务（配套 `lenovo-shop` 前台与 `lenovo-admin` 管理端）。

- 技术栈：Hono + Prisma(MySQL) + TypeScript
- 本地运行：`tsx watch src/index.ts`
- 静态资源：本地开发时可通过 `/static/*` 访问 `public/`

## 导航

- [主要功能](#主要功能按代码实际路由)
- [快速上手](#快速上手3-分钟跑通一次完整流程)
- [鉴权说明](#鉴权说明)
- [请求与返回约定](#请求与返回约定联调必看)
- [接口速查](#接口速查更可视化--按模块)
- [文件上传](#文件上传接口说明multipartform-data)
- [本地开发](#本地开发)
- [生产构建与运行](#生产构建与运行)
- [部署到-vercel](#部署到-vercel)
- [项目结构与代码速查](#项目结构与代码速查)
- [更多文档](#更多文档)

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

### 上传字段怎么填？（建议约定）

由于不同接口的文件字段名可能不同，最稳妥的方式是直接查看 `src/middleware/upload.middleware.ts` 以及对应 controller。

联调排错思路：

1) 先确认请求 `Content-Type: multipart/form-data`
2) body 里除了文件，还要带 controller 需要的文本字段（例如订单 id、原因等）
3) 如果返回 415/400，多半是字段名或 body 格式不匹配

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

## 项目结构与代码速查

> 这一节用于“快速定位代码在哪”。如果你要看更偏产品/模块的接口清单，请优先看上面的「接口速查」。

### 本节导航

- [一句话定位](#一句话定位)
- [目录树（可视化）](#目录树可视化)
- [按场景找代码](#按场景找代码)
- [关键实现速查（常用文件）](#关键实现速查常用文件)
- [更多文档](#更多文档)

### 一句话定位

- **路由总装配**：`src/index.ts`
- **客户端 API**：`src/routes/client/*` + `src/controllers/client/*`
- **管理端 API**：`src/routes/admin/*` + `src/controllers/admin/*`
- **鉴权/会话/上传等中间件**：`src/middleware/*`
- **数据库模型**：`prisma/schema.prisma`
- **静态资源**：`public/*`（开发环境可通过 `/static/*` 访问）
- **Vercel 入口**：`api/[...route].ts`

### 目录树（可视化）

```text
lenovo-shop-server/
	api/
		[...route].ts            # Vercel serverless 入口（handle(app)）
	prisma/
		schema.prisma            # 全量数据模型
		migrations/              # 迁移历史
	public/                    # 静态资源（图片等）
	src/
		index.ts                 # Hono app 装配、CORS、静态资源、错误处理
		routes/
			client/                # 客户端路由（/api/*）
			admin/                 # 管理端路由（/admin/*）
		controllers/
			client/                # 客户端业务
			admin/                 # 管理端业务
		middleware/              # jwt/session/ip/upload 等中间件
		services/                # 业务服务层（如 session 校验等）
		utils/                   # db、token、通用工具
	docs/                      # 额外文档（HTML/说明）
```

### 按场景找代码

| 你要做什么 | 推荐先看 | 备注 |
|---|---|---|
| 增加一个客户端接口（`/api/*`） | `src/routes/client/*` → `src/controllers/client/*` | 路由负责“挂载 path + 中间件”，controller 写业务处理 |
| 增加一个管理端接口（`/admin/*`） | `src/routes/admin/*` → `src/controllers/admin/*` | 管理端常用 session 中间件 |
| 给接口加 JWT 鉴权 | `src/middleware/jwt.middleware.ts` | 严格鉴权（必须登录） |
| 做“可选登录态”的接口 | `src/middleware/jwt-loose.middleware.ts` | 允许不带 token 访问，但能识别用户 |
| 管理端 session 校验/续期 | `src/middleware/session.middleware.ts`、`src/services/admin/session.serivce` | 注意：文件名里 serivce 拼写可能是历史遗留 |
| 处理跨域（CORS）问题 | `src/index.ts` | 查 `cors({ origin })` 白名单策略 |
| 文件上传（multipart/form-data） | `src/middleware/upload.middleware.ts` | `multer` 封装与字段命名在这里 |
| 查/改数据库表结构 | `prisma/schema.prisma` + `prisma/migrations/*` | 以 Prisma 模型为准 |
| 静态资源访问（`/static/*`） | `public/*` + `src/index.ts` | 本地开发映射规则在 app 装配处 |

### 关键实现速查（常用文件）

| 类别 | 文件/目录 | 你会在这里找到什么 |
|---|---|---|
| 应用入口 | `src/index.ts` | app 装配、全局中间件、错误处理、静态资源、路由挂载 |
| 客户端路由 | `src/routes/client/*` | `/api/*` 路由定义 |
| 管理端路由 | `src/routes/admin/*` | `/admin/*` 路由定义 |
| 客户端 controller | `src/controllers/client/*` | 用户/商品/订单/售后等业务实现 |
| 管理端 controller | `src/controllers/admin/*` | 管理后台业务实现 |
| 中间件 | `src/middleware/*` | JWT、Session、上传、IP 等 |
| 服务层 | `src/services/*` | controller 共用的业务服务（例如 session、鉴权辅助等） |
| 工具 | `src/utils/*` | db 连接、token、通用工具函数 |
| Prisma | `prisma/schema.prisma` | 数据模型定义 |

## 更多文档

本仓库额外提供了静态 HTML 文档（适合直接在浏览器打开）：

- `docs/API.html`：更完整的 API 文档（HTML）
- `docs/数据库模型设计文档.html`：数据库模型说明（HTML，基于 `prisma/schema.prisma`）
- `docs/README.md`：docs 导航

另外，原 README 末尾的“数据库表字段草案”已整理到：

- `docs/db-tables.md`