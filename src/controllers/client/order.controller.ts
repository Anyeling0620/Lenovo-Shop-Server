import { Context } from 'hono';
import { CreateOrderInput, CancelOrderInput, PaymentInput, OrderListQuery, OrderStatus } from '../../types/client/order.type';
import { PaymentService } from '../../services/client/payment.service';
import { OrderService } from '../../services/client/order.service';
import { log } from 'console';

const orderService = new OrderService();
const paymentService = new PaymentService();

export class OrderController {
    /**
     * 创建订单
     */
    async createOrder(c: Context) {
        const body = await c.req.json() as CreateOrderInput;
        const user = c.get('user');
        const userId = user?.user_id
        log(body)
        // 验证必要字段
        if (!body.addressId || !body.items || body.items.length === 0) {
            throw new Error('缺少必要参数');
        }
        const result = await orderService.createOrder({ ...body, userId });
        log(result)
        return c.json({
            code: 200,
            message: '订单创建成功',
            data: result,
        });
    }


    /**
     * 取消订单
     */
    async cancelOrder(c: Context) {
        const body = await c.req.json() as CancelOrderInput;
        if (!body.orderId) {
            throw new Error('订单ID不能为空');
        }
        const user = c.get('user');
        const userId = user?.user_id
        await orderService.cancelOrder(body.orderId, userId);
        return c.json({
            code: 200,
            message: '订单取消成功',
        });
    }

    /**
     * 使用代金券支付
     */
    async payWithVoucher(c: Context) {
        const body = await c.req.json() as PaymentInput;
        if (!body.orderId || !body.voucherId) {
            throw new Error('订单ID和代金券ID不能为空');
        }
        const user = c.get('user');
        const userId = user?.user_id
        const result = await paymentService.payWithVoucher(
            body.orderId,
            body.voucherId,
            userId
        );
        return c.json({
            code: result.success ? 200 : 400,
            message: result.message,
            data: {
                success: result.success,
                paidAmount: result.paidAmount,
                remainAmount: result.remainAmount,
            },
        });
    }

    /**
     * 获取订单支付状态
     */
    async getPaymentStatus(c: Context) {

        const orderId = c.req.query('orderId');
        if (!orderId) {
            throw new Error('订单ID不能为空');
        }
        const user = c.get('user');
        const userId = user?.user_id
        const result = await paymentService.getOrderPaymentStatus(orderId, userId);
        return c.json({
            code: 200,
            message: '获取成功',
            data: result,
        });

    }

    /**
   * 获取用户订单列表
   */
    async getOrderList(c: Context) {
        const user = c.get('user');
        const userId = user?.user_id
        // 获取查询参数
        const query: OrderListQuery = {
            // page: parseInt(c.req.query('page') || '1'),
            // pageSize: parseInt(c.req.query('pageSize') || '10'),
            status: c.req.query('status') as OrderStatus,
            startDate: c.req.query('startDate'),
            endDate: c.req.query('endDate'),
            keyword: c.req.query('keyword'),
        };

        // 验证分页参数
        // if (query.page! < 1) query.page = 1;
        // if (query.pageSize! < 1 || query.pageSize! > 100) query.pageSize = 10;

        const result = await orderService.getUserOrders(userId, query);

        return c.json({
            code: 200,
            message: '获取成功',
            data: result,
        });
    }

    /**
     * 获取订单详情
     */
    async getOrderDetail(c: Context) {
        const orderId = c.req.param('id');
        if (!orderId) {
            throw new Error('订单ID不能为空');
        }

        const user = c.get('user');
        const userId = user?.user_id
        const result = await orderService.getOrderDetail(orderId, userId);

        return c.json({
            code: 200,
            message: '获取成功',
            data: result,
        });

    }

    /**
     * 获取订单统计信息
     */
    async getOrderStats(c: Context) {
        const user = c.get('user');
        const userId = user?.user_id
        const stats = await orderService.getOrderStats(userId);

        return c.json({
            code: 200,
            message: '获取成功',
            data: stats,
        });
    }

    async getSimpleOrders(c: Context) {
        const user = c.get('user');
        const userId = user?.user_id

        const orders = await orderService.getUserSimpleOrders(userId);

        return c.json({
            code: 200,
            message: '获取成功',
            data: {
                orders,
            },
        });
    }

    async deleteOrder(c: Context) {
        const user = c.get('user');
        const userId = user?.user_id
        const orderId = c.req.param('orderId');
        const count = orderService.deleteOrderService(userId,orderId)

        return c.json({
            code: 200,
            message: '删除成功',
            data: count,
        }, 200)
    }
}
