import { Hono } from 'hono'
import { serve } from '@hono/node-server'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { prettyJSON } from 'hono/pretty-json'
import { showRoutes } from 'hono/dev'
import dotenv from 'dotenv'
import { db } from './utils/db'
import authRouter from './routes/client/auth.routes'
import devices from './routes/client/device.routes'
import { clientIpMiddleware } from './middleware/client-ip.middleware'
import { HTTPException } from 'hono/http-exception'
import sendCode from './routes/client/send-code.routes'
import user from './routes/client/user-info.routes'
import { serveStatic } from '@hono/node-server/serve-static'
import { join } from 'path'
import products from './routes/client/product.routes'
import admin from './routes/admin/admin.routes'
import { authAdmin } from './middleware/session.middleware'
import order from './routes/client/order.route'
import { afterSale } from './routes/client/after-sale.route'

dotenv.config()

const PORT = Number(process.env.PORT) || 3003
const HOST = process.env.HOST || '0.0.0.0'
const CORS_ORIGINS = process.env.CORS_ORIGINS

const app = new Hono()

// 静态资源服务 - 映射到根目录
app.get('/static/*', serveStatic({ 
  root: join(__dirname, '../public'),
  rewriteRequestPath: (path) => path.replace(/^\/static/, '')
}));

app.use('*', cors({
  origin: CORS_ORIGINS!, // 允许的来源
  credentials: true,     // 如果前端需要带 cookie
}));

app.use('*', clientIpMiddleware) // 获取客户端ip

app.use('*', logger()) // 日志
app.use(prettyJSON())  // 格式化json


app.route('/api/auth', authRouter)
app.route('/api/auth', devices)
app.route('/api', sendCode)
app.route('/api/user', user)
app.route('/api/products',products)
app.route('/api/order', order)
app.route('/api/after-sale', afterSale)

app.use('/admin/*', authAdmin)
app.route('/admin', admin )

// 全局错误处理
app.onError((err, c) => {
  if (err instanceof HTTPException) {
    return c.json({
      code: err.status,
      message: err.message,
      data: null,
    }, err.status)
  }
  return c.json({
    code: 500,
    message: '服务器内部错误',
    data: null,
  })
})

showRoutes(app, {  // 显示路由
  verbose: true,
})

// 仅在非 Vercel 环境下启动服务器
if (!process.env.VERCEL) {
  serve({  // 启动服务
    fetch: app.fetch,
    port: PORT,
    hostname: HOST
  }, info => {
    console.log(`服务器启动成功：http://${info.address}:${info.port}`)
  })

  async function test() {
    try {
      await db.$connect();
      console.log(`数据库连接成功`);
    } catch (err) {
      console.error('数据库连接失败:', err);
    } finally {
      await db.$disconnect();
    }
  }
  test();
}

export default app
