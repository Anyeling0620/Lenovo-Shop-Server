import { HTTPException } from 'hono/http-exception';
import { AccountInfo, ChangeEmailPayload, ChangePasswordPayload, UpdateUserInfoDTO, UserInfo } from '../types/user-info.type';
import { db } from '../utils/db';
import path from 'path';
import { promises as fs } from 'fs';
import { verifyCode } from '../utils/verification';
import bcrypt from 'bcryptjs';
import { log } from 'console';


export async function getLoginUserInfoService(userId: string): Promise<UserInfo> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      avatar: true,
      nickname: true,
      memberType: true,
      account: true,
    },
  });
  return {
    userId: user?.id,
    avatar: user?.avatar || '',
    nikeName: user?.nickname || user?.account,
    memberType: user?.memberType,
  } as UserInfo;
}


export async function getAccountInfoService(userId: string): Promise<AccountInfo> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      account: true,
      memberType: true,
      nickname: true,
      birthday: true,
      gender: true,
      email: true,
      avatar: true,
    },
  });


  return {
    account: user?.account,
    memberType: user?.memberType,
    nickName: user?.nickname || undefined,
    birthday: user?.birthday ? user.birthday.toISOString() : null,
    sex: user?.gender,
    email: user?.email,
    avatarUrl: user?.avatar || null,
  } as AccountInfo;
}



export async function uploadAvatarService(userId: string, file: File): Promise<string> {
  if (!file || !(file instanceof File)) throw new HTTPException(400, { message: '未上传文件' });

  // 格式化文件名
  const ext = path.extname(file.name);
  const filename = `${crypto.randomUUID()}${ext}`;

  // 上传目录
  const uploadDir = path.join(process.cwd(), 'public', 'images', 'user', 'avatar');
  await fs.mkdir(uploadDir, { recursive: true });

  const filePath = path.join(uploadDir, filename);

  // 写入文件
  const arrayBuffer = await file.arrayBuffer();
  await fs.writeFile(filePath, Buffer.from(arrayBuffer));

  // 更新用户头像字段
  await db.user.update({
    where: { id: userId },
    data: { avatar: filename },
  });

  return filename;
}


export async function updateUserInfoService(
  userId: string,
  payload: UpdateUserInfoDTO
) {
  const { nickname, sex, birthday } = payload;

  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new HTTPException(404, { message: '用户不存在' });
  }

  // 日期转换
  const birthdayDate = birthday ? new Date(birthday) : null;
  if (birthday && isNaN(birthdayDate!.getTime())) {
    throw new HTTPException(400, { message: '生日格式无效' });
  }

  await db.user.update({
    where: { id: userId },
    data: {
      nickname,
      gender: sex,
      birthday: birthdayDate,
    },
  });

  return null;
}




export async function changeEmailService(
  userId: string,
  payload: ChangeEmailPayload
) {
  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new HTTPException(404, { message: '用户不存在' });
  }
  log(payload)

  const { type, new_code, new_email } = payload;
  if (!verifyCode(new_email, new_code)) throw new HTTPException(400, { message: '新邮箱验证码错误' });
  if (type === 'code') {
    const { old_code, old_email } = payload;
    if (!old_code || !old_email) throw new HTTPException(400, { message: '请输入旧邮箱验证码' })
    if (old_email !== user.email) throw new HTTPException(400, { message: '非法操作' })
    if (!verifyCode(old_email, old_code)) throw new HTTPException(400, { message: '旧邮箱验证码错误' });


  } else if (type === 'password') {
    const { password } = payload;
    if (!password) throw new HTTPException(400, { message: '请输入密码' })
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) throw new HTTPException(400, { message: '密码错误' });
  } else {
    throw new HTTPException(400, { message: '非法操作!请选择验证方式' });
  }
  // 查询新邮箱是否已存在
  const existingUser = await db.user.count({ where: { email: new_email } });
  if (existingUser > 0) throw new HTTPException(400, { message: '新邮箱已注册' });

  await db.user.update({
    where: { id: userId },
    data: { email: new_email }
  })
  return null
}

export async function changePasswordService(
  userId: string,
  payload: ChangePasswordPayload
) {
  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new HTTPException(404, { message: '用户不存在' });
  }
  log(payload)
  const { type, new_password, confirm_password } = payload;
  log(new_password, confirm_password)
  if (!new_password || !confirm_password) throw new HTTPException(400, { message: '请输入新密码' })

  if (type === 'email') {
    const { email, code } = payload;
    if (!email || !code) throw new HTTPException(400, { message: '请输入邮箱和验证码' })
    if (!verifyCode(email, code)) throw new HTTPException(400, { message: '验证码错误' });

  } else if (type === 'password') {
    const { old_password } = payload;
    if (!old_password) throw new HTTPException(400, { message: '请输入密码' })
    if (new_password !== confirm_password) throw new HTTPException(400, { message: '两次密码不一致' });
    const valid = await bcrypt.compare(old_password, user.password);
    if (!valid) throw new HTTPException(400, { message: '旧密码错误' });
    if (old_password === new_password) throw new HTTPException(400, { message: '新密码不能与旧密码相同' })

  } else {
    throw new HTTPException(400, { message: '非法操作' });
  }

  await db.user.update({
    where: { id: userId },
    data: { password: await bcrypt.hash(new_password, 10) }
  })
  return null
}
