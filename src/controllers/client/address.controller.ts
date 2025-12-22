import { Context } from 'hono';
import {
  addAddressService,
  getUserAddressListService,
  removeAddressService,
  setDefaultAddressService,
  updateAddressService,
} from '../../services/client/address.service';
import { HTTPException } from 'hono/http-exception';
import { log } from 'console';

// 添加地址 - 修正参数验证
export async function addAddressController(c: Context) {
  const user = c.get('user');
  const userId = user?.user_id as string;

  const body = await c.req.json();
  log(body)

  // 参数验证
  if (!body.provinceCode || !body.cityCode || !body.areaCode || !body.streetCode) {
    throw new HTTPException(400, { message: '地址编码不能为空' });
  }
  if (!body.address || !body.receiver || !body.phone) {
    throw new HTTPException(400, { message: '地址、收货人或手机号不能为空' });
  }

  const id = await addAddressService(userId, {
    provinceCode: body.provinceCode,
    cityCode: body.cityCode,
    areaCode: body.areaCode,
    streetCode: body.streetCode,
    address: body.address,
    receiver: body.receiver,
    phone: body.phone,
    isDefault: body.isDefault ?? false,
  });

  return c.json({ code: 201, message: 'success', data: { id } }, 201);
}


// 更新地址 - 修正允许更新 isDefault
export async function updateAddressController(c: Context) {
  const user = c.get('user');
  const userId = user?.user_id as string;
  const addressId = c.req.param('address-id');
  
  if (!addressId) {
    throw new HTTPException(400, { message: '地址ID不能为空' });
  }

  const body = await c.req.json();
  log(body)

  await updateAddressService(userId, addressId, {
    provinceCode: body.provinceCode,
    cityCode: body.cityCode,
    areaCode: body.areaCode,
    streetCode: body.streetCode,
    address: body.address,
    receiver: body.receiver,
    phone: body.phone,
    isDefault: body.isDefault, // 允许更新默认地址状态
  });

  return c.json({ code: 200, message: 'success', data: null });
}

// 删除地址 - 修正参数获取方式
export async function removeAddressController(c: Context) {
  const user = c.get('user');
  const userId = user?.user_id as string;

  // 修正：应该使用 param 而不是 query
  const addressId = c.req.param('address-id');
  
  if (!addressId) {
    throw new HTTPException(400, { message: '地址ID不能为空' });
  }

  await removeAddressService(userId, addressId);
  return c.json({ code: 200, message: 'success', data: null });
}

// 获取地址列表 - 保持不变
export async function getAddressListController(c: Context) {
  const user = c.get('user');
  const userId = user?.user_id as string;
  const list = await getUserAddressListService(userId);
  return c.json({ code: 200, message: 'success', data: { list } });
}

// 设置默认地址 - 保持不变
export async function setDefaultAddressController(c: Context) {
  const user = c.get('user');
  const userId = user?.user_id as string;
  const addressId = c.req.param('address-id');
  
  if (!addressId) {
    throw new HTTPException(400, { message: '地址ID不能为空' });
  }
  
  await setDefaultAddressService(userId, addressId);
  return c.json({ code: 200, message: 'success', data: null });
}
