// controllers/device.controller.ts
import { getUserDevices, logoutDevice, logoutOtherDevices } from '../../services/client/device.service';
import { parseCookies } from '../../utils/token';

export async function getLoginDevicesController(c: any) {
  const user = c.get('user');
  const devices = await getUserDevices(user.user_id);
  return c.json({ code: 200, data: { devices }, message: '获取登录设备列表成功' });
}

export async function logoutDeviceController(c: any) {
  const user = c.get('user');
  const body = await c.req.json();
  const { device_id } = body;
  if (!device_id) return c.json({ code: 400, data: null, message: 'device_id 必填' }, 400);
  const device = await logoutDevice(user.user_id, device_id);
  return c.json({ code: 200, data: { device }, message: '注销设备成功' });
}

export async function logoutOtherDevicesController(c: any) {
  const user = c.get('user');
  const cookies = parseCookies(c.req.header('cookie'));
  const currentRefreshToken = cookies['refresh_token'];
  if (!currentRefreshToken) return c.json({ code: 401, data: null, message: '未找到刷新令牌' }, 401);
  const devices = await logoutOtherDevices(user.user_id, currentRefreshToken);
  return c.json({ code: 200, data: { devices }, message: '注销其他设备成功' });
}
