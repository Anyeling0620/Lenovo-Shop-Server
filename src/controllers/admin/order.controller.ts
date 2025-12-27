import { HTTPException } from "hono/http-exception";
import { assertHasIdentity } from "../../utils/admin-auth";
import {
  cancelPaidOrder,
  getOrderDetail,
  handleAfterSale,
  handleComplaint,
  listAfterSales,
  listComplaints,
  listOrders,
  setOrderPendingReceive,
  setOrderPendingShip,
  shipOrder,
} from "../../services/admin/order.service";
import { AfterSaleStatus } from "@prisma/client";

const orderRoles = ["SUPER_ADMIN", "ORDER_MANAGER", "AFTER_SALES", "SYSTEM_ADMIN"];

export const listOrdersController = async (c: any) => {
  const session = c.get("adminSession");
  await assertHasIdentity(session.identitys, orderRoles);
  const data = await listOrders();
  return c.json({ code: 200, message: "success", data });
};

export const getOrderDetailController = async (c: any) => {
  const session = c.get("adminSession");
  await assertHasIdentity(session.identitys, orderRoles);
  const { order_id } = c.req.param();
  const data = await getOrderDetail(order_id);
  return c.json({ code: 200, message: "success", data });
};

export const cancelOrderController = async (c: any) => {
  const session = c.get("adminSession");
  await assertHasIdentity(session.identitys, orderRoles);
  const { order_id } = c.req.param();
  await cancelPaidOrder(order_id);
  return c.json({ code: 200, message: "取消成功", data: null });
};

export const setOrderPendingShipController = async (c: any) => {
  const session = c.get("adminSession");
  await assertHasIdentity(session.identitys, orderRoles);
  const { order_id } = c.req.param();
  await setOrderPendingShip(order_id);
  return c.json({ code: 200, message: "设置成功", data: null });
};

export const shipOrderController = async (c: any) => {
  const session = c.get("adminSession");
  await assertHasIdentity(session.identitys, orderRoles);
  const { order_id } = c.req.param();
  const body = await c.req.json();
  if (!body.logistics_no) throw new HTTPException(400, { message: "logistics_no 不能为空" });
  await shipOrder(order_id, body.logistics_no);
  return c.json({ code: 200, message: "发货成功", data: null });
};

export const setOrderPendingReceiveController = async (c: any) => {
  const session = c.get("adminSession");
  await assertHasIdentity(session.identitys, orderRoles);
  const { order_id } = c.req.param();
  await setOrderPendingReceive(order_id);
  return c.json({ code: 200, message: "设置成功", data: null });
};

export const listAfterSalesController = async (c: any) => {
  const session = c.get("adminSession");
  await assertHasIdentity(session.identitys, orderRoles);
  const data = await listAfterSales();
  return c.json({ code: 200, message: "success", data });
};

export const handleAfterSaleController = async (c: any) => {
  const session = c.get("adminSession");
  await assertHasIdentity(session.identitys, orderRoles);
  const { after_sale_id } = c.req.param();
  const body = await c.req.json();
  await handleAfterSale({
    afterSaleId: after_sale_id,
    status: body.status as AfterSaleStatus,
    remark: body.remark,
    handlerId: session.admin_id,
  });
  return c.json({ code: 200, message: "处理成功", data: null });
};

export const listComplaintsController = async (c: any) => {
  const session = c.get("adminSession");
  await assertHasIdentity(session.identitys, orderRoles);
  const data = await listComplaints();
  return c.json({ code: 200, message: "success", data });
};

export const handleComplaintController = async (c: any) => {
  const session = c.get("adminSession");
  await assertHasIdentity(session.identitys, orderRoles);
  const { complaint_id } = c.req.param();
  const body = await c.req.json();
  await handleComplaint({
    complaintId: complaint_id,
    handlerId: session.admin_id,
    result: body.result,
  });
  return c.json({ code: 200, message: "处理成功", data: null });
};

