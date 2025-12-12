import { HTTPException } from 'hono/http-exception';
import {
  getAccountInfoService,
  getLoginUserInfoService,
  updateUserInfoService,
  uploadAvatarService,
  changeEmailService
} from '../services/user-info.service';

export async function getLoginUserInfoController(c: any) {
  const user = c.get('user');

  if (!user.user_id) {
    throw new HTTPException(401, { message: '未登录' });
  }

  const userInfo = await getLoginUserInfoService(user.user_id);

  return c.json({
    code: 200,
    message: 'success',
    data: { userInfo },
  });
}

export async function getAccountInfoController(c: any) {
  const user = c.get('user');

  if (!user) {
    throw new HTTPException(401, { message: '未登录' });
  }

  const accountInfo = await getAccountInfoService(user.user_id);

  return c.json({
    code: 200,
    data: { accountInfo },
    message: 'success',
  });
}

export async function uploadAvatarController(c: any) {
  const user = c.get('user');
  if (!user || !user.user_id) throw new HTTPException(401, { message: '未登录' });

  const form = await c.req.formData();
  const file = form.get('file') as File;

  const filename = await uploadAvatarService(user.user_id, file);

  return c.json({
    code: 200,
    message: '上传成功',
    data: { url: filename },
  });
}


export async function updateAccountInfoController(c: any) {
  const user = c.get('user');
  if (!user || !user.user_id) {
    throw new HTTPException(401, { message: '未登录' });
  }

  const body = await c.req.json();

  await updateUserInfoService(user.user_id, {
    nickname: body.nickname,
    sex: body.sex,
    birthday: body.birthday,
  });

  return c.json({
    code: 200,
    data: null,
    message: '更新成功',
  });
}


export async function changeEmailController(c: any) {
  const user = c.get('user');
  if (!user || !user.user_id) {
    throw new HTTPException(401, { message: '未登录' });
  }
  const body = await c.req.json();
  await changeEmailService(user.user_id, {
    type: body.type,
    old_email: body.old_email,
    old_code: body.old_code,
    new_email: body.new_email,
    new_code: body.new_code,
    password: body.password,
  });

  return c.json({
    code: 200,
    data: null,
    message: '更新成功',
  })
}
