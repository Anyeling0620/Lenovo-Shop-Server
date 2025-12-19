import { Hono } from "hono";
import { jwtMiddleware } from "../../middleware/jwt.middleware";
import { getLoginDevicesController, logoutDeviceController, logoutOtherDevicesController } from "../../controllers/client/devices.controller";



const devices = new Hono()

devices.get('/devices', jwtMiddleware, getLoginDevicesController);

// 注销指定设备
devices.post('/logout-device', jwtMiddleware, logoutDeviceController);

// 注销其他设备
devices.post('/logout-other-devices', jwtMiddleware, logoutOtherDevicesController);

export default devices

