import { Hono } from "hono";
import { jwtMiddleware } from "../../middleware/jwt.middleware";
import { OrderController } from "../../controllers/client/order.controller";

const order = new Hono()
const orderController = new OrderController();

order.post('/create',jwtMiddleware,orderController.createOrder)

order.post('/cancel',jwtMiddleware,orderController.cancelOrder)

order.post('/pay/voucher',jwtMiddleware,orderController.payWithVoucher)

order.post('/payment/status',jwtMiddleware,orderController.getPaymentStatus)

order.get('/list',jwtMiddleware, orderController.getSimpleOrders)

order.get('/order-detail/:id', jwtMiddleware,orderController.getOrderDetail )

order.get('/stats', jwtMiddleware,orderController.getOrderStats )

order.get('/list/query',jwtMiddleware,orderController.getOrderList)

order.delete('/delete-order/:orderId',jwtMiddleware,orderController.deleteOrder)

export default order

