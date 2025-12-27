import { HTTPException } from "hono/http-exception";
import { getAdminPermissionInfo } from "../../services/admin/permission.service";
import {
  getAdminProfile,
  updateAdminPassword,
  updateAdminProfile,
} from "../../services/admin/account.service";
import { getFormBody, getUploadedFiles } from "../../middleware/upload.middleware";
import { Gender } from "@prisma/client";
import {
  AdminProfileResponse,
  ChangePasswordRequest,
  UpdateAdminProfileRequest,
} from "../../types/admin/api.type";

// 返回个人账户信息（含身份信息）
export const getAccountInfo = async (c: any) => {
  const session = c.get("adminSession");
  const data: AdminProfileResponse = await getAdminProfile(session.admin_id);
  return c.json({
    code: 200,
    message: "success",
    data,
  });
};

// 修改个人信息（支持上传头像）
export const updateAccountInfo = async (c: any) => {
  const session = c.get("adminSession");
  const body = await c.req.json().catch(() => ({}));

  // 兼容 multipart form-data
  const form = getFormBody(c);
  const payload: UpdateAdminProfileRequest = { ...form, ...body };

  const files = getUploadedFiles(c);
  const avatarFile = files[0]?.filename;

  const updated = await updateAdminProfile(session.admin_id, {
    name: payload.name,
    nickname: payload.nickname,
    email: payload.email,
    gender: payload.gender as Gender | undefined,
    avatar: avatarFile ?? payload.avatar,
  });

  return c.json({
    code: 200,
    message: "更新成功",
    data: updated,
  });
};

// 返回权限详情
export const getAccountPermissions = async (c: any) => {
  const session = c.get("adminSession");
  const data = await getAdminPermissionInfo(session.admin_id);
  return c.json({
    code: 200,
    message: "success",
    data,
  });
};

// 修改密码
export const changeAccountPassword = async (c: any) => {
  const session = c.get("adminSession");
  const body: ChangePasswordRequest = await c.req.json();
  const { old_password, new_password } = body;
  if (!old_password || !new_password) {
    throw new HTTPException(400, { message: "原密码与新密码不能为空" });
  }
  await updateAdminPassword(session.admin_id, old_password, new_password);
  return c.json({
    code: 200,
    message: "密码修改成功",
    data: null,
  });
};
