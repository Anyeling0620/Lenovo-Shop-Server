import { HTTPException } from 'hono/http-exception';
import { db } from '../../utils/db';
import { log } from 'console';

export class PaymentService {
  /**
   * 使用代金券支付
   */
  async payWithVoucher(orderId: string, voucherId: string, userId: string): Promise<{
    success: boolean;
    message: string;
    paidAmount: number;
    remainAmount: number;
  }> {
    // 1. 验证订单
    const order = await db.order.findFirst({
      where: {
        id: orderId,
        userId,
      },
    });

    if (!order) {
      throw new HTTPException(404, { message: '订单不存在' });
    }

    if (order.status !== '待支付') {
      throw new HTTPException(400, { message: '订单状态不支持支付' });
    }

    if (order.payLimitTime < new Date()) {
      throw new HTTPException(400, { message: '订单已超过支付期限' });
    }
   

    // 2. 验证代金券
    const userVoucher = await db.userVoucher.findFirst({
      where: {
        voucherId,
        userId,
        status: true,
      },
      include: { voucher: true },
    });
    


    if (!userVoucher) {
      throw new HTTPException(404, { message: '代金券不存在或不可用' });
    }

    const now = new Date();
    if (now < userVoucher.voucher.startTime || now > userVoucher.voucher.endTime) {
      throw new HTTPException(400, { message: '代金券不在有效期内' });
    }

    const remainAmount = Number(userVoucher.remainAmount);
    const payAmount = Number(order.actualPayAmount);

    // 3. 检查代金券余额是否足够
    if (remainAmount < payAmount) {
      return {
        success: false,
        message: '代金券余额不足',
        paidAmount: 0,
        remainAmount,
      };
    }

    // 4. 执行支付（使用事务）
    await db.$transaction(async (tx) => {
      // 更新代金券使用记录
      const newRemainAmount = remainAmount - payAmount;
      const isUsedUp = newRemainAmount <= 0;

      await tx.userVoucher.update({
        where: { id: userVoucher.id },
        data: {
          remainAmount: newRemainAmount,
          usedAmount: { increment: payAmount },
          useUpTime: isUsedUp ? new Date() : null,
          status: !isUsedUp,
        },
      });

      // 创建代金券使用记录
      await tx.orderVoucherRelation.create({
        data: {
          orderId,
          voucherId,
          usedAmount: payAmount,
          useTime: new Date(),
        },
      });

      // 更新订单状态
      await tx.order.update({
        where: { id: orderId },
        data: {
          status: '已支付',
          actualPayAmount: 0, // 已全额支付
          payTime: new Date(),
          payType: '代金券支付',
        },
      });

      // 如果是秒杀订单，更新秒杀库存
      const orderItems = await tx.orderItem.findMany({
        where: { orderId, seckill: true },
      });

      if (orderItems.length > 0) {
        for (const item of orderItems) {
          await tx.seckillProductConfig.updateMany({
            where: {
              configId: item.configId,
            },
            data: {
              lockNum: { decrement: item.quantity },
              remainNum: { decrement: item.quantity },
            },
          });
        }
      } else {
        // 普通订单，更新普通库存
        for (const item of orderItems) {
          await tx.shelfProductItem.updateMany({
            where: {
              productId: item.productId,
              configId: item.configId,
            },
            data: {
              lockNum: { decrement: item.quantity },
              shelfNum: { decrement: item.quantity },
            },
          });
        }
      }
    });

    return {
      success: true,
      message: '支付成功',
      paidAmount: payAmount,
      remainAmount: remainAmount - payAmount,
    };
  }

  /**
   * 获取订单支付状态
   */
  async getOrderPaymentStatus(orderId: string, userId: string): Promise<{
    orderId: string;
    orderNo: string;
    status: string;
    payAmount: number;
    actualPayAmount: number;
    payTime?: Date;
    payType?: string;
    payLimitTime: Date;
  }> {
    const order = await db.order.findFirst({
      where: {
        id: orderId,
        userId,
      },
      select: {
        id: true,
        orderNo: true,
        status: true,
        payAmount: true,
        actualPayAmount: true,
        payTime: true,
        payType: true,
        payLimitTime: true,
      },
    });

    if (!order) {
      throw new HTTPException(404, { message: '订单不存在' });
    }

    return {
      orderId: order.id,
      orderNo: order.orderNo,
      status: order.status,
      payAmount: Number(order.payAmount),
      actualPayAmount: Number(order.actualPayAmount),
      payTime: order.payTime || undefined,
      payType: order.payType || undefined,
      payLimitTime: order.payLimitTime,
    };
  }
}
