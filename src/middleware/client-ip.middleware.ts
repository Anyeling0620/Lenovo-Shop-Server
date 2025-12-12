// middleware/client-ip.ts
import type { MiddlewareHandler } from 'hono'

export const clientIpMiddleware: MiddlewareHandler = async (c, next) => {
  const raw = c.env.incoming  // Node IncomingMessage (only exists in @hono/node-server)

  const ip =
    c.req.header('x-forwarded-for')?.split(',')[0]?.trim() || // 代理链
    c.req.header('x-real-ip') ||                              // Nginx
    raw?.socket?.remoteAddress ||                             // Node.js
    raw?.connection?.remoteAddress ||                         // Node.js 老字段
    'unknown'

  console.log('client-ip.middleware:', ip)
  // 存到 context，后面随时读取
  c.set('clientIp', ip)

  await next()
}
