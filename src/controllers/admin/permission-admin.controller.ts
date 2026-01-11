import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import * as permService from '../../services/admin/permission.service';
import { ensureAdminIsSuperOrSystem } from '../../services/admin/account.service';

export const createPermission = async (c: any) => {
  const session = c.get('adminSession');
  await ensureAdminIsSuperOrSystem(session.identitys);
  const body = await c.req.json();
  const created = await permService.createPermission(body);
  return c.json({ code: 200, data: created });
};

export const updatePermission = async (c: any) => {
  const session = c.get('adminSession');
  await ensureAdminIsSuperOrSystem(session.identitys);
  const permissionId = c.req.param('permission_id');
  const body = await c.req.json();
  await permService.updatePermissionById(permissionId, body);
  return c.json({ code: 200, data: true });
};

export const deletePermission = async (c: any) => {
  const session = c.get('adminSession');
  await ensureAdminIsSuperOrSystem(session.identitys);
  const permissionId = c.req.param('permission_id');
  await permService.deletePermissionById(permissionId);
  return c.json({ code: 200, data: true });
};

export const createIdentity = async (c: any) => {
  const session = c.get('adminSession');
  await ensureAdminIsSuperOrSystem(session.identitys);
  const body = await c.req.json();
  const created = await permService.createIdentity(body);
  return c.json({ code: 200, data: created });
};

export const updateIdentity = async (c: any) => {
  const session = c.get('adminSession');
  await ensureAdminIsSuperOrSystem(session.identitys);
  const identityId = c.req.param('identity_id');
  const body = await c.req.json();
  await permService.updateIdentityById(identityId, body);
  return c.json({ code: 200, data: true });
};

export const deleteIdentity = async (c: any) => {
  const session = c.get('adminSession');
  await ensureAdminIsSuperOrSystem(session.identitys);
  const identityId = c.req.param('identity_id');
  await permService.deleteIdentityById(identityId);
  return c.json({ code: 200, data: true });
};

export const assignPermissionsToIdentity = async (c: any) => {
  const session = c.get('adminSession');
  await ensureAdminIsSuperOrSystem(session.identitys);
  const identityId = c.req.param('identity_id');
  const body = await c.req.json();
  const permissionIds: string[] = body.permissionIds || [];
  await permService.assignPermissionsToIdentityService(identityId, permissionIds, session.admin_id);
  return c.json({ code: 200, data: true });
};

export const revokePermissionsFromIdentity = async (c: any) => {
  const session = c.get('adminSession');
  await ensureAdminIsSuperOrSystem(session.identitys);
  const identityId = c.req.param('identity_id');
  const body = await c.req.json();
  const permissionIds: string[] = body.permissionIds || [];
  await permService.revokePermissionsFromIdentityService(identityId, permissionIds);
  return c.json({ code: 200, data: true });
};
