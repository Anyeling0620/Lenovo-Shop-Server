import { HTTPException } from "hono/http-exception";
import { db } from "../../utils/db";
import bcrypt from "bcryptjs";
import {
  AdminStatus,
  Gender,
  IdentityStatus,
  PermissionStatus,
} from "@prisma/client";
import {
  AdminListItem,
  AdminProfileResponse,
  IdentityWithPermissions,
  PermissionMenuItem,
  UserListItem,
} from "../../types/admin/api.type";
import { getIdentityCodesByIds } from "../../utils/admin-auth";

export const getAdminProfile = async (adminId: string): Promise<AdminProfileResponse> => {
  const admin = await db.admin.findUnique({
    where: { id: adminId, status: AdminStatus.启用 },
    include: {
      adminIdentityAdmins: {
        include: {
          identity: {
            include: {
              permissions: {
                where: { status: IdentityStatus.启用 },
                include: { permission: true },
              },
            },
          },
        },
      },
      adminProductCategoryAdmins: {
        where: { status: IdentityStatus.启用 },
        include: { category: true },
      },
    },
  });

  if (!admin) {
    throw new HTTPException(404, { message: "管理员不存在或已禁用" });
  }

  const identities = admin.adminIdentityAdmins.map((rel) => ({
    admin_identity_id: rel.id,
    identity_id: rel.identity.id,
    identity_name: rel.identity.name,
    identity_code: rel.identity.code,
    expire_time: rel.expireTime,
    status: rel.status,
  }));

  const permissions = admin.adminIdentityAdmins.flatMap((rel) =>
    rel.identity.permissions.map((p) => ({
      identity_permission_id: p.id,
      permission_id: p.permission.id,
      permission_name: p.permission.name,
      permission_type: p.permission.type,
      module: p.permission.module,
      parent_id: p.permission.parentId,
    }))
  );

  const categories = admin.adminProductCategoryAdmins.map((rel) => ({
    admin_product_category_id: rel.id,
    category_id: rel.category.id,
    category_name: rel.category.name,
    category_code: rel.category.code,
    status: rel.status,
  }));

  return {
    admin_id: admin.id,
    account: admin.account,
    name: admin.name,
    nickname: admin.nickname,
    gender: admin.gender,
    email: admin.email,
    avatar: admin.avatar,
    status: admin.status,
    created_at: admin.createdAt,
    last_login_time: admin.lastLoginTime,
    identities,
    permissions,
    categories,
  } as AdminProfileResponse;
};

export const updateAdminProfile = async (
  adminId: string,
  payload: {
    name?: string;
    nickname?: string;
    gender?: Gender;
    email?: string;
    avatar?: string | null;
  }
) => {
  const admin = await db.admin.findUnique({
    where: { id: adminId, status: AdminStatus.启用 },
  });
  if (!admin) {
    throw new HTTPException(404, { message: "管理员不存在或已禁用" });
  }

  // 唯一邮箱校验
  if (payload.email) {
    const emailOwner = await db.admin.findFirst({
      where: { email: payload.email, id: { not: adminId } },
      select: { id: true },
    });
    if (emailOwner) {
      throw new HTTPException(400, { message: "邮箱已被使用" });
    }
  }

  const updated = await db.admin.update({
    where: { id: adminId },
    data: {
      name: payload.name ?? admin.name,
      nickname: payload.nickname ?? admin.nickname,
      gender: payload.gender ?? admin.gender,
      email: payload.email ?? admin.email,
      avatar: payload.avatar ?? admin.avatar,
    },
  });

  return {
    admin_id: updated.id,
    name: updated.name,
    nickname: updated.nickname,
    gender: updated.gender,
    email: updated.email,
    avatar: updated.avatar,
  };
};

export const updateAdminPassword = async (
  adminId: string,
  oldPassword: string,
  newPassword: string
) => {
  const admin = await db.admin.findUnique({
    where: { id: adminId, status: AdminStatus.启用 },
  });
  if (!admin) {
    throw new HTTPException(404, { message: "管理员不存在或已禁用" });
  }
  const ok = await bcrypt.compare(oldPassword, admin.password);
  if (!ok) {
    throw new HTTPException(400, { message: "原密码错误" });
  }

  const hashed = await bcrypt.hash(newPassword, 10);
  await db.admin.update({
    where: { id: adminId },
    data: { password: hashed },
  });
  return true;
};

export const listUsers = async (): Promise<UserListItem[]> => {
  const users = await db.user.findMany({
    select: {
      id: true,
      account: true,
      email: true,
      nickname: true,
      avatar: true,
      memberType: true,
      gender: true,
      createdAt: true,
    },
  });
  return users.map((u) => ({
    user_id: u.id,
    account: u.account,
    email: u.email,
    nickname: u.nickname,
    avatar: u.avatar,
    member_type: u.memberType,
    gender: u.gender,
    created_at: u.createdAt,
  })) as UserListItem[];
};

export const listAdmins = async (): Promise<AdminListItem[]> => {
  const admins = await db.admin.findMany({
    include: {
      adminIdentityAdmins: {
        include: { identity: true },
      },
      adminProductCategoryAdmins: {
        include: { category: true },
      },
    },
  });

  return admins.map((admin) => ({
    admin_id: admin.id,
    account: admin.account,
    name: admin.name,
    nickname: admin.nickname,
    email: admin.email,
    status: admin.status,
    identities: admin.adminIdentityAdmins.map((rel) => ({
      admin_identity_id: rel.id,
      identity_id: rel.identity.id,
      identity_name: rel.identity.name,
      identity_code: rel.identity.code,
      status: rel.status,
      expire_time: rel.expireTime,
    })),
    categories: admin.adminProductCategoryAdmins.map((rel) => ({
      admin_product_category_id: rel.id,
      category_id: rel.category.id,
      category_name: rel.category.name,
      category_code: rel.category.code,
      status: rel.status,
    })),
  })) as AdminListItem[];
};

export const createAdminAccount = async (payload: {
  account: string;
  password: string;
  name: string;
  nickname?: string;
  email?: string;
  gender?: Gender;
  identityIds?: string[];
  categoryIds?: string[];
  creatorId?: string;
}) => {
  const exists = await db.admin.findUnique({
    where: { account: payload.account },
    select: { id: true },
  });
  if (exists) throw new HTTPException(400, { message: "账号已存在" });

  if (payload.email) {
    const emailOwner = await db.admin.findUnique({
      where: { email: payload.email },
      select: { id: true },
    });
    if (emailOwner) throw new HTTPException(400, { message: "邮箱已存在" });
  }

  const hashed = await bcrypt.hash(payload.password, 10);

  const admin = await db.admin.create({
    data: {
      account: payload.account,
      password: hashed,
      name: payload.name,
      nickname: payload.nickname,
      email: payload.email,
      gender: payload.gender ?? Gender.secret,
      creatorId: payload.creatorId,
    },
  });

  // 绑定身份
  if (payload.identityIds?.length) {
    const identityData = payload.identityIds.map((identityId) => ({
      adminId: admin.id,
      identityId,
      assignerId: payload.creatorId ?? admin.id,
    }));
    await db.adminIdentity.createMany({
      data: identityData,
      skipDuplicates: true,
    });
  }

  // 绑定专区
  if (payload.categoryIds?.length) {
    const catData = payload.categoryIds.map((categoryId) => ({
      adminId: admin.id,
      categoryId,
      creatorId: payload.creatorId ?? admin.id,
    }));
    await db.adminProductCategory.createMany({
      data: catData,
      skipDuplicates: true,
    });
  }

  return {
    admin_id: admin.id,
    account: admin.account,
    name: admin.name,
    email: admin.email,
  };
};

export const listIdentitiesWithPermissions = async (): Promise<IdentityWithPermissions[]> => {
  const identities = await db.identity.findMany({
    include: {
      permissions: {
        where: { status: IdentityStatus.启用 },
        include: { permission: true },
      },
    },
  });

  return identities.map((identity) => ({
    identity_id: identity.id,
    identity_name: identity.name,
    identity_code: identity.code,
    description: identity.description,
    status: identity.status,
    permissions: identity.permissions.map((p) => ({
      identity_permission_id: p.id,
      permission_id: p.permission.id,
      permission_name: p.permission.name,
      type: p.permission.type,
      module: p.permission.module,
      parent_id: p.permission.parentId,
    })),
  })) as IdentityWithPermissions[];
};

export const listPermissionsMenu = async (): Promise<PermissionMenuItem[]> => {
  const permissions = await db.permission.findMany({
    where: { status: PermissionStatus.启用 },
    orderBy: [{ module: "asc" }, { parentId: "asc" }],
  });
  return permissions.map((p) => ({
    permission_id: p.id,
    permission_name: p.name,
    type: p.type,
    module: p.module,
    parent_id: p.parentId,
  })) as PermissionMenuItem[];
};

export const bindAdminIdentity = async (payload: {
  adminId: string;
  identityId: string;
  assignerId: string;
  expireTime?: Date | null;
}) => {
  const exist = await db.adminIdentity.findUnique({
    where: { adminId_identityId: { adminId: payload.adminId, identityId: payload.identityId } },
  });

  if (exist) {
    await db.adminIdentity.update({
      where: { id: exist.id },
      data: {
        status: IdentityStatus.启用,
        expireTime: payload.expireTime ?? null,
        assignerId: payload.assignerId,
        assignTime: new Date(),
      },
    });
    return exist.id;
  }

  const record = await db.adminIdentity.create({
    data: {
      adminId: payload.adminId,
      identityId: payload.identityId,
      assignerId: payload.assignerId,
      expireTime: payload.expireTime ?? null,
    },
  });
  return record.id;
};

export const unbindAdminIdentity = async (adminId: string, identityId: string) => {
  const exist = await db.adminIdentity.findUnique({
    where: { adminId_identityId: { adminId, identityId } },
  });
  if (!exist) throw new HTTPException(404, { message: "未找到绑定关系" });
  await db.adminIdentity.update({
    where: { id: exist.id },
    data: { status: IdentityStatus.禁用 },
  });
  return true;
};

export const listOnlineAdmins = async () => {
  const sessions = await db.adminSession.findMany({
    where: { expireTime: { gt: new Date() } },
    include: { 
      admin: true,
      logins: {
        where: { logoutTime: null },
        orderBy: { loginTime: 'desc' },
        take: 1,
      },
    },
  });

  return sessions.map((s) => {
    const latestLogin = s.logins[0];
    return {
      admin_session_id: s.id,
      session_id: s.sessionId,
      expire_time: s.expireTime,
      admin_id: s.adminId,
      account: s.admin.account,
      name: s.admin.name,
      status: s.admin.status,
      login_time: latestLogin?.loginTime,
      login_ip: latestLogin?.loginIp,
      device_name: latestLogin?.deviceName,
      device_type: latestLogin?.deviceType,
    };
  });
};

export const logoutAdmin = async (adminId: string) => {
  await db.adminSession.updateMany({
    where: { adminId },
    data: { expireTime: new Date() },
  });
  await db.adminLogin.updateMany({
    where: { adminId },
    data: { logoutTime: new Date() },
  });
  return true;
};

export const disableAdmin = async (adminId: string) => {
  await db.admin.update({
    where: { id: adminId },
    data: { status: AdminStatus.禁用 },
  });
  await logoutAdmin(adminId);
  return true;
};

export const updateAdminIdentityExpire = async (
  adminId: string,
  identityId: string,
  expireTime: Date | null
) => {
  const exist = await db.adminIdentity.findUnique({
    where: { adminId_identityId: { adminId, identityId } },
  });
  if (!exist) throw new HTTPException(404, { message: "未找到绑定关系" });

  await db.adminIdentity.update({
    where: { id: exist.id },
    data: { expireTime },
  });
  return true;
};

export const updateIdentityStatus = async (identityId: string, status: IdentityStatus) => {
  await db.identity.update({
    where: { id: identityId },
    data: { status },
  });
  return true;
};

export const resetAdminPassword = async (adminId: string, newPassword: string) => {
  const hashed = await bcrypt.hash(newPassword, 10);
  await db.admin.update({
    where: { id: adminId },
    data: { password: hashed },
  });
  await logoutAdmin(adminId);
  return true;
};

export const ensureAdminIsSuperOrSystem = async (identityIds: string[]) => {
  const codes = await getIdentityCodesByIds(identityIds);
  if (codes.includes("SUPER_ADMIN") || codes.includes("SYSTEM_ADMIN")) return;
  throw new HTTPException(403, { message: "需要系统管理员权限" });
};

/**
 * 获取管理员登录记录
 */
export const getAdminLoginRecords = async (params: {
  page?: number;
  pageSize?: number;
  account?: string;
  deviceType?: string;
  startDate?: string;
  endDate?: string;
}) => {
  const page = params.page || 1;
  const pageSize = params.pageSize || 10;
  const skip = (page - 1) * pageSize;

  const where: any = {};

  // 根据账号筛选
  if (params.account) {
    const admins = await db.admin.findMany({
      where: {
        OR: [
          { account: { contains: params.account } },
          { name: { contains: params.account } },
        ],
      },
      select: { id: true },
    });
    where.adminId = { in: admins.map((a) => a.id) };
  }

  // 根据设备类型筛选
  if (params.deviceType) {
    where.deviceType = params.deviceType;
  }

  // 根据时间范围筛选
  if (params.startDate || params.endDate) {
    where.loginTime = {};
    if (params.startDate) {
      where.loginTime.gte = new Date(params.startDate);
    }
    if (params.endDate) {
      where.loginTime.lte = new Date(params.endDate);
    }
  }

  const [records, total] = await Promise.all([
    db.adminLogin.findMany({
      where,
      include: {
        admin: {
          select: {
            id: true,
            account: true,
            name: true,
          },
        },
      },
      orderBy: { loginTime: "desc" },
      skip,
      take: pageSize,
    }),
    db.adminLogin.count({ where }),
  ]);

  return {
    list: records.map((r) => ({
      id: r.id,
      adminId: r.adminId,
      account: r.admin.account,
      name: r.admin.name,
      deviceType: r.deviceType,
      deviceName: r.deviceName,
      ipAddress: r.loginIp || "",
      loginTime: r.loginTime,
      logoutTime: r.logoutTime,
      status: r.logoutTime ? "OFFLINE" : "ONLINE",
      sessionId: r.sessionId,
    })),
    total,
    page,
    pageSize,
  };
};

/**
 * 根据sessionId强制管理员下线
 */
export const forceLogoutBySessionId = async (sessionId: string) => {
  const session = await db.adminSession.findUnique({
    where: { sessionId },
  });

  if (!session) {
    throw new HTTPException(404, { message: "会话不存在" });
  }

  // 更新session过期时间
  await db.adminSession.update({
    where: { id: session.id },
    data: { expireTime: new Date() },
  });

  // 更新登录记录的登出时间
  await db.adminLogin.updateMany({
    where: { sessionId: session.id, logoutTime: null },
    data: { logoutTime: new Date() },
  });

  return true;
};
