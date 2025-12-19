import { Hono } from "hono";
import { changeEmailController, changePasswordController, getAccountInfoController, getLoginUserInfoController, updateAccountInfoController, uploadAvatarController } from "../../controllers/client/user-info.controller";
import { jwtMiddleware } from "../../middleware/jwt.middleware";



const user = new Hono()
user.get("/login-user-info", jwtMiddleware, getLoginUserInfoController)
user.get('/account-info', jwtMiddleware, getAccountInfoController)
user.post('/upload-avatar', jwtMiddleware, uploadAvatarController)
user.post('/update-info', jwtMiddleware, updateAccountInfoController)
user.post('/change-email', jwtMiddleware, changeEmailController)
user.post('/change-password',jwtMiddleware,changePasswordController)

export default user;