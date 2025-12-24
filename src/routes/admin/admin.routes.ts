import { Hono } from "hono";
import { adminLogin, adminLogout } from "../../controllers/admin/admin.controller";
import { getAdminPermission } from "../../controllers/admin/permission.controller";
import { getClientDetailController, getClientListController, getClientStatisticsController, updateClientController, deleteClientController } from "../../controllers/admin/client-user.controller";
import { createAdminController, deleteAdminController, getAdminDetailController, getAdminListController, resetAdminPasswordController, updateAdminController } from "../../controllers/admin/admin-user.controller";

const admin = new Hono();

// Auth
admin.post('/login', adminLogin); 
admin.post('/logout', adminLogout);
admin.get('/permissions', getAdminPermission);

// Client User Management
admin.get('/user/client/list', getClientListController);
admin.get('/user/client/detail/:id', getClientDetailController);
admin.put('/user/client/update/:id', updateClientController);
admin.delete('/user/client/delete/:id', deleteClientController);
admin.get('/user/client/statistics', getClientStatisticsController);

// Admin User Management
admin.get('/user/admin/list', getAdminListController);
admin.get('/user/admin/detail/:id', getAdminDetailController);
admin.post('/user/admin/create', createAdminController);
admin.put('/user/admin/update/:id', updateAdminController);
admin.delete('/user/admin/delete/:id', deleteAdminController);
admin.post('/user/admin/reset-password/:id', resetAdminPasswordController);

export default admin;
