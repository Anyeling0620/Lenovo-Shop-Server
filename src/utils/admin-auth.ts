import { HTTPException } from "hono/http-exception";
import { db } from "./db";

/**
 * 获取当前管理员的身份编码集合（会话里只有 identityId，需要再查一次）
 */
export const getIdentityCodesByIds = async (identityIds: string[]): Promise<string[]> => {
  if (!identityIds || identityIds.length === 0) return [];
  const identities = await db.identity.findMany({
    where: { id: { in: identityIds } },
    select: { code: true },
  });
  return identities.map((i) => i.code);
};

/**
 * 校验当前管理员是否拥有指定身份编码之一
 */
export const assertHasIdentity = async (identityIds: string[], allowedCodes: string[]) => {
  if (allowedCodes.length === 0) return;
  const codes = await getIdentityCodesByIds(identityIds);
  if (codes.includes("SUPER_ADMIN")) return;
  const has = codes.some((code) => allowedCodes.includes(code));
  if (!has) {
    throw new HTTPException(403, { message: "无权限执行该操作" });
  }
};

/**
 * 校验管理员是否有操作指定专区（分类）的权限
 */
export const assertCategoryAccess = (categoryIds: string[], targetCategoryId: string) => {
  if (!targetCategoryId) return;
  if (categoryIds.includes(targetCategoryId)) return;
  throw new HTTPException(403, { message: "无权限操作该专区" });
};

/**
 * 判断是否超级管理员
 */
export const isSuperAdmin = async (identityIds: string[]): Promise<boolean> => {
  if (!identityIds || identityIds.length === 0) return false;
  const codes = await getIdentityCodesByIds(identityIds);
  return codes.includes("SUPER_ADMIN");
};

