import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { HTTPException } from 'hono/http-exception';
import { db } from '../../utils/db';
import { generateAccessToken, generateRefreshToken, hashToken } from '../../utils/token';
import { verifyCode } from '../../utils/verification';

export async function registerUser(data: any, deviceInfo: any) {
  const { email, password, password_confirm, verify_code } = data;
  const { deviceId, deviceType, deviceName, ipAddress } = deviceInfo;

  if (password !== password_confirm) throw new HTTPException(400, { message: '两次密码不一致' });
  if (!verifyCode(email, verify_code)) throw new HTTPException(400, { message: '验证码无效' });

  const existingUser = await db.user.findUnique({ where: { email } });
  if (existingUser) throw new HTTPException(400, { message: '用户已存在' });

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await db.user.create({
    data: {
      email,
      password: hashedPassword,
      account: Date.now().toString(),
      nickname: '哈吉米',
      avatar: 'default.png',
    },
  });

  const accessToken = await generateAccessToken({
    user_id: user.id,
    device_id: deviceId,
    device_type: deviceType,
  });

  const refreshToken = generateRefreshToken();
  const refreshTokenHash = hashToken(refreshToken);

  await db.userLogin.create({
    data: {
      userId: user.id,
      deviceId,
      deviceType,
      deviceName,
      loginAt: new Date(),
      ipAddress,
      refreshToken: refreshTokenHash,
    },
  });

  return { accessToken, refreshToken };
}

/**
 * 用户登录处理函数
 * @param data - 登录信息，包含邮箱、密码、验证码和登录方式
 * @param deviceInfo - 设备信息，包含设备ID、设备类型、设备名称和IP地址
 * @returns 返回访问令牌、刷新令牌和多设备登录警告标志
 * @throws {HTTPException} 当用户不存在、密码错误、验证码无效或登录方式无效时抛出异常
 */
export async function loginUser(data: any, deviceInfo: any) {
  const { email, password, verification_code, mode } = data;
  const { deviceId, deviceType, deviceName, ipAddress } = deviceInfo;

  const user = await db.user.findUnique({ where: { email } });
  if (!user) throw new HTTPException(404, { message: '用户不存在' });

  // 密码/验证码验证
  if (mode === 'password') {
    if (!password) throw new HTTPException(400, { message: '请输入密码' });
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) throw new HTTPException(400, { message: '密码错误' });
  } else if (mode === 'quick') {
    if (!verification_code || !verifyCode(email, verification_code))
      throw new HTTPException(400, { message: '验证码无效' });
  } else {
    throw new HTTPException(400, { message: '无效的登录方式' });
  }

  // 获取其他登录设备
  const otherDevices = await db.userLogin.findMany({
    where: {
      userId: user.id,
      deviceId: { not: deviceId },
    },
  });
  const multi_login_warning = otherDevices.length > 0;

  const accessToken = await generateAccessToken({
    user_id: user.id,
    device_id: deviceId,
    device_type: deviceType,
  });

  const refreshToken = generateRefreshToken();
  const refreshTokenHash = hashToken(refreshToken);

  await db.userLogin.upsert({
    where: { userId_deviceId: { userId: user.id, deviceId } },
    update: {
      deviceType,
      deviceName,
      loginAt: new Date(),
      ipAddress,
      refreshToken: refreshTokenHash,
    },
    create: {
      userId: user.id,
      deviceId,
      deviceType,
      deviceName,
      loginAt: new Date(),
      ipAddress,
      refreshToken: refreshTokenHash,
    },
  });

  return { accessToken, refreshToken, multi_login_warning };
}

export async function refreshAccessToken(refreshToken: string, ipAddress?: string) {
  const refreshTokenHash = hashToken(refreshToken);
  const loginDevice = await db.userLogin.findFirst({ where: { refreshToken: refreshTokenHash } });
  if (!loginDevice) throw new HTTPException(401, { message: '无效的刷新令牌' });

  const user = await db.user.findUnique({ where: { id: loginDevice.userId } });
  if (!user) throw new HTTPException(404, { message: '用户不存在' });

  const accessToken = await generateAccessToken({
    user_id: user.id,
    device_id: loginDevice.deviceId,
    device_type: loginDevice.deviceType,
  });
  const newRefreshToken = generateRefreshToken();
  const newRefreshTokenHash = hashToken(newRefreshToken);

  await db.userLogin.update({
    where: { userId_deviceId: { userId: user.id, deviceId: loginDevice.deviceId } },
    data: { refreshToken: newRefreshTokenHash, loginAt: new Date(), ipAddress: ipAddress },
  });

  return { accessToken, newRefreshToken };
}

export async function clearLoginSession(refreshToken: string) {
  if (!refreshToken) {
    throw new HTTPException(401, { message: '未找到刷新令牌' });
  }

  const tokenHash = hashToken(refreshToken);

  // 查找当前设备
  const loginRecord = await db.userLogin.findFirst({
    where: { refreshToken: tokenHash },
  });

  if (!loginRecord) {
    throw new HTTPException(401, { message: '刷新令牌无效或已退出' });
  }

  // 直接删除设备记录
  await db.userLogin.delete({
    where: {
      userId_deviceId: {
        userId: loginRecord.userId,
        deviceId: loginRecord.deviceId,
      },
    },
  });

  return loginRecord;
}
