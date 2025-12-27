import { HTTPException } from "hono/http-exception";
import { db } from "../../utils/db";
import {
  AfterSaleStatus,
  ComplaintStatus,
  OrderStatus,
  UserCouponStatus,
} from "@prisma/client";
import {
  AfterSaleResponse,
  ComplaintResponse,
  OrderDetailResponse,
  OrderListItem,
} from "../../types/admin/api.type";

export const listOrders = async (): Promise<OrderListItem[]> => {
  const orders = await db.order.findMany({
    include: {
      user: true,
      items: true,
    },
    orderBy: { createdAt: "desc" },
  });
  return orders.map((o) => ({
    order_id: o.id,
    order_no: o.orderNo,
    user_id: o.userId,
    user_account: o.user.account,
    status: o.status,
    pay_amount: o.payAmount,
    actual_pay_amount: o.actualPayAmount,
    pay_time: o.payTime,
    created_at: o.createdAt,
    items: o.items.map((i) => ({
      order_item_id: i.id,
      product_id: i.productId,
      config_id: i.configId,
      quantity: i.quantity,
      pay_amount_snapshot: i.payAmountSnapshot,
      name: i.nameSnapshot,
    })),
  })) as OrderListItem[];
};

export const getOrderDetail = async (orderId: string): Promise<OrderDetailResponse> => {
  const order = await db.order.findUnique({
    where: { id: orderId },
    include: {
      user: true,
      items: { include: { product: true, config: true } },
    },
  });
  if (!order) throw new HTTPException(404, { message: "订单不存在" });
  return {
    order_id: order.id,
    order_no: order.orderNo,
    status: order.status,
    pay_amount: order.payAmount,
    actual_pay_amount: order.actualPayAmount,
    pay_type: order.payType,
    receiver: order.receiver,
    phone: order.phone,
    address: order.address,
    logistics_no: order.logisticsNo,
    items: order.items.map((i) => ({
      order_item_id: i.id,
      product_id: i.productId,
      product_name: i.product.name,
      config_id: i.configId,
      quantity: i.quantity,
      config1: i.config.config1,
      config2: i.config.config2,
      config3: i.config.config3,
    })),
  } as OrderDetailResponse;
};

export const cancelPaidOrder = async (orderId: string) => {
  const order = await db.order.findUnique({
    where: { id: orderId },
    include: { items: true, userCoupons: true },
  });
  if (!order) throw new HTTPException(404, { message: "订单不存在" });
  if (order.status !== OrderStatus.已支付) {
    throw new HTTPException(400, { message: "订单当前状态不可取消" });
  }

  // 还原库存
  for (const item of order.items) {
    const stock = await db.stock.findUnique({ where: { configId: item.configId } });
    if (stock) {
      await db.stock.update({
        where: { id: stock.id },
        data: { stockNum: stock.stockNum + item.quantity },
      });
    }
  }

  // 归还优惠券
  for (const uc of order.userCoupons) {
    await db.userCoupon.update({
      where: { id: uc.id },
      data: { status: UserCouponStatus.未使用, useTime: null, orderId: null },
    });
  }

  await db.order.update({
    where: { id: orderId },
    data: {
      status: OrderStatus.已取消,
      cancelTime: new Date(),
    },
  });
  return true;
};

export const setOrderPendingShip = async (orderId: string) => {
  const order = await db.order.findUnique({ where: { id: orderId } });
  if (!order) throw new HTTPException(404, { message: "订单不存在" });
  if (order.status !== OrderStatus.已支付) {
    throw new HTTPException(400, { message: "订单当前状态不可操作" });
  }
  await db.order.update({
    where: { id: orderId },
    data: { status: OrderStatus.待发货 },
  });
  return true;
};

export const shipOrder = async (orderId: string, logisticsNo: string) => {
  const order = await db.order.findUnique({ where: { id: orderId } });
  if (!order) throw new HTTPException(404, { message: "订单不存在" });
  await db.order.update({
    where: { id: orderId },
    data: { status: OrderStatus.已发货, logisticsNo, shipTime: new Date() },
  });
  return true;
};

export const setOrderPendingReceive = async (orderId: string) => {
  const order = await db.order.findUnique({ where: { id: orderId } });
  if (!order) throw new HTTPException(404, { message: "订单不存在" });
  await db.order.update({
    where: { id: orderId },
    data: { status: OrderStatus.待收货 },
  });
  return true;
};

export const listAfterSales = async (): Promise<AfterSaleResponse[]> => {
  const list = await db.afterSale.findMany({
    include: { 
      order: true, 
      orderItem: true, 

      /////////////////////////////
      //                         //
      //       暂时注释一下        //
      //                         //
      /////////////////////////////
      // user: true 
    },
    orderBy: { applyTime: "desc" },
  });
  return list.map((a) => ({
    after_sale_id: a.id,
    after_sale_no: a.afterSaleNo,
    order_id: a.orderId,
    order_item_id: a.orderItemId,
    type: a.type,
    status: a.status,
    user_id: a.order.userId,
    apply_time: a.applyTime,
    reason: a.reason,
  })) as AfterSaleResponse[];
};

export const handleAfterSale = async (payload: {
  afterSaleId: string;
  status: AfterSaleStatus;
  remark?: string | null;
  handlerId?: string | null;
}) => {
  const afterSale = await db.afterSale.findUnique({ where: { id: payload.afterSaleId } });
  if (!afterSale) throw new HTTPException(404, { message: "售后不存在" });
  await db.afterSale.update({
    where: { id: payload.afterSaleId },
    data: {
      status: payload.status,
      remark: payload.remark ?? afterSale.remark,
      handlerId: payload.handlerId ?? afterSale.handlerId,
      agreeTime: payload.status === AfterSaleStatus.已同意 ? new Date() : afterSale.agreeTime,
      rejectTime: payload.status === AfterSaleStatus.已拒绝 ? new Date() : afterSale.rejectTime,
      rejectReason: payload.status === AfterSaleStatus.已拒绝 ? payload.remark : afterSale.rejectReason,
      completeTime: payload.status === AfterSaleStatus.已完成 ? new Date() : afterSale.completeTime,
    },
  });
  return true;
};

export const listComplaints = async (): Promise<ComplaintResponse[]> => {
  const list = await db.afterSaleComplaint.findMany({
    include: { user: true, afterSale: true },
  });
  return list.map((c) => ({
    after_sale_complaint_id: c.id,
    user_id: c.userId,
    user_account: c.user.account,
    after_sale_id: c.afterSaleId,
    content: c.content,
    is_handled: c.isHandled,
    handle_result: c.handleResult,
    status: c.status,
  })) as ComplaintResponse[];
};

export const handleComplaint = async (payload: {
  complaintId: string;
  handlerId: string;
  result: string;
}) => {
  const complaint = await db.afterSaleComplaint.findUnique({ where: { id: payload.complaintId } });
  if (!complaint) throw new HTTPException(404, { message: "投诉不存在" });
  await db.afterSaleComplaint.update({
    where: { id: payload.complaintId },
    data: {
      isHandled: true,
      handlerId: payload.handlerId,
      handleResult: payload.result,
      handleTime: new Date(),
      status: ComplaintStatus.正常,
    },
  });
  return true;
};
