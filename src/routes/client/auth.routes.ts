import { Hono } from 'hono';
import { registerController, loginController, refreshController, logoutController } from '../../controllers/client/auth.controller';


const auth = new Hono();

auth.post('/register', registerController);
auth.post('/login', loginController);
auth.post('/refresh', refreshController);
auth.post('/logout',logoutController)


export default auth;
