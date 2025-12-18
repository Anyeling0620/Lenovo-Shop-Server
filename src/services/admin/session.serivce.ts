import { HTTPException } from "hono/http-exception";
import { AdminSessionData } from "../../types/admin.type";
import { db } from "../../utils/db";
import { v4 as uuid } from "uuid";
import { AdminStatus } from "@prisma/client";

export const createAdminSession = async (
  adminId: string,
  sessionData: AdminSessionData,
  expireHours: number = 2  // 默认2小时
): Promise<string> => {
  const sessionId = uuid();
  const expireTime = new Date();
  expireTime.setHours(expireTime.getHours() + expireHours);

  const sessionDataJson = { ...sessionData };
  await db.adminSession.create({
    data: {
      adminId,
      sessionId,
      data: sessionDataJson,
      expireTime,
    }
  })

  const session = await db.adminSession.findUnique({
    where: {
      sessionId,
    },
  });
  if (!session) {
    throw new HTTPException(500, { message: "创建管理员会话失败" });
  }
  return session.id;
}

export const validateAdminSession = async (sessionId: string) => {
  const session = await db.adminSession.findUnique({
    where: {
      id: sessionId,
      expireTime: { gt: new Date() }, // 未过期
    },
  });

  if (!session) {
    throw new HTTPException(401, { message: "无效或已过期的管理员会话" });
  }
  const sessionData = session.data as unknown as AdminSessionData;

  if (!sessionData || !sessionData.admin_id) {
    await db.adminSession.update({
      where: {
        id: sessionId,
      },
      data: {
        expireTime: new Date(),
      }
    });
    throw new HTTPException(401, { message: "会话数据损坏，请重新登录" });
  }

  const admin = await db.admin.findUnique({
    where: {
      id: sessionData.admin_id,
      status: AdminStatus.启用
    },
  });

  if (!admin)
    throw new HTTPException(404, { message: "账号不存在或已禁用" })

  return sessionData;
};