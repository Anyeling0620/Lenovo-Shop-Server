import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import { log } from 'console';
dotenv.config();

const codeMap = new Map<string, { code: string; expireTime: number }>();

const transporter = nodemailer.createTransport({
  host: process.env.QQ_EMAIL_HOST,
  port: 465,
  secure: true,
  auth: {
    user: process.env.QQ_EMAIL_USER,
    pass: process.env.QQ_EMAIL_PASS,
  },
});

export function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function sendCode(email: string, mode?: 'register' | 'login') {
  const code = generateCode();
  const expireTime = Date.now() + 10 * 60 * 1000;
  codeMap.set(email, { code, expireTime });

  await transporter.sendMail({
    from: process.env.QQ_EMAIL_USER,
    to: email,
    subject: 'lenovo', //mode === 'register' ? '注册验证码' : '登录验证码',
    text: `您的验证码是 ${code}，有效期10分钟`,
  });
  log("email:",email,"code:",code)

  setTimeout(() => codeMap.delete(email), 10 * 60 * 1000);
}

export function verifyCode(email: string, code: string): boolean {
  log('正在验证验证码:',email,code)
  const record = codeMap.get(email);
  if (!record) return false;
  if (Date.now() > record.expireTime) {
    codeMap.delete(email);
    return false;
  }
  const valid = record.code === code;
  if (valid) codeMap.delete(email);
  return valid;
}
