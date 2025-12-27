import { assertHasIdentity } from "../../utils/admin-auth";
import {
  endServiceSession,
  listServiceMessages,
  listServiceSessions,
  markServiceMessageRead,
  withdrawServiceMessage,
} from "../../services/admin/customer-service.service";
import { HTTPException } from "hono/http-exception";

const serviceRoles = ["SUPER_ADMIN", "SYSTEM_ADMIN", "CUSTOMER_SERVICE"];

export const listServiceSessionsController = async (c: any) => {
  const session = c.get("adminSession");
  await assertHasIdentity(session.identitys, serviceRoles);
  const data = await listServiceSessions();
  return c.json({ code: 200, message: "success", data });
};

export const listServiceMessagesController = async (c: any) => {
  const session = c.get("adminSession");
  await assertHasIdentity(session.identitys, serviceRoles);
  const { room_id } = c.req.param();
  const data = await listServiceMessages(room_id);
  return c.json({ code: 200, message: "success", data });
};

export const markServiceMessageReadController = async (c: any) => {
  const session = c.get("adminSession");
  await assertHasIdentity(session.identitys, serviceRoles);
  const { message_id } = c.req.param();
  await markServiceMessageRead(message_id);
  return c.json({ code: 200, message: "已标记已读", data: null });
};

export const endServiceSessionController = async (c: any) => {
  const session = c.get("adminSession");
  await assertHasIdentity(session.identitys, serviceRoles);
  const { room_id } = c.req.param();
  await endServiceSession(room_id);
  return c.json({ code: 200, message: "会话已结束", data: null });
};

export const withdrawServiceMessageController = async (c: any) => {
  const session = c.get("adminSession");
  await assertHasIdentity(session.identitys, serviceRoles);
  const { message_id } = c.req.param();
  await withdrawServiceMessage(message_id);
  return c.json({ code: 200, message: "撤回成功", data: null });
};

