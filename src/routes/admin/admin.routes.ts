import { Hono } from "hono";
import { adminLogin, adminLogout } from "../../controllers/admin/admin.controller";
import { getAdminPermission } from "../../controllers/admin/permission.controller";



const admin = new Hono();

admin.post('/login', adminLogin); 
admin.post('/logout', adminLogout);
admin.get('/permissions', getAdminPermission);

export default admin;