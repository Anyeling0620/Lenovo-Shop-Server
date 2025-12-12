import jwt, { JwtPayload } from 'jsonwebtoken';
import crypto from 'crypto';
import { log } from 'console';

const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET!;

/**
 * 生成访问令牌（Access Token）
 * @param payload - 负载数据，键值必须是 string | number
 * @returns JWT 字符串
 */
export function generateAccessToken(payload: Record<string, string | number>): string {
  return jwt.sign(payload, ACCESS_TOKEN_SECRET, { expiresIn: '15m' });
}

/**
 * 验证访问令牌
 * @param token - JWT 字符串
 * @returns 解码后的 payload，验证失败返回 null
 */
export function verifyAccessToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, ACCESS_TOKEN_SECRET) as JwtPayload;
  } catch {
    return null;
  }
}

/**
 * 生成刷新令牌（Refresh Token）
 * @returns 随机字符串
 */
export function generateRefreshToken(): string {
  return crypto.randomBytes(64).toString('hex');
}

/**
 * 对刷新令牌进行哈希处理
 * @param token - 需要哈希的字符串
 * @returns SHA-256 哈希后的十六进制字符串
 */
export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}


export function parseCookies(cookieHeader: string | undefined) {
  const cookies: Record<string, string> = {};
  if (!cookieHeader) return cookies;
  cookieHeader.split(';').forEach(cookie => {
    const [key, ...val] = cookie.trim().split('=');
    cookies[key] = val.join('=');
  });
  return cookies;
}
