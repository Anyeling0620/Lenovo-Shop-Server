import { Hono } from "hono";
import { sendCodeController } from "../../controllers/client/auth.controller";

const sendCode = new Hono()

sendCode.post('/send-verification-code', sendCodeController)

export default sendCode;