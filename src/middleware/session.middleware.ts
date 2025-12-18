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

    const cookies = parseCookies(c.req.header('cookie'));
    const sessionId = cookies['admin_session'];
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