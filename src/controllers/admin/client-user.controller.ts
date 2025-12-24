import { Context } from "hono";
import { getClientListService, getClientDetailService, updateClientService, deleteClientService, getClientStatisticsService } from "../../services/admin/client-user.service";

export const getClientListController = async (c: Context) => {
    const query = c.req.query();
    const result = await getClientListService(query);
    return c.json({
        code: 200,
        message: 'success',
        data: result
    });
};

export const getClientDetailController = async (c: Context) => {
    const userId = c.req.param('id');
    const result = await getClientDetailService(userId);
    if (!result) {
        return c.json({ code: 404, message: 'User not found', data: null }, 404);
    }
    return c.json({
        code: 200,
        message: 'success',
        data: result
    });
};

export const updateClientController = async (c: Context) => {
    const userId = c.req.param('id');
    const body = await c.req.json();
    await updateClientService(userId, body);
    return c.json({
        code: 200,
        message: 'success',
        data: null
    });
};

export const deleteClientController = async (c: Context) => {
    const userId = c.req.param('id');
    await deleteClientService(userId);
    return c.json({
        code: 200,
        message: 'success',
        data: null
    });
};

export const getClientStatisticsController = async (c: Context) => {
    const result = await getClientStatisticsService();
    return c.json({
        code: 200,
        message: 'success',
        data: result
    });
};
