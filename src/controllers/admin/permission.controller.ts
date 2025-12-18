import { getAdminPermissionInfo } from "../../services/admin/permission.service";

/**
 * 获取管理员权限信息（语义化）
 * @param c Hono Context
 * @returns 权限信息响应
 */
export const getAdminPermission = async (c: any) => {
    // 从Context中获取已登录的管理员会话数据（authAdmin中间件已存入）
    const adminSession = c.get('adminSession');
    // 调用服务获取语义化权限信息
    const permissionInfo = await getAdminPermissionInfo(adminSession.admin_id);
    // 返回响应
    return c.json({
        code: 200,
        message: "获取权限信息成功",
        data: permissionInfo
    }, 200);

};