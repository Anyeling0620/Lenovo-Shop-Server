import { serialize } from "cookie";
import { deleteAdminSession, recordAdminLoginDevice, vailidateAdminLogin } from "../../services/admin/admin-auth.service";
import { createAdminSession } from "../../services/admin/session.serivce";
import { AdminLoginResponse, AdminSessionData } from "../../types/admin/admin.type";
import { parseCookies } from "../../utils/token";

export const adminLogin = async (c: any) => {
    const body = await c.req.json();
    const deviceInfo = {
        deviceType: c.req.header('X-Device-Type') || '',
        deviceName: (c.req.header('X-Device-Name') || '').slice(0, 40),
        ipAddress: c.get('clientIp'),
    };
    const { account, password } = body;
    const { admin, permissionIds, identityIds, categoryIds } = await vailidateAdminLogin(account, password);
    const sessionData: AdminSessionData = {
        admin_id: admin.id,
        account: admin.account,
        name: admin.name,
        permissions: permissionIds,
        categories: categoryIds,
        identitys: identityIds,
    }
    const sessionId = await createAdminSession(admin.id, sessionData, 2);
    const sessionExpireTime = new Date();
    sessionExpireTime.setHours(sessionExpireTime.getHours() + 2);

    await recordAdminLoginDevice(admin.id, { device_name: deviceInfo.deviceName, device_type: deviceInfo.deviceType }, sessionId, sessionExpireTime, deviceInfo.ipAddress);

    const cookieHeader = serialize('admin_session', sessionId, {
        httpOnly: true,
        path: '/',
        maxAge: 60 * 60 * 2,
        domain: '.jxutcm.top',  // 允许所有子域共享 cookie
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'none',  // 恢复为 'none' 以支持跨域
    });
    
    // 调试：打印 cookie 设置信息
    console.log('[LOGIN DEBUG] Cookie Settings:', {
        domain: '.jxutcm.top',
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'none',
        NODE_ENV: process.env.NODE_ENV,
        cookieHeader: cookieHeader
    });

    return c.json({
        code: 200,
        data: {
            admin_id: admin.id,
            name: admin.name,
            nickname: admin.nickname,
            account: admin.account,
            avatar: admin.avatar,
            email: admin.email,
            sessionId: sessionId,  // 添加 sessionId 到 response body，作为 token 备选
        } as AdminLoginResponse,
        message: '登陆成功'
    }, 200, { 'Set-Cookie': cookieHeader });
}


export const adminLogout = async (c: any) => {
    // 1. 解析 Cookie 中的 session 主键 id
    const sessionPrimaryId = c.get('sessionId');

    // 2. 若有 Session ID，删除之
    await deleteAdminSession(sessionPrimaryId);

    
    // 3. 清除 Cookie（设置 maxAge=0）
    const cookieHeader = serialize('admin_session', '', {
        httpOnly: true,
        path: '/',
        maxAge: 0, // 立即过期
        domain: process.env.COOKIE_DOMAIN,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'none',
    });

    return c.json({
        code: 200,
        message: "退出登录成功",
        data: null,
    }, 200, { 'Set-Cookie': cookieHeader });
};