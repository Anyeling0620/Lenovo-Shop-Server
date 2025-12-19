import { AdminStatus, IdentityStatus } from "@prisma/client";
import { AdminLoginRequest } from "../../types/admin/admin.type";
import { db } from "../../utils/db";
import { HTTPException } from "hono/http-exception";
import bcrypt from 'bcryptjs';
import { log } from "console";



export const vailidateAdminLogin = async (account: string, password: string) => {
    if (!account || !password) {
        throw new HTTPException(400, { message: "账号或密码不能为空" });
    }
    const admin = await db.admin.findUnique({
        where: {
            account: account,
            status: AdminStatus.启用,
        },
        include: {
            adminIdentityAdmins: {
                where: {
                    status: IdentityStatus.启用,
                    OR: [
                        { expireTime: null },
                        { expireTime: { gt: new Date() } } // 未過期
                    ],
                },
                include: {
                    identity: {
                        include: {
                            permissions: {
                                where: {
                                    status: IdentityStatus.启用,
                                },
                                include: {
                                    permission: true, // 关联的权限信息
                                },
                            },
                        },
                    },
                },
            },
            adminProductCategoryAdmins: {
                where: {
                    status: IdentityStatus.启用,
                },
                include: {
                    category: {
                        select: {
                            id: true,
                        },
                    },
                },
            },
        },
    })

    if (!admin) {
        throw new HTTPException(401, { message: "管理员账号不存在或已被禁用" });
    }

    const isPasswordValid = await bcrypt.compare(password, admin.password);
    if (!isPasswordValid) {
        throw new HTTPException(400, { message: "密码错误" });
    }

    const validSession = await db.adminSession.findMany({
        where: {
            adminId: admin.id,
            expireTime: { gt: new Date() },
        },
        select: {
            id: true,
        },
    })
    for (const session of validSession) {
        await deleteAdminSession(session.id);
        log(`管理员${admin.account}的会话${session.id}已被强制注销`)
    }

    const permissionIds: string[] = [];
    const identityIds: string[] = [];
    const categoryIds: string[] = [];

    admin.adminIdentityAdmins.forEach((adminIdentity) => {
        identityIds.push(adminIdentity.identityId);
        adminIdentity.identity.permissions.forEach((identityPermission) => {
            permissionIds.push(identityPermission.permission.id);
        })
    })
    admin.adminProductCategoryAdmins.forEach((adminCategory) => {
        categoryIds.push(adminCategory.category.id);
    })

    await db.admin.update({
        where: {
            id: admin.id,
        },
        data: {
            lastLoginTime: new Date(),
        }
    })

    return {
        admin,
        permissionIds,
        identityIds,
        categoryIds,
    }
}

export const recordAdminLoginDevice = async (
    adminId: string,
    deviceInfo: {
        device_name: string;
        device_type: string;
    },
    sessionId: string,
    sessionExpireTime: Date,
    ipAddress?: string) => {


    await db.adminLogin.create({
        data: {
            adminId,
            sessionId,
            deviceName: deviceInfo.device_name,
            deviceType: deviceInfo.device_type,
            loginIp: ipAddress,
            sessionExpireTime,
        }
    })
}


export const deleteAdminSession = async (sessionPrimaryId: string) => {
    // 1. 查询 Session 是否存在
    const session = await db.adminSession.findUnique({
        where: { id: sessionPrimaryId },
    });

    if (!session) {
        throw new HTTPException(401, { message: "会话不存在或已过期" });
    }

    // 2. 更新 AdminLogin 表的登出时间（若需要）
    await db.adminLogin.updateMany({
        where: {
            sessionId: sessionPrimaryId,
        },
        data: {
            logoutTime: new Date(),
        },
    });

    // 3. 删除 Session 记录
    await db.adminSession.update({
        where: { id: sessionPrimaryId },
        data: {
            expireTime: new Date(),
        }
    });

    return true;
};