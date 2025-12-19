import { HTTPException } from "hono/http-exception";
import { db } from "../../utils/db";
import { AdminStatus, IdentityStatus, PermissionStatus } from "@prisma/client";
import { AdminPermissionResponse, CategoryInfo, IdentityInfo, PermissionInfo } from "../../types/admin/admin.type";
import { log } from "console";

/**
 * 根据管理员ID获取语义化的权限、身份、专区信息
 * @param adminId 管理员ID
 * @returns 语义化权限信息
 */
export const getAdminPermissionInfo = async (adminId: string): Promise<AdminPermissionResponse> => {
  // ======================================
  // 步骤1：验证管理员存在且启用
  // ======================================
  const admin = await db.admin.findUnique({
    where: {
      id: adminId,
      status: AdminStatus.启用,
    },
    select: { id: true }, // 只查必要字段，提升性能
  });

  if (!admin) {
    throw new HTTPException(404, { message: "管理员不存在或已被禁用" });
  }

  // ======================================
  // 步骤2：查询管理员关联的【启用、未过期】的身份关联记录（AdminIdentity）
  // ======================================
  const adminIdentityRelations = await db.adminIdentity.findMany({
    where: {
      adminId: adminId,
      status: IdentityStatus.启用,
      OR: [
        { expireTime: { gt: new Date() } },
        { expireTime: null },
      ],
    },
    select: { identityId: true }, // 只取身份ID，用于后续查询
  });

  // 提取身份ID列表（去重）
  const identityIds = [...new Set(adminIdentityRelations.map(item => item.identityId))];

  // ======================================
  // 步骤3：查询身份列表（启用状态）+ 身份关联的权限关联记录（IdentityPermission）
  // ======================================
  // 3.1 查询启用的身份基础信息
  const identities = await db.identity.findMany({
    where: {
      id: { in: identityIds },
      status: IdentityStatus.启用,
    },
    select: {
      id: true,
      name: true,
      code: true,
      description: true,
      isSystem: true,
    },
  });

  // 3.2 查询身份关联的【启用】的权限关联记录
  const identityPermissionRelations = await db.identityPermission.findMany({
    where: {
      identityId: { in: identityIds },
      status: IdentityStatus.启用,
    },
    select: {
      identityId: true,
      permissionId: true,
    },
  });

  // 提取权限ID列表（去重）
  const permissionIds = [...new Set(identityPermissionRelations.map(item => item.permissionId))];

  // ======================================
  // 步骤4：查询权限列表（启用状态）+ 子权限
  // ======================================
  // 4.1 查询启用的权限（包括主权限和子权限）
  const permissions = await db.permission.findMany({
    where: {
      OR: [
        { id: { in: permissionIds } }, // 主权限
        { parentId: { in: permissionIds } }, // 子权限（关联主权限）
      ],
      status: PermissionStatus.启用,
    },
    select: {
      id: true,
      name: true,
      type: true,
      module: true,
      parentId: true,
    },
  });

  // ======================================
  // 步骤5：查询管理员关联的【启用】的商品专区关联记录（AdminProductCategory）
  // ======================================
  const adminCategoryRelations = await db.adminProductCategory.findMany({
    where: {
      adminId: adminId,
      status: IdentityStatus.启用,
    },
    include: {
      category: {
        select: {
          id: true,
          name: true,
          code: true,
        },
      },
    },
  });

  // ======================================
  // 步骤6：数据语义化处理 + 去重 + 组装
  // ======================================
  // 6.1 处理身份信息（去重，语义化）
  const identityMap = new Map<string, IdentityInfo>();
  identities.forEach(identity => {
    identityMap.set(identity.id, {
      id: identity.id,
      name: identity.name,
      code: identity.code,
      description: identity.description || "", // 处理null
      isSystem: identity.isSystem,
    });
  });
  const identityList = Array.from(identityMap.values());

  // 6.2 处理权限信息（去重，语义化）
  const permissionMap = new Map<string, PermissionInfo>();
  permissions.forEach(permission => {
    permissionMap.set(permission.id, {
      id: permission.id,
      name: permission.name,
      type: permission.type,
      module: permission.module,
      parentId: permission.parentId,
      children: [], // 初始化子权限
    });
  });
  const permissionList = Array.from(permissionMap.values());

  // 6.3 构建权限树（父子关系）
  const permissionTree = buildPermissionTree(permissionList);

  // 6.4 处理专区信息（去重，语义化）
  const categoryMap = new Map<string, CategoryInfo>();
  adminCategoryRelations.forEach(item => {
    const category = item.category;
    categoryMap.set(category.id, {
      id: category.id,
      name: category.name,
      code: category.code,
    });
  });
  const categoryList = Array.from(categoryMap.values());

  // ======================================
  // 返回最终语义化数据
  // ======================================
  return {
    permissions: permissionList,
    permissionsTree: permissionTree,
    identities: identityList,
    categories: categoryList,
  };
};

/**
 * 辅助函数：将扁平权限列表构建为树形结构
 * @param permissions 扁平权限列表
 * @returns 权限树
 */
const buildPermissionTree = (permissions: PermissionInfo[]): PermissionInfo[] => {
  // 1. 构建父ID到子权限的映射
  const parentMap = new Map<string | null, PermissionInfo[]>();
  const rootPermissions: PermissionInfo[] = [];

  // 初始化映射（处理parentId为null的根权限）
  permissions.forEach(permission => {
    const parentKey = permission.parentId || "root"; // 用"root"标识根节点
    if (!parentMap.has(parentKey)) {
      parentMap.set(parentKey, []);
    }
    parentMap.get(parentKey)!.push(permission);
  });

  // 2. 递归构建子节点
  const buildChildren = (permission: PermissionInfo) => {
    const children = parentMap.get(permission.id) || [];
    permission.children = children;
    children.forEach(child => buildChildren(child));
  };

  // 3. 处理根节点（parentId为null）
  permissions.forEach(permission => {
    if (!permission.parentId) {
      rootPermissions.push(permission);
      buildChildren(permission);
    }
  });

  return rootPermissions;
};

