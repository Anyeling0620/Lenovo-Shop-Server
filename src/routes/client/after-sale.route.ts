// routes/client/after-sale.route.ts
import { Hono } from "hono";
import { jwtMiddleware } from "../../middleware/jwt.middleware";
import { AfterSaleController } from "../../controllers/client/after-sale.controller";
import { uploadMiddleware } from "../../middleware/upload.middleware";

const afterSale = new Hono();
const afterSaleController = new AfterSaleController();

// 申请售后（支持文件上传）
afterSale.post('/apply', jwtMiddleware, uploadMiddleware, afterSaleController.createAfterSale);

// 取消售后
afterSale.put('/cancel/:id', jwtMiddleware, afterSaleController.cancelAfterSale);

// 对完成的售后投诉（支持文件上传）
afterSale.post('/complaint', jwtMiddleware, uploadMiddleware, afterSaleController.createComplaint);

// 评价已完成订单里的商品（支持文件上传）
afterSale.post('/evaluation', jwtMiddleware, uploadMiddleware, afterSaleController.createEvaluation);

// 用户删除评价
afterSale.delete('/evaluation/:id', jwtMiddleware, afterSaleController.deleteEvaluation);

// 用户删除投诉
afterSale.delete('/complaint/:id', jwtMiddleware, afterSaleController.deleteComplaint);

// 对订单吐槽（支持文件上传）
afterSale.post('/comment', jwtMiddleware, uploadMiddleware, afterSaleController.createComment);

// 获取评价列表
afterSale.get('/evaluations', jwtMiddleware, afterSaleController.getEvaluations);

// 获取吐槽列表
afterSale.get('/comments', jwtMiddleware, afterSaleController.getComments);

// 获取售后列表
afterSale.get('/after-sales', jwtMiddleware, afterSaleController.getAfterSales);

// 获取投诉列表
afterSale.get('/complaints', jwtMiddleware, afterSaleController.getComplaints);

// 售后详情
afterSale.get('/after-sales/:id', jwtMiddleware, afterSaleController.getAfterSaleDetail);

export { afterSale };
