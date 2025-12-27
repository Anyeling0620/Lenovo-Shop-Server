import { HTTPException } from "hono/http-exception";
import { db } from "../../utils/db";
import { SessionRoomStatus, ServiceMessageStatus } from "@prisma/client";
import { ServiceMessageResponse, ServiceSessionResponse } from "../../types/admin/api.type";

export const listServiceSessions = async (): Promise<ServiceSessionResponse[]> => {
  const rooms = await db.serviceSessionRoom.findMany({
    include: {
      user: true,
      admin: true,
    },
    orderBy: { createdAt: "desc" },
  });
  return rooms.map((r) => ({
    service_session_room_id: r.id,
    user_id: r.userId,
    user_account: r.user.account,
    admin_id: r.adminId,
    admin_name: r.admin.name,
    status: r.status,
    created_at: r.createdAt,
    end_time: r.endTime,
  })) as ServiceSessionResponse[];
};

export const listServiceMessages = async (roomId: string): Promise<ServiceMessageResponse[]> => {
  const room = await db.serviceSessionRoom.findUnique({ where: { id: roomId } });
  if (!room) throw new HTTPException(404, { message: "会话不存在" });
  const messages = await db.serviceMessage.findMany({
    where: { roomId },
    orderBy: { sendTime: "asc" },
  });
  return messages.map((m) => ({
    service_message_id: m.id,
    room_id: m.roomId,
    sender_type: m.senderType,
    sender_id: m.senderId,
    receiver_type: m.receiverType,
    receiver_id: m.receiverId,
    content: m.content,
    status: m.status,
    send_time: m.sendTime,
    is_read: m.isRead,
  })) as ServiceMessageResponse[];
};

export const markServiceMessageRead = async (messageId: string) => {
  const message = await db.serviceMessage.findUnique({ where: { id: messageId } });
  if (!message) throw new HTTPException(404, { message: "消息不存在" });
  await db.serviceMessage.update({
    where: { id: messageId },
    data: { isRead: true, readTime: new Date() },
  });
  return true;
};

export const endServiceSession = async (roomId: string) => {
  const room = await db.serviceSessionRoom.findUnique({ where: { id: roomId } });
  if (!room) throw new HTTPException(404, { message: "会话不存在" });
  await db.serviceSessionRoom.update({
    where: { id: roomId },
    data: { status: SessionRoomStatus.已结束, endTime: new Date() },
  });
  return true;
};

export const withdrawServiceMessage = async (messageId: string) => {
  const message = await db.serviceMessage.findUnique({ where: { id: messageId } });
  if (!message) throw new HTTPException(404, { message: "消息不存在" });
  await db.serviceMessage.update({
    where: { id: messageId },
    data: { status: ServiceMessageStatus.撤回, withdrawTime: new Date() },
  });
  return true;
};
