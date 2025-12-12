import { Hono } from "hono";
import { sendCodeController } from "../controllers/auth.controller";

const sendCode = new Hono()

sendCode.post('/send-verification-code', sendCodeController)

export default sendCode;