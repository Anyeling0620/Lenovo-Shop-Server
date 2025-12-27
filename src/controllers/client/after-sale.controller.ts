import { Context } from 'hono';
import {
    CreateAfterSaleDto,
    CreateCommentDto,
    CreateComplaintDto,
    CreateEvaluationDto,
    ListQueryDto
} from '../../types/client/after-sale.type';
import { AfterSaleService } from '../../services/client/after-sale.service';
import { getFormBody, getUploadedFiles } from '../../middleware/upload.middleware';

const afterSaleService = new AfterSaleService();

export class AfterSaleController {
    /**
     * 申请售后
     */
    async createAfterSale(c: Context) {
        const user = c.get('user');
        const userId = user?.user_id;

        // 从 context 获取文件信息和表单字段
        const uploadedFiles = getUploadedFiles(c);
        const body = getFormBody(c);

        console.log('上传的文件数量:', uploadedFiles.length);
        console.log('请求体:', body);

        // 验证必要字段
        if (!body.orderId || !body.orderItemId || !body.type || !body.reason) {
            return c.json({
                code: 400,
                message: '缺少必要参数: orderId, orderItemId, type, reason'
            }, 400);
        }

        // 构建DTO
        const dto: CreateAfterSaleDto = {
            orderId: body.orderId,
            orderItemId: body.orderItemId,
            type: body.type as any,
            reason: body.reason,
            remark: body.remark || '',
            images: uploadedFiles.map(file => `${file.filename}`)
        };

        console.log('DTO:', dto);

        const result = await afterSaleService.createAfterSale(userId, dto);

        return c.json({
            code: 200,
            message: '售后申请成功',
            data: {
                ...result,
                uploadedFiles: uploadedFiles.map(file => ({
                    originalName: file.originalname,
                    fileName: file.filename,
                    url: `/images/lenovo/${file.filename}`,
                    size: file.size,
                    type: file.mimetype
                }))
            },
        });
    }

    /**
     * 取消售后
     */
    async cancelAfterSale(c: Context) {
        const afterSaleId = c.req.param('id');
        const user = c.get('user');
        const userId = user?.user_id;
        const result = await afterSaleService.cancelAfterSale(userId, afterSaleId);

        return c.json({
            code: 200,
            message: '售后取消成功',
            data: result,
        });
    }

    /**
     * 对完成的售后投诉
     */
    async createComplaint(c: Context) {
        const user = c.get('user');
        const userId = user?.user_id;

        // 从 context 获取文件信息和表单字段
        const uploadedFiles = getUploadedFiles(c);
        const body = getFormBody(c);

        // 验证必要字段
        if (!body.afterSaleId || !body.content) {
            return c.json({
                code: 400,
                message: '缺少必要参数: afterSaleId, content'
            }, 400);
        }

        // 构建DTO
        const dto: CreateComplaintDto = {
            afterSaleId: body.afterSaleId,
            content: body.content,
            images: uploadedFiles.map(file => `${file.filename}`)
        };

        const result = await afterSaleService.createComplaint(userId, dto);

        return c.json({
            code: 200,
            message: '投诉提交成功',
            data: {
                ...result,
                uploadedFiles: uploadedFiles.map(file => ({
                    originalName: file.originalname,
                    fileName: file.filename,
                    url: `/images/lenovo/${file.filename}`,
                    size: file.size,
                    type: file.mimetype
                }))
            },
        });
    }

    /**
     * 评价已完成订单里的商品
     */
    async createEvaluation(c: Context) {
        const user = c.get('user');
        const userId = user?.user_id;

        // 从 context 获取文件信息和表单字段
        const uploadedFiles = getUploadedFiles(c);
        const body = getFormBody(c);

        console.log('上传文件数量:', uploadedFiles.length);
        console.log('表单字段:', body);

        // 验证必要字段
        if (!body.productId || !body.configId || !body.star) {
            return c.json({
                code: 400,
                message: '缺少必要参数: productId, configId, star'
            }, 400);
        }

        // 构建DTO
        const dto: CreateEvaluationDto = {
            productId: body.productId,
            configId: body.configId,
            star: parseFloat(body.star),
            content: body.content || '',
            images: uploadedFiles.map(file => `${file.filename}`)
        };

        console.log('构建的DTO:', dto);

        const result = await afterSaleService.createEvaluation(userId, dto);

        return c.json({
            code: 200,
            message: '评价提交成功',
            data: {
                ...result,
                uploadedFiles: uploadedFiles.map(file => ({
                    originalName: file.originalname,
                    fileName: file.filename,
                    url: `/images/lenovo/${file.filename}`,
                    size: file.size,
                    type: file.mimetype
                }))
            },
        });
    }

    /**
     * 用户删除评价
     */
    async deleteEvaluation(c: Context) {
        const evaluationId = c.req.param('id');
        const user = c.get('user');
        const userId = user?.user_id;
        const result = await afterSaleService.deleteEvaluation(userId, evaluationId);

        return c.json({
            code: 200,
            message: '评价删除成功',
            data: result,
        });
    }

    /**
     * 用户删除投诉
     */
    async deleteComplaint(c: Context) {
        const complaintId = c.req.param('id');
        const user = c.get('user');
        const userId = user?.user_id;
        const result = await afterSaleService.deleteComplaint(userId, complaintId);

        return c.json({
            code: 200,
            message: '投诉删除成功',
            data: result,
        });
    }

    /**
     * 对订单吐槽
     */
    async createComment(c: Context) {
        const user = c.get('user');
        const userId = user?.user_id;

        // 从 context 获取文件信息和表单字段
        const uploadedFiles = getUploadedFiles(c);
        const body = getFormBody(c);

        // 验证必要字段
        if (!body.orderId || !body.orderItemId || !body.content) {
            return c.json({
                code: 400,
                message: '缺少必要参数: orderId, orderItemId, content'
            }, 400);
        }

        // 构建DTO
        const dto: CreateCommentDto = {
            orderId: body.orderId,
            orderItemId: body.orderItemId,
            content: body.content,
            images: uploadedFiles.map(file => `${file.filename}`)
        };

        const result = await afterSaleService.createComment(userId, dto);

        return c.json({
            code: 200,
            message: '吐槽提交成功',
            data: {
                ...result,
                uploadedFiles: uploadedFiles.map(file => ({
                    originalName: file.originalname,
                    fileName: file.filename,
                    url: `/images/lenovo/${file.filename}`,
                    size: file.size,
                    type: file.mimetype
                }))
            },
        });
    }

    /**
     * 获取评价列表
     */
    async getEvaluations(c: Context) {
        const user = c.get('user');
        const userId = user?.user_id;
        const query = c.req.query() as ListQueryDto;
        const result = await afterSaleService.getEvaluations(userId, query);

        return c.json({
            code: 200,
            message: '获取评价列表成功',
            data: result,
        });
    }

    /**
     * 获取吐槽列表
     */
    async getComments(c: Context) {
        const user = c.get('user');
        const userId = user?.user_id;
        const query = c.req.query() as ListQueryDto;
        const result = await afterSaleService.getComments(userId, query);

        return c.json({
            code: 200,
            message: '获取吐槽列表成功',
            data: result,
        });
    }

    /**
     * 获取售后列表
     */
    async getAfterSales(c: Context) {
        const user = c.get('user');
        const userId = user?.user_id;
        const query = c.req.query() as ListQueryDto;
        const result = await afterSaleService.getAfterSales(userId, query);

        return c.json({
            code: 200,
            message: '获取售后列表成功',
            data: result,
        });
    }

    /**
     * 获取投诉列表
     */
    async getComplaints(c: Context) {
        const user = c.get('user');
        const userId = user?.user_id;
        const query = c.req.query() as ListQueryDto;
        const result = await afterSaleService.getComplaints(userId, query);

        return c.json({
            code: 200,
            message: '获取投诉列表成功',
            data: result,
        });
    }

    /**
     * 获取售后详情
     */
    async getAfterSaleDetail(c: Context) {
        const afterSaleId = c.req.param('id');
        const user = c.get('user');
        const userId = user?.user_id;
        const result = await afterSaleService.getAfterSaleDetail(userId, afterSaleId);

        return c.json({
            code: 200,
            message: '获取售后详情成功',
            data: result
        });
    }
}
