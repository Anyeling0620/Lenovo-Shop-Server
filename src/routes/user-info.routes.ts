import { Hono } from "hono";
import { jwtMiddleware } from "../middleware/jwt.middleware";
import {
    getAccountInfoController,
    getLoginUserInfoController,
    updateAccountInfoController,
    uploadAvatarController,
    changeEmailController,
    changePasswordController,
} from "../controllers/user-info.controller";


const user = new Hono()
user.get("/login-user-info", jwtMiddleware, getLoginUserInfoController)
user.get('/account-info', jwtMiddleware, getAccountInfoController)
user.post('/upload-avatar', jwtMiddleware, uploadAvatarController)
user.post('/update-info', jwtMiddleware, updateAccountInfoController)
user.post('/change-email', jwtMiddleware, changeEmailController)
user.post('/change-password',jwtMiddleware,changePasswordController)

export default user;