import { HTTPException } from "hono/http-exception";
import {
  sendAdminEmailCode,
  verifyAdminEmailCode,
} from "../../utils/admin-email-code";
import { ensureAdminIsSuperOrSystem } from "../../services/admin/account.service";
import {
  bindMyEmailByCode,
  updateOtherAdminEmailByCode,
} from "../../services/admin/admin-email.service";


/**
 * 给“管理员邮箱绑定/修改”发送验证码（管理员端）
 * POST /admin/account/email/send-code
 */
export const sendAdminEmailCodeController = async (c: any) => {
  const session = c.get("adminSession");
  if (!session?.admin_id) throw new HTTPException(401, { message: "未登录" });

  const body = await c.req.json().catch(() => ({}));
  const email = String(body.email || "").trim();
  const mode =
    (body.mode as "bind_admin_email" | "update_admin_email") ?? "bind_admin_email";

  if (!email) throw new HTTPException(400, { message: "email 不能为空" });

  await sendAdminEmailCode({ email, mode, requesterAdminId: session.admin_id });

  return c.json({ code: 200, message: "验证码已发送", data: null });
};

/**
 * 绑定/修改自己的邮箱（验证码校验）
 * POST /admin/account/email/bind
 */
export const bindMyEmailByCodeController = async (c: any) => {
  const session = c.get("adminSession");
  if (!session?.admin_id) throw new HTTPException(401, { message: "未登录" });

  const body = await c.req.json().catch(() => ({}));
  const email = String(body.email || "").trim();
  const code = String(body.code || "").trim();

  if (!email) throw new HTTPException(400, { message: "email 不能为空" });
  if (!code) throw new HTTPException(400, { message: "code 不能为空" });

  const ok = verifyAdminEmailCode({ email, code });
  if (!ok) throw new HTTPException(400, { message: "验证码错误或已过期" });

  await bindMyEmailByCode(session.admin_id, email);

  return c.json({ code: 200, message: "邮箱绑定成功", data: null });
};

/**
 * 超级/系统管理员修改其他管理员邮箱（验证码校验）
 * PATCH /admin/system/admins/:admin_id/email
 */
export const updateAdminEmailByCodeController = async (c: any) => {
  const session = c.get("adminSession");
  if (!session?.admin_id) throw new HTTPException(401, { message: "未登录" });
  await ensureAdminIsSuperOrSystem(session.identitys);

  const { admin_id } = c.req.param();
  const body = await c.req.json().catch(() => ({}));
  const email = String(body.email || "").trim();
  const code = String(body.code || "").trim();

  if (!admin_id) throw new HTTPException(400, { message: "admin_id 不能为空" });
  if (!email) throw new HTTPException(400, { message: "email 不能为空" });
  if (!code) throw new HTTPException(400, { message: "code 不能为空" });

  const ok = verifyAdminEmailCode({ email, code });
  if (!ok) throw new HTTPException(400, { message: "验证码错误或已过期" });

  await updateOtherAdminEmailByCode(admin_id, email);

  return c.json({ code: 200, message: "邮箱更新成功", data: null });
};
