// services/device.service.ts
import { DeviceInfo, DeviceType } from '../types/device.type';
import { db } from '../utils/db';
import { hashToken } from '../utils/token';
import { HTTPException } from 'hono/http-exception';

export async function getUserDevices(userId: string) {
    const devices = await db.userLogin.findMany({
        where: { userId },
        select: {
            deviceId: true,
            deviceType: true,
            deviceName: true,
            loginAt: true,
            ipAddress: true,
        },
    });

    // 转换数据格式
    return devices.map(device => ({
        device_id: device.deviceId,
        device_type: device.deviceType as DeviceType,
        device_name: device.deviceName,
        login_time: device.loginAt.toISOString(),
        ip_address: device.ipAddress,
    } as DeviceInfo));
}

export async function logoutDevice(userId: string, deviceId: string) {
    const device = await db.userLogin.findUnique({
        where: { userId_deviceId: { userId, deviceId } },
    });

    if (!device) throw new HTTPException(404, { message: '设备不存在或已登出' });

    // 直接删除设备记录
    await db.userLogin.delete({
        where: { userId_deviceId: { userId, deviceId } },
    });

    return device;
}

/**
 * 注销其他设备
 * @param userId 当前用户
 * @param currentRefreshToken 当前设备的 refresh_token
 */
export async function logoutOtherDevices(userId: string, currentRefreshToken: string) {
    const currentTokenHash = hashToken(currentRefreshToken);

    // 查询当前设备 ID
    const currentDevice = await db.userLogin.findFirst({
        where: { userId, refreshToken: currentTokenHash },
    });

    if (!currentDevice) throw new HTTPException(401, { message: '当前设备未登录或刷新令牌无效' });

    // 查询其他设备
    const otherDevices = await db.userLogin.findMany({
        where: { userId, deviceId: { not: currentDevice.deviceId } },
    });

    // 删除其他设备记录
    await db.userLogin.deleteMany({
        where: { userId, deviceId: { not: currentDevice.deviceId } },
    });

    return otherDevices;
}
