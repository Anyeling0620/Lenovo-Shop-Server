import { log } from 'console';
import { sendCode } from '../../utils/verification';
import { serialize } from 'cookie';
import { parseCookies } from '../../utils/token';
import { registerUser, loginUser, refreshAccessToken, clearLoginSession } from '../../services/client/auth.service';

export async function registerController(c: any) {
    const body = await c.req.json();
    log("body:", body)
    const deviceInfo = {
        deviceId: c.req.header('X-Device-Id') || '',
        deviceType: c.req.header('X-Device-Type') || '',
        deviceName: (c.req.header('X-Device-Name') || '').slice(0, 40),
        ipAddress: c.get('clientIp'),
    };
    const { accessToken, refreshToken } = await registerUser(body, deviceInfo);

    const cookieHeader = serialize('refresh_token', refreshToken, {
        httpOnly: true,
        path: '/',
        maxAge: 60 * 60 * 24 * 14,
        // domain: process.env.COOKIE_DOMAIN,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
    });

    return c.json({
        code: 201,
        data: { access_token: accessToken },
        message: '注册成功'
    }, 201, { 'Set-Cookie': cookieHeader });
}

export async function loginController(c: any) {
    const body = await c.req.json();
    const deviceInfo = {
        deviceId: c.req.header('X-Device-Id') || '',
        deviceType: c.req.header('X-Device-Type') || '',
        deviceName: (c.req.header('X-Device-Name') || '').slice(0, 40),
        ipAddress: c.get('clientIp'),
    };
    const { accessToken, refreshToken, multi_login_warning } = await loginUser(body, deviceInfo);

    const cookieHeader = serialize('refresh_token', refreshToken, {
        httpOnly: true,
        path: '/',
        maxAge: 60 * 60 * 24 * 14,
        // domain: process.env.COOKIE_DOMAIN,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
    });

    return c.json({
        code: 200,
        data: {
            access_token: accessToken,
            multi_login_warning
        },
        message: '登录成功'
    }, 200, { 'Set-Cookie': cookieHeader });
}

export async function refreshController(c: any) {
    const cookies = parseCookies(c.req.header('cookie'));
    const refreshToken = cookies['refresh_token'];
    const ip = c.get('clientIp');
    if (!refreshToken) {
        return c.json({
            code: 401,
            data: null,
            message: '未找到刷新令牌'
        }, 401);
    }
    const { accessToken, newRefreshToken } = await refreshAccessToken(refreshToken, ip);

    const cookieHeader = serialize('refresh_token', newRefreshToken, {
        httpOnly: true,
        path: '/',
        maxAge: 60 * 60 * 24 * 14,
        // domain: process.env.COOKIE_DOMAIN,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
    })

    return c.json({
        code: 200,
        data: { access_token: accessToken },
        message: '令牌刷新成功'
    }, 200, {
        'Set-Cookie': cookieHeader
    });
}


export async function sendCodeController(c: any) {
    const body = await c.req.json();
    await sendCode(body.email, body?.mode);

    return c.json({
        code: 200,
        data: null,
        message: '验证码已发送'
    }, 200);
}


export async function logoutController(c: any) {
  // 获取 refresh_token
  const cookies = parseCookies(c.req.header('cookie'));
  const refreshToken = cookies['refresh_token'];

  const session = await clearLoginSession(refreshToken);

  // 删除浏览器 Cookie
  const clearCookie = serialize('refresh_token', '', {
    httpOnly: true,
    path: '/',
    maxAge: 0,
    // domain: process.env.COOKIE_DOMAIN,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  });

  return c.json(
    {
      code: 200,
      data: { device: session },
      message: '退出登录成功',
    },
    200,
    { 'Set-Cookie': clearCookie }
  );
}