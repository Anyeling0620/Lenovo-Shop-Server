import { IdentityStatus } from "@prisma/client";
import {
  bindAdminIdentity,
  createAdminAccount,
  disableAdmin,
  ensureAdminIsSuperOrSystem,
  listAdmins,
  listIdentitiesWithPermissions,
  listOnlineAdmins,
  listPermissionsMenu,
  listUsers,
  logoutAdmin,
  resetAdminPassword,
  unbindAdminIdentity,
  updateAdminIdentityExpire,
  updateIdentityStatus,
  getAdminLoginRecords,
  forceLogoutBySessionId,
  listOnlineUsers,
  forceLogoutUserByLoginId,
  getUserLoginRecords,
  updateAdminInfo,
  deleteAdminAccount,
} from "../../services/admin/account.service";
import { HTTPException } from "hono/http-exception";
import {
  AdminListItem,
  BindIdentityRequest,
  CreateAdminRequest,
  IdentityWithPermissions,
  PermissionMenuItem,
  ResetPasswordRequest,
  UpdateIdentityExpireRequest,
  UpdateIdentityStatusRequest,
  UserListItem,
} from "../../types/admin/api.type";

export const getAllUsers = async (c: any) => {
  const session = c.get("adminSession");
  await ensureAdminIsSuperOrSystem(session.identitys);
  const data: UserListItem[] = await listUsers();
  return c.json({ code: 200, message: "success", data });
};

export const getAllAdmins = async (c: any) => {
  const session = c.get("adminSession");
  await ensureAdminIsSuperOrSystem(session.identitys);
  const data: AdminListItem[] = await listAdmins();
  return c.json({ code: 200, message: "success", data });
};

export const createAdmin = async (c: any) => {
  const session = c.get("adminSession");
  await ensureAdminIsSuperOrSystem(session.identitys);
  const body: CreateAdminRequest = await c.req.json();
  if (!body.account || !body.password || !body.name) {
    throw new HTTPException(400, { message: "账号、密码、姓名不能为空" });
  }
  const data = await createAdminAccount({
    account: body.account,
    password: body.password,
    name: body.name,
    nickname: body.nickname,
    email: body.email,
    gender: body.gender,
    identityIds: body.identity_ids || [],
    categoryIds: body.category_ids || [],
    creatorId: session.admin_id,
  });
  return c.json({ code: 200, message: "创建成功", data });
};

export const getAllIdentitiesWithPermissions = async (c: any) => {
  const session = c.get("adminSession");
  await ensureAdminIsSuperOrSystem(session.identitys);
  const data: IdentityWithPermissions[] = await listIdentitiesWithPermissions();
  return c.json({ code: 200, message: "success", data });
};

export const getPermissionMenu = async (c: any) => {
  const session = c.get("adminSession");
  await ensureAdminIsSuperOrSystem(session.identitys);
  const data: PermissionMenuItem[] = await listPermissionsMenu();
  return c.json({ code: 200, message: "success", data });
};

export const bindIdentity = async (c: any) => {
  const session = c.get("adminSession");
  await ensureAdminIsSuperOrSystem(session.identitys);
  const { admin_id } = c.req.param();
  const body: BindIdentityRequest = await c.req.json();
  const identityId = body.identity_id;
  const expireTime = body.expire_time ? new Date(body.expire_time) : null;
  if (!identityId) throw new HTTPException(400, { message: "identity_id 不能为空" });
  const id = await bindAdminIdentity({
    adminId: admin_id,
    identityId,
    assignerId: session.admin_id,
    expireTime,
  });
  return c.json({ code: 200, message: "绑定成功", data: { admin_identity_id: id } });
};

export const unbindIdentity = async (c: any) => {
  const session = c.get("adminSession");
  await ensureAdminIsSuperOrSystem(session.identitys);
  const { admin_id, identity_id } = c.req.param();
  await unbindAdminIdentity(admin_id, identity_id);
  return c.json({ code: 200, message: "解绑成功", data: null });
};

export const getOnlineAdmins = async (c: any) => {
  const session = c.get("adminSession");
  await ensureAdminIsSuperOrSystem(session.identitys);
  const data = await listOnlineAdmins();
  return c.json({ code: 200, message: "success", data });
};

export const kickAdminOffline = async (c: any) => {
  const session = c.get("adminSession");
  await ensureAdminIsSuperOrSystem(session.identitys);
  const { admin_id } = c.req.param();
  await logoutAdmin(admin_id);
  return c.json({ code: 200, message: "已下线", data: null });
};

export const disableAdminAccount = async (c: any) => {
  const session = c.get("adminSession");
  await ensureAdminIsSuperOrSystem(session.identitys);
  const { admin_id } = c.req.param();
  await disableAdmin(admin_id);
  return c.json({ code: 200, message: "已禁用", data: null });
};

/**
 * 更新管理员信息
 */
export const updateAdminAccount = async (c: any) => {
  const session = c.get("adminSession");
  await ensureAdminIsSuperOrSystem(session.identitys);
  const { admin_id } = c.req.param();
  const body = await c.req.json();
  
  await updateAdminInfo(admin_id, {
    name: body.name,
    nickname: body.nickname,
    email: body.email,
    identityIds: body.identity_ids,
    categoryIds: body.category_ids,
  });
  
  return c.json({ code: 200, message: "更新成功", data: null });
};

/**
 * 删除管理员
 */
export const deleteAdminAccountController = async (c: any) => {
  const session = c.get("adminSession");
  await ensureAdminIsSuperOrSystem(session.identitys);
  const { admin_id } = c.req.param();
  
  // 防止删除自己
  if (admin_id === session.admin_id) {
    throw new HTTPException(400, { message: "不能删除自己的账号" });
  }
  
  await deleteAdminAccount(admin_id);
  return c.json({ code: 200, message: "删除成功", data: null });
};

export const updateAdminIdentityExpireApi = async (c: any) => {
  const session = c.get("adminSession");
  await ensureAdminIsSuperOrSystem(session.identitys);
  const { admin_id, identity_id } = c.req.param();
  const body: UpdateIdentityExpireRequest = await c.req.json();
  const expireTime = body.expire_time ? new Date(body.expire_time) : null;
  await updateAdminIdentityExpire(admin_id, identity_id, expireTime);
  return c.json({ code: 200, message: "更新成功", data: null });
};

export const updateIdentityStatusApi = async (c: any) => {
  const session = c.get("adminSession");
  await ensureAdminIsSuperOrSystem(session.identitys);
  const { identity_id } = c.req.param();
  const body: UpdateIdentityStatusRequest = await c.req.json();
  if (!body.status) throw new HTTPException(400, { message: "status 不能为空" });
  await updateIdentityStatus(identity_id, body.status as IdentityStatus);
  return c.json({ code: 200, message: "更新成功", data: null });
};

export const resetAdminPasswordApi = async (c: any) => {
  const session = c.get("adminSession");
  await ensureAdminIsSuperOrSystem(session.identitys);
  const { admin_id } = c.req.param();
  const body: ResetPasswordRequest = await c.req.json();
  if (!body.new_password) throw new HTTPException(400, { message: "new_password 不能为空" });
  await resetAdminPassword(admin_id, body.new_password);
  return c.json({ code: 200, message: "重置成功", data: null });
};

/**
 * 获取管理员登录记录
 */
export const getAdminLoginRecordsApi = async (c: any) => {
  const session = c.get("adminSession");
  await ensureAdminIsSuperOrSystem(session.identitys);
  
  const query = c.req.query();
  const params = {
    page: query.page ? parseInt(query.page) : undefined,
    pageSize: query.pageSize ? parseInt(query.pageSize) : undefined,
    account: query.account,
    deviceType: query.deviceType,
    startDate: query.startDate,
    endDate: query.endDate,
  };
  
  const data = await getAdminLoginRecords(params);
  return c.json({ code: 200, message: "success", data });
};

/**
 * 根据sessionId强制下线
 */
export const forceLogoutBySessionIdApi = async (c: any) => {
  const session = c.get("adminSession");
  await ensureAdminIsSuperOrSystem(session.identitys);
  
  const { session_id } = c.req.param();
  await forceLogoutBySessionId(session_id);
  return c.json({ code: 200, message: "强制下线成功", data: null });
};

/**
 * 获取在线用户列表
 */
export const getOnlineUsersApi = async (c: any) => {
  const session = c.get("adminSession");
  await ensureAdminIsSuperOrSystem(session.identitys);
  
  const data = await listOnlineUsers();
  return c.json({ code: 200, message: "success", data });
};

/**
 * 获取用户登录记录
 */
export const getUserLoginRecordsApi = async (c: any) => {
  const session = c.get("adminSession");
  await ensureAdminIsSuperOrSystem(session.identitys);
  
  const query = c.req.query();
  const params = {
    page: query.page ? parseInt(query.page) : undefined,
    pageSize: query.pageSize ? parseInt(query.pageSize) : undefined,
    account: query.account,
    deviceType: query.deviceType,
    startDate: query.startDate,
    endDate: query.endDate,
  };
  
  const data = await getUserLoginRecords(params);
  return c.json({ code: 200, message: "success", data });
};

/**
 * 根据用户登录ID强制下线
 */
export const forceLogoutUserApi = async (c: any) => {
  const session = c.get("adminSession");
  await ensureAdminIsSuperOrSystem(session.identitys);
  
  const { user_login_id } = c.req.param();
  await forceLogoutUserByLoginId(user_login_id);
  return c.json({ code: 200, message: "强制下线成功", data: null });
};
