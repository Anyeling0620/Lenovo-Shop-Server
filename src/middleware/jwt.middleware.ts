import { HTTPException } from 'hono/http-exception';
import { verifyAccessToken } from '../utils/token';

export const jwtMiddleware = async (c: any, next: any) => {
  if (c.req.method === 'OPTIONS') {
    await next();
    return;
  }

  const authHeader = c.req.header('Authorization');
  if (!authHeader) {
    throw new HTTPException(401, { message: '未提供认证令牌' });
  }

  if (!authHeader.startsWith('Bearer ')) {
    throw new HTTPException(401, { message: '认证令牌格式错误' });
  }

  const token = authHeader.slice(7);
  const payload = await verifyAccessToken(token);
  if (!payload) {
    throw new HTTPException(401, { message: '无效的认证令牌' });
  }

  if (!payload.user_id) {
    throw new HTTPException(401, { message: '令牌中缺少用户ID' });
  }


  // 设置用户信息
  c.set('user', {
    user_id: payload.user_id,
    device_id: payload.device_id,
    device_type: payload.device_type
  });

  await next();
};

