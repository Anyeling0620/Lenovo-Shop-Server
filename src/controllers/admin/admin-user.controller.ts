import { Context } from "hono";
import { getAdminListService, getAdminDetailService, createAdminService, updateAdminService, deleteAdminService, resetAdminPasswordService } from "../../services/admin/admin-user.service";

export const getAdminListController = async (c: Context) => {
    const query = c.req.query();
    const result = await getAdminListService(query);
    return c.json({
        code: 200,
        message: 'success',
        data: result
    });
};

export const getAdminDetailController = async (c: Context) => {
    const adminId = c.req.param('id');
    const result = await getAdminDetailService(adminId);
    if (!result) {
        return c.json({ code: 404, message: 'Admin not found', data: null }, 404);
    }
    return c.json({
        code: 200,
        message: 'success',
        data: result
    });
};

export const createAdminController = async (c: Context) => {
    const body = await c.req.json();
    // Get creatorId from authenticated admin session
    const adminSession = c.get('adminSession'); 
    const creatorId = adminSession?.admin_id || 'system'; 

    const result = await createAdminService(body, creatorId);
    return c.json({
        code: 200,
        message: 'success',
        data: result
    });
};

export const updateAdminController = async (c: Context) => {
    const adminId = c.req.param('id');
    const body = await c.req.json();
    await updateAdminService(adminId, body);
    return c.json({
        code: 200,
        message: 'success',
        data: null
    });
};

export const deleteAdminController = async (c: Context) => {
    const adminId = c.req.param('id');
    await deleteAdminService(adminId);
    return c.json({
        code: 200,
        message: 'success',
        data: null
    });
};

export const resetAdminPasswordController = async (c: Context) => {
    const adminId = c.req.param('id');
    const body = await c.req.json();
    await resetAdminPasswordService(adminId, body.newPassword);
    return c.json({
        code: 200,
        message: 'success',
        data: null
    });
};
