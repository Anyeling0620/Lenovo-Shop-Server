import { HTTPException } from 'hono/http-exception';
import { db } from '../../utils/db';
import { UserAddressItem, UserAddressListResponse } from '../../types/client/address.type';

type AddressPayload = {
  provinceCode: string;
  cityCode: string;
  areaCode: string;
  streetCode: string;
  address: string;
  receiver: string;
  phone: string;
  isDefault?: boolean;
};

export async function addAddressService(userId: string, payload: AddressPayload): Promise<string> {
  if (!userId) throw new HTTPException(401, { message: '未登录' });

  const { provinceCode, cityCode, areaCode, streetCode, address, receiver, phone, isDefault } = payload;
  if (!provinceCode || !cityCode || !areaCode || !streetCode || !address || !receiver || !phone) {
    throw new HTTPException(400, { message: '缺少必要字段' });
  }

  // 检查是否已有默认地址，如果有且当前要设置为默认，则取消原有默认
  if (isDefault) {
    await db.receiptAddress.updateMany({
      where: { userId, isDefault: true },
      data: { isDefault: false },
    });
  }

  const created = await db.receiptAddress.create({
    data: {
      userId,
      provinceCode,
      cityCode,
      areaCode,
      streetCode,
      address,
      receiver,
      phone,
      isDefault: !!isDefault,
    },
    select: { id: true },
  });

  return created.id;
}

export async function updateAddressService(
  userId: string,
  addressId: string,
  payload: AddressPayload
) {
  if (!userId) throw new HTTPException(401, { message: '未登录' });
  if (!addressId) throw new HTTPException(400, { message: 'addressId 必填' });

  // 先检查地址是否存在且属于当前用户
  const existingAddress = await db.receiptAddress.findFirst({
    where: { id: addressId, userId },
    select: { isDefault: true }
  });

  if (!existingAddress) {
    throw new HTTPException(404, { message: '地址不存在' });
  }

  // 如果要设置为默认地址，需要先取消其他默认地址
  if (payload.isDefault === true) {
    await db.receiptAddress.updateMany({
      where: { 
        userId, 
        isDefault: true,
        id: { not: addressId } // 排除当前地址
      },
      data: { isDefault: false },
    });
  }

  const { count } = await db.receiptAddress.updateMany({
    where: { id: addressId, userId },
    data: {
      provinceCode: payload.provinceCode,
      cityCode: payload.cityCode,
      areaCode: payload.areaCode,
      streetCode: payload.streetCode,
      address: payload.address,
      receiver: payload.receiver,
      phone: payload.phone,
      isDefault: payload.isDefault, // 允许更新默认状态
    },
  });

  if (count === 0) throw new HTTPException(404, { message: '地址更新失败' });
}

export async function removeAddressService(userId: string, addressId: string) {
  if (!userId) throw new HTTPException(401, { message: '未登录' });
  if (!addressId) throw new HTTPException(400, { message: 'addressId 必填' });

  // 先检查要删除的地址是否是默认地址
  const addressToDelete = await db.receiptAddress.findFirst({
    where: { id: addressId, userId },
    select: { isDefault: true }
  });

  if (!addressToDelete) {
    throw new HTTPException(404, { message: '地址不存在' });
  }

  const { count } = await db.receiptAddress.deleteMany({ 
    where: { id: addressId, userId } 
  });
  
  if (count === 0) throw new HTTPException(404, { message: '地址删除失败' });

  // 如果删除的是默认地址，需要设置一个新的默认地址（可选逻辑）
  if (addressToDelete.isDefault) {
    // 可以在这里设置一个新的默认地址，比如最近更新的一个
    const latestAddress = await db.receiptAddress.findFirst({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      select: { id: true }
    });

    if (latestAddress) {
      await db.receiptAddress.update({
        where: { id: latestAddress.id },
        data: { isDefault: true }
      });
    }
  }
}

export async function getUserAddressListService(userId: string): Promise<UserAddressListResponse> {
  if (!userId) throw new HTTPException(401, { message: '未登录' });
  
  const list = await db.receiptAddress.findMany({
    where: { userId },
    orderBy: [{ isDefault: 'desc' }, { updatedAt: 'desc' }],
    include: {
      province: {
        select: {
          name: true,
          code: true
        }
      },
      city: {
        select: {
          name: true,
          code: true
        }
      },
      area: {
        select: {
          name: true,
          code: true
        }
      },
      street: {
        select: {
          name: true,
          code: true
        }
      }
    }
  });
  
  // 格式化返回数据，移除原始的 code 字段，只保留关联对象
  const formattedList: UserAddressItem[] = list.map(address => ({
    id: address.id,
    userId: address.userId,
    address: address.address,
    receiver: address.receiver,
    phone: address.phone,
    isDefault: address.isDefault,
    createdAt: address.createdAt,
    updatedAt: address.updatedAt,
    province: {
      code: address.provinceCode,
      name: address.province?.name || ''
    },
    city: {
      code: address.cityCode,
      name: address.city?.name || ''
    },
    area: {
      code: address.areaCode,
      name: address.area?.name || ''
    },
    street: {
      code: address.streetCode,
      name: address.street?.name || ''
    }
  }));
  
  return formattedList;
}

export async function setDefaultAddressService(userId: string, addressId: string) {
  if (!userId) throw new HTTPException(401, { message: '未登录' });
  if (!addressId) throw new HTTPException(400, { message: 'addressId 必填' });

  // 1. 先检查地址是否存在且属于当前用户
  const targetAddress = await db.receiptAddress.findFirst({
    where: { id: addressId, userId },
    select: { id: true, isDefault: true }
  });

  if (!targetAddress) {
    throw new HTTPException(404, { message: '地址不存在' });
  }

  // 2. 如果已经是默认地址，直接返回
  if (targetAddress.isDefault) {
    return;
  }

  // 3. 使用事务确保数据一致性
  await db.$transaction(async (tx) => {
    // 3.1 先取消所有默认地址
    await tx.receiptAddress.updateMany({
      where: { 
        userId, 
        isDefault: true,
        id: { not: addressId } // 排除当前要设置的地址
      },
      data: { isDefault: false },
    });

    // 3.2 设置新的默认地址
    const result = await tx.receiptAddress.updateMany({
      where: { id: addressId, userId },
      data: { isDefault: true },
    });

    if (result.count === 0) {
      throw new HTTPException(404, { message: '设置默认地址失败' });
    }
  });
}
