import { Context } from 'hono';
import {
    CreateAfterSaleDto,
    CreateCommentDto,
    CreateComplaintDto,
    CreateEvaluationDto,
    ListQueryDto
} from '../../types/client/after-sale.type';
import { AfterSaleService } from '../../services/client/after-sale.service';
import { getUploadedFiles } from '../../middleware/upload.middleware';

const afterSaleService = new AfterSaleService();



function getFilesFromRequest(req: any): Express.Multer.File[] {
    if (req.files && Array.isArray(req.files)) {
        return req.files;
    }
    return [];
}

export class AfterSaleController {
    /**
    * 申请售后
    */
    async createAfterSale(c: Context) {
        const body = await c.req.parseBody() as any;
        const user = c.get('user');
        const userId = user?.user_id;

        // 处理上传的文件
        const req = c.req.raw as any;
        const uploadedFiles = getUploadedFiles(req);

        // 构建DTO
        const dto: CreateAfterSaleDto = {
            orderId: body.orderId as string,
            orderItemId: body.orderItemId as string,
            type: body.type as any,
            reason: body.reason as string,
            remark: body.remark as string,
            // 存储相对路径，使用UUID文件名
            images: uploadedFiles.map(file => `${file.filename}`)
        };

        const result = await afterSaleService.createAfterSale(userId, dto);

        return c.json({
            code: 200,
            message: '售后申请成功',
            data: {
                ...result,
                uploadedFiles: uploadedFiles.map(file => ({
                    originalName: file.originalname,
                    fileName: file.filename,
                    url: `${file.filename}`,
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
        const body = await c.req.parseBody() as any;
        const user = c.get('user');
        const userId = user?.user_id;

        // 处理上传的文件
        const req = c.req.raw as any;
        const uploadedFiles = getUploadedFiles(req);

        // 构建DTO
        const dto: CreateComplaintDto = {
            afterSaleId: body.afterSaleId as string,
            content: body.content as string,
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
                    url: `${file.filename}`,
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
        const body = await c.req.parseBody() as any;
        const user = c.get('user');
        const userId = user?.user_id;

        // 处理上传的文件
        const req = c.req.raw as any;
        const uploadedFiles = getUploadedFiles(req);

        // 构建DTO
        const dto: CreateEvaluationDto = {
            productId: body.productId as string,
            configId: body.configId as string,
            star: parseFloat(body.star as string),
            content: body.content as string,
            images: uploadedFiles.map(file => `/user/${file.filename}`)
        };

        const result = await afterSaleService.createEvaluation(userId, dto);

        return c.json({
            code: 200,
            message: '评价提交成功',
            data: {
                ...result,
                uploadedFiles: uploadedFiles.map(file => ({
                    originalName: file.originalname,
                    fileName: file.filename,
                    url: `${file.filename}`,
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
        const body = await c.req.parseBody() as any;
        const user = c.get('user');
        const userId = user?.user_id;

        // 处理上传的文件
        const req = c.req.raw as any;
        const uploadedFiles = getUploadedFiles(req);

        // 构建DTO
        const dto: CreateCommentDto = {
            orderId: body.orderId as string,
            orderItemId: body.orderItemId as string,
            content: body.content as string,
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
                    url: `${file.filename}`,
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