import { HTTPException } from 'hono/http-exception';
import { verifyAccessToken } from '../utils/token';
import { verifyUser } from '../services/client/jwt.service';
import { log } from 'console';

export const jwtLooseMiddleware = async (c: any, next: any) => {
  if (c.req.method === 'OPTIONS') {
    await next();
    return;
  }

  const authHeader = c.req.header('Authorization');
  if (!authHeader) {
    await next();
    return
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

  const user = await verifyUser(payload.user_id)
  if (!user) throw new HTTPException(401, { message: '令牌信息异常' });


  // 设置用户信息
  c.set('user', {
    user_id: payload.user_id,
    device_id: payload.device_id,
    device_type: payload.device_type
  });

  await next();
};

