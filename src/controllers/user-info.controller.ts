import { HTTPException } from 'hono/http-exception';
import {
  getAccountInfoService,
  getLoginUserInfoService,
  updateUserInfoService,
  uploadAvatarService,
  changeEmailService,
  changePasswordService,
} from '../services/user-info.service';
import { log } from 'console';


export async function getLoginUserInfoController(c: any) {
  const user = c.get('user');
  const userInfo = await getLoginUserInfoService(user.user_id);

  return c.json({
    code: 200,
    message: 'success',
    data: { userInfo },
  });
}

export async function getAccountInfoController(c: any) {
  const user = c.get('user');
  const accountInfo = await getAccountInfoService(user.user_id);

  return c.json({
    code: 200,
    data: { accountInfo },
    message: 'success',
  });
}

export async function uploadAvatarController(c: any) {
  const user = c.get('user');
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


export async function changePasswordController(c: any) {
  const user = c.get('user');
  const body = await c.req.json();
  log(body.type)
  await changePasswordService(user.user_id, {
    type: body.type,
    email: body.email,
    code: body.code,
    old_password: body.old_password,
    new_password: body.new_password,
    confirm_password: body.confirm_password,
  })
  return c.json({
    code: 200,
    data: null,
    message: '修改密码成功',
  })
}