import { HTTPException } from "hono/http-exception";
import { parseCookies } from "../utils/token";
import { validateAdminSession } from "../services/admin/session.serivce";

export const authAdmin = async (c: any, next: any) => {
    if (c.req.method === 'OPTIONS') {
        await next();
        return;
    }

    if (c.req.path === '/admin/login') {
        await next();
        return;
    }

    // 优先尝试从 cookie 获取 sessionId
    let sessionId = parseCookies(c.req.header('cookie'))['admin_session'];
    
    // 如果 cookie 中没有，尝试从 X-Session-ID header 获取（备选方案，当 cookie 被 Cloudflare 过滤时）
    if (!sessionId) {
        sessionId = c.req.header('X-Session-ID');
    }
    
    if (!sessionId) {
        throw new HTTPException(401, { message: "未找到管理员会话" });
    }
    const sessionData = await validateAdminSession(sessionId);

    if (!sessionData || !sessionData.admin_id) {
        throw new HTTPException(401, { message: "无效的管理员会话" });
    }
    c.set('sessionId', sessionId);
    c.set('adminSession', sessionData);
    await next();
}