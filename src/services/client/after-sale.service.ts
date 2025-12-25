import { AfterSaleStatus, ComplaintStatus, OrderStatus, CommentStatus, EvaluationStatus } from '@prisma/client';
import {
    AfterSaleDetail,
    ComplaintDetail,
    CreateAfterSaleDto,
    CreateCommentDto,
    CreateComplaintDto,
    CreateEvaluationDto,
    ListQueryDto,
    AfterSaleRecord,
    EvaluationBasic,
    CommentBasic,
    ComplaintBasic,
    AfterSaleListItem,
    EvaluationDetail,
    CommentDetail
} from '../../types/client/after-sale.type';
import { db } from '../../utils/db';
import { HTTPException } from 'hono/http-exception';

export class AfterSaleService {
    // 1. 申请售后
    async createAfterSale(userId: string, data: CreateAfterSaleDto): Promise<AfterSaleRecord> {
        // 验证订单是否存在且属于该用户
        const order = await db.order.findFirst({
            where: {
                id: data.orderId,
                userId,
                status: { in: [OrderStatus.已收货, OrderStatus.待收货, OrderStatus.已发货] }
            },
            include: {
                items: {
                    where: { id: data.orderItemId }
                }
            }
        });

        if (!order) {
            throw new HTTPException(404, { message: '订单不存在或无法申请售后' });
        }

        if (order.items.length === 0) {
            throw new HTTPException(404, { message: '订单商品不存在' });
        }

        // 检查是否已有售后申请
        const existingAfterSale = await db.afterSale.findFirst({
            where: {
                orderId: data.orderId,
                orderItemId: data.orderItemId,
                status: { not: AfterSaleStatus.已拒绝 }
            }
        });

        if (existingAfterSale) {
            throw new HTTPException(400, { message: '该商品已有售后申请' });
        }

        // 生成售后单号
        const afterSaleNo = `AS${Date.now()}${Math.random().toString().slice(2, 8)}`;

        // 创建售后记录
        const afterSale = await db.afterSale.create({
            data: {
                orderId: data.orderId,
                orderItemId: data.orderItemId,
                afterSaleNo,
                type: data.type,
                reason: data.reason,
                remark: data.remark,
                receiverProvince: order.provinceCode,
                receiverCity: order.cityCode,
                receiverArea: order.areaCode,
                receiverStreet: order.streetCode,
                receiverAddress: order.address,
                receiverRemark: order.remark,
                receiverName: order.receiver,
                receiverPhone: order.phone,
                images: data.images ? {
                    create: data.images.map(image => ({ image }))
                } : undefined
            },
            include: {
                images: true
            }
        });

        return afterSale;
    }

    // 2. 取消售后
    async cancelAfterSale(userId: string, afterSaleId: string): Promise<AfterSaleRecord> {
        const afterSale = await db.afterSale.findFirst({
            where: { id: afterSaleId, order: { userId } }
        });
        if (!afterSale) {
            throw new HTTPException(404, { message: '售后记录不存在' });
        }
        if (!['申请中', '已同意'].includes(afterSale.status)) {
            throw new HTTPException(400, { message: '当前状态无法取消售后' });
        }
        return db.afterSale.update({
            where: { id: afterSaleId },
            data: {
                status: AfterSaleStatus.已拒绝,
                rejectReason: '用户取消'
            },
            include: { images: true }
        });
    }

    // 3. 对完成的售后投诉
    async createComplaint(userId: string, data: CreateComplaintDto): Promise<ComplaintBasic> {
        // 验证售后是否存在且已完成
        const afterSale = await db.afterSale.findFirst({
            where: {
                id: data.afterSaleId,
                order: { userId },
                status: AfterSaleStatus.已完成
            }
        });

        if (!afterSale) {
            throw new HTTPException(404, { message: '售后记录不存在或未完成' });
        }

        // 检查是否已有投诉
        const existingComplaint = await db.afterSaleComplaint.findFirst({
            where: {
                afterSaleId: data.afterSaleId,
                userId,
                status: ComplaintStatus.正常
            }
        });

        if (existingComplaint) {
            throw new HTTPException(400, { message: '已对该售后进行投诉' });
        }

        const complaint = await db.afterSaleComplaint.create({
            data: {
                userId,
                afterSaleId: data.afterSaleId,
                content: data.content,
                images: data.images ? {
                    create: data.images.map(image => ({ image }))
                } : undefined
            },
            include: {
                images: true
            }
        });

        return complaint;
    }

    // 4. 评价已完成订单里的商品
    async createEvaluation(userId: string, data: CreateEvaluationDto): Promise<EvaluationBasic> {
        // 验证用户是否购买过该商品
        const orderItem = await db.orderItem.findFirst({
            where: {
                productId: data.productId,
                configId: data.configId,
                order: {
                    userId,
                    status: OrderStatus.已收货
                }
            }
        });

        if (!orderItem) {
            throw new HTTPException(404, { message: '未找到符合条件的订单商品' });
        }

        // 检查是否已评价
        const existingEvaluation = await db.productEvaluation.findFirst({
            where: {
                userId,
                productId: data.productId,
                configId: data.configId,
                status: EvaluationStatus.正常
            }
        });

        if (existingEvaluation) {
            throw new HTTPException(400, { message: '已对该商品进行评价' });
        }

        // 验证星星数
        if (data.star < 0.5 || data.star > 5 || data.star % 0.5 !== 0) {
            throw new HTTPException(400, { message: '评分必须在0.5-5之间，且为0.5的倍数' });
        }

        const evaluation = await db.productEvaluation.create({
            data: {
                userId,
                productId: data.productId,
                configId: data.configId,
                star: data.star,
                content: data.content,
                images: data.images ? {
                    create: data.images.map(image => ({ image }))
                } : undefined
            },
            include: {
                images: true
            }
        });
        const evaluation1 = { ...evaluation, star: Number(evaluation.star) }

        return evaluation1;
    }

    // 5. 用户删除评价
    async deleteEvaluation(userId: string, evaluationId: string) {
        const evaluation = await db.productEvaluation.findFirst({
            where: {
                id: evaluationId,
                userId
            }
        });

        if (!evaluation) {
            throw new HTTPException(404, { message: '评价不存在' });
        }

        const updated = await db.productEvaluation.update({
            where: { id: evaluationId },
            data: {
                status: EvaluationStatus.用户删除
            },
            include: { images: true }
        });

        return updated;
    }

    // 6. 用户删除投诉
    async deleteComplaint(userId: string, complaintId: string) {
        const complaint = await db.afterSaleComplaint.findFirst({
            where: {
                id: complaintId,
                userId
            }
        });

        if (!complaint) {
            throw new HTTPException(404, { message: '投诉不存在' });
        }

        const updated = await db.afterSaleComplaint.update({
            where: { id: complaintId },
            data: {
                status: ComplaintStatus.用户删除
            },
            include: { images: true }
        });

        return updated;
    }

    // 7. 对订单吐槽
    async createComment(userId: string, data: CreateCommentDto): Promise<CommentBasic> {
        // 验证订单是否存在且属于该用户
        const order = await db.order.findFirst({
            where: {
                id: data.orderId,
                userId,
                status: OrderStatus.已收货
            },
            include: {
                items: {
                    where: { id: data.orderItemId }
                }
            }
        });

        if (!order) {
            throw new HTTPException(404, { message: '订单不存在或未完成' });
        }

        if (order.items.length === 0) {
            throw new HTTPException(404, { message: '订单商品不存在' });
        }

        // 检查是否已有吐槽
        const existingComment = await db.comment.findFirst({
            where: {
                orderId: data.orderId,
                orderItemId: data.orderItemId,
                userId,
                status: CommentStatus.正常
            }
        });

        if (existingComment) {
            throw new HTTPException(400, { message: '已对该订单商品进行吐槽' });
        }

        const comment = await db.comment.create({
            data: {
                userId,
                orderId: data.orderId,
                orderItemId: data.orderItemId,
                content: data.content,
                images: data.images ? {
                    create: data.images.map(image => ({ image }))
                } : undefined
            },
            include: {
                images: true
            }
        });

        return comment;
    }

    // 8. 返回评价列表（详细数据）
    async getEvaluations(userId: string, query: ListQueryDto): Promise<EvaluationDetail[]> {
        const where: any = {
            userId,
            status: EvaluationStatus.正常
        };

        if (query.productId) {
            where.productId = query.productId;
        }

        const evaluations = await db.productEvaluation.findMany({
            where,
            include: {
                images: true,
                product: {
                    include: {
                        brand: { select: { id: true, name: true } },
                        category: { select: { id: true, name: true } }
                    }
                },
                config: {
                    select: {
                        id: true,
                        config1: true,
                        config2: true,
                        config3: true,
                        salePrice: true,
                        originalPrice: true,
                        configImage: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        const results: EvaluationDetail[] = evaluations.map(e => ({
            id: e.id,
            userId: e.userId,
            productId: e.productId,
            configId: e.configId,
            star: Number(e.star),
            content: e.content ?? '',
            status: e.status,
            createdAt: e.createdAt,
            updatedAt: e.updatedAt,
            images: e.images.map(img => ({ id: img.id, image: img.image })),
            product: {
                id: e.product.id,
                name: e.product.name,
                mainImage: e.product.mainImage,
                brand: e.product.brand ? { id: e.product.brand.id, name: e.product.brand.name } : null,
                category: e.product.category ? { id: e.product.category.id, name: e.product.category.name } : null,
            },
            config: {
                id: e.config.id,
                config1: e.config.config1,
                config2: e.config.config2,
                config3: e.config.config3,
                salePrice: Number(e.config.salePrice),
                originalPrice: Number(e.config.originalPrice),
                configImage: e.config.configImage,
            }
        }));

        return results;
    }

    // 9. 返回吐槽列表（详细数据）
    async getComments(userId: string, query: ListQueryDto): Promise<CommentDetail[]> {
        const where: any = {
            userId,
            status: CommentStatus.正常
        };

        if (query.orderId) {
            where.orderId = query.orderId;
        }

        const comments = await db.comment.findMany({
            where,
            include: {
                images: true,
                order: {
                    select: {
                        id: true,
                        orderNo: true,
                        status: true,
                        actualPayAmount: true,
                        createdAt: true
                    }
                },
                orderItem: {
                    select: {
                        id: true,
                        nameSnapshot: true,
                        config1Snapshot: true,
                        config2Snapshot: true,
                        config3Snapshot: true,
                        quantity: true,
                        priceSnapshot: true,
                        productId: true,
                        configId: true,
                        product: {
                            select: {
                                id: true,
                                name: true,
                                mainImage: true
                            }
                        },
                        config: {
                            select: {
                                id: true,
                                config1: true,
                                config2: true,
                                config3: true,
                                salePrice: true,
                                originalPrice: true,
                                configImage: true
                            }
                        }
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        const results: CommentDetail[] = comments.map((c) => ({
            id: c.id,
            userId: c.userId,
            orderId: c.orderId,
            orderItemId: c.orderItemId,
            content: c.content,
            status: c.status,
            createdAt: c.createdAt,
            updatedAt: c.updatedAt,
            images: c.images.map(img => ({ id: img.id, image: img.image })),
            order: {
                id: c.order.id,
                orderNo: c.order.orderNo,
                status: c.order.status,
                actualPayAmount: Number(c.order.actualPayAmount),
                createdAt: c.order.createdAt
            },
            orderItem: {
                id: c.orderItem.id,
                productName: c.orderItem.nameSnapshot,
                configName: [c.orderItem.config1Snapshot, c.orderItem.config2Snapshot, c.orderItem.config3Snapshot].filter(Boolean).join(' '),
                quantity: c.orderItem.quantity,
                price: Number(c.orderItem.priceSnapshot),
                productId: c.orderItem.productId,
                configId: c.orderItem.configId,
                product: {
                    id: c.orderItem.product.id,
                    name: c.orderItem.product.name,
                    mainImage: c.orderItem.product.mainImage,
                },
                config: {
                    id: c.orderItem.config.id,
                    config1: c.orderItem.config.config1,
                    config2: c.orderItem.config.config2,
                    config3: c.orderItem.config.config3,
                    salePrice: Number(c.orderItem.config.salePrice),
                    originalPrice: Number(c.orderItem.config.originalPrice),
                    configImage: c.orderItem.config.configImage ?? null,
                }
            }
        }));

        return results;
    }

    // 10. 返回售后列表（详细数据）
    async getAfterSales(userId: string, query: ListQueryDto): Promise<AfterSaleListItem[]> {
        const where: any = {
            order: { userId }
        };

        if (query.status) {
            where.status = query.status as AfterSaleStatus | string;
        }

        if (query.orderId) {
            where.orderId = query.orderId;
        }

        const afterSales = await db.afterSale.findMany({
            where,
            include: {
                order: {
                    select: {
                        id: true,
                        orderNo: true,
                        status: true,
                        actualPayAmount: true,
                        createdAt: true,
                        payTime: true,
                        receiver: true,
                        phone: true,
                        address: true
                    }
                },
                orderItem: {
                    select: {
                        id: true,
                        nameSnapshot: true,
                        config1Snapshot: true,
                        config2Snapshot: true,
                        config3Snapshot: true,
                        quantity: true,
                        priceSnapshot: true,
                        productId: true,
                        configId: true,
                        product: {
                            select: {
                                id: true,
                                name: true,
                                mainImage: true
                            }
                        },
                        config: {
                            select: {
                                id: true,
                                config1: true,
                                config2: true,
                                config3: true,
                                salePrice: true,
                                originalPrice: true,
                                configImage: true
                            }
                        }
                    }
                }
            },
            orderBy: { applyTime: 'desc' }
        });

        const results: AfterSaleListItem[] = afterSales.map((a) => ({
            id: a.id,
            orderId: a.orderId,
            orderItemId: a.orderItemId,
            afterSaleNo: a.afterSaleNo,
            type: a.type,
            reason: a.reason,
            remark: a.remark,
            status: a.status,
            rejectReason: a.rejectReason,
            applyTime: a.applyTime,
            completeTime: a.completeTime,
            order: {
                id: a.order.id,
                orderNo: a.order.orderNo,
                status: a.order.status,
                actualPayAmount: Number(a.order.actualPayAmount),
                createdAt: a.order.createdAt,
                payTime: a.order.payTime,
                receiver: a.order.receiver,
                phone: a.order.phone,
                address: a.order.address,
            },
            orderItem: {
                id: a.orderItem.id,
                productName: a.orderItem.nameSnapshot,
                configName: [a.orderItem.config1Snapshot, a.orderItem.config2Snapshot, a.orderItem.config3Snapshot].filter(Boolean).join(' '),
                quantity: a.orderItem.quantity,
                price: Number(a.orderItem.priceSnapshot),
                productId: a.orderItem.productId,
                configId: a.orderItem.configId,
                product: {
                    id: a.orderItem.product.id,
                    name: a.orderItem.product.name,
                    mainImage: a.orderItem.product.mainImage,
                },
                config: {
                    id: a.orderItem.config.id,
                    config1: a.orderItem.config.config1,
                    config2: a.orderItem.config.config2,
                    config3: a.orderItem.config.config3,
                    salePrice: Number(a.orderItem.config.salePrice),
                    originalPrice: Number(a.orderItem.config.originalPrice),
                    configImage: a.orderItem.config.configImage ?? null,
                }
            }
        }));

        return results;
    }

    // 11. 返回投诉列表（详细数据）
    async getComplaints(userId: string, query: ListQueryDto): Promise<ComplaintDetail[]> {
        const where: any = {
            userId,
            status: ComplaintStatus.正常
        };

        if (query.orderId) {
            where.afterSale = {
                orderId: query.orderId
            };
        }

        const complaints = await db.afterSaleComplaint.findMany({
            where,
            include: {
                images: true,
                afterSale: {
                    select: {
                        id: true,
                        afterSaleNo: true,
                        type: true,
                        status: true,
                        reason: true,
                        applyTime: true,
                        order: {
                            select: {
                                id: true,
                                orderNo: true,
                                status: true,
                                actualPayAmount: true
                            }
                        },
                        orderItem: {
                            select: {
                                id: true,
                                nameSnapshot: true,
                                config1Snapshot: true,
                                config2Snapshot: true,
                                config3Snapshot: true,
                                quantity: true,
                                priceSnapshot: true,
                                productId: true,
                                configId: true,
                                product: {
                                    select: {
                                        id: true,
                                        name: true,
                                        mainImage: true
                                    }
                                },
                                config: {
                                    select: {
                                        id: true,
                                        config1: true,
                                        config2: true,
                                        config3: true,
                                        salePrice: true,
                                        originalPrice: true,
                                        configImage: true
                                    }
                                }
                            }
                        }
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        const results: ComplaintDetail[] = complaints.map((cp) => ({
            id: cp.id,
            userId: cp.userId,
            afterSaleId: cp.afterSaleId,
            content: cp.content,
            status: cp.status,
            createdAt: cp.createdAt,
            updatedAt: cp.updatedAt,
            images: cp.images.map(img => ({ id: img.id, image: img.image })),
            afterSale: {
                id: cp.afterSale.id,
                afterSaleNo: cp.afterSale.afterSaleNo,
                type: cp.afterSale.type,
                status: cp.afterSale.status,
                reason: cp.afterSale.reason,
                applyTime: cp.afterSale.applyTime,
                order: {
                    id: cp.afterSale.order.id,
                    orderNo: cp.afterSale.order.orderNo,
                    status: cp.afterSale.order.status,
                    actualPayAmount: Number(cp.afterSale.order.actualPayAmount),
                },
                orderItem: {
                    id: cp.afterSale.orderItem.id,
                    productName: cp.afterSale.orderItem.nameSnapshot,
                    configName: [cp.afterSale.orderItem.config1Snapshot, cp.afterSale.orderItem.config2Snapshot, cp.afterSale.orderItem.config3Snapshot].filter(Boolean).join(' '),
                    quantity: cp.afterSale.orderItem.quantity,
                    price: Number(cp.afterSale.orderItem.priceSnapshot),
                    productId: cp.afterSale.orderItem.productId,
                    configId: cp.afterSale.orderItem.configId,
                    product: {
                        id: cp.afterSale.orderItem.product.id,
                        name: cp.afterSale.orderItem.product.name,
                        mainImage: cp.afterSale.orderItem.product.mainImage,
                    },
                    config: {
                        id: cp.afterSale.orderItem.config.id,
                        config1: cp.afterSale.orderItem.config.config1,
                        config2: cp.afterSale.orderItem.config.config2,
                        config3: cp.afterSale.orderItem.config.config3,
                        salePrice: Number(cp.afterSale.orderItem.config.salePrice),
                        originalPrice: Number(cp.afterSale.orderItem.config.originalPrice),
                        configImage: cp.afterSale.orderItem.config.configImage ?? null,
                    }
                }
            }
        }));
        return results;
    }

    /**
  * 12. 获取售后详情
  */
    async getAfterSaleDetail(userId: string, afterSaleId: string): Promise<AfterSaleDetail> {
        const afterSale = await db.afterSale.findFirst({
            where: {
                id: afterSaleId,
                order: { userId }
            },
            include: {
                images: {
                    select: {
                        id: true,
                        image: true,
                        createdAt: true
                    }
                },
                order: {
                    select: {
                        id: true,
                        orderNo: true,
                        status: true,
                        actualPayAmount: true,
                        createdAt: true,
                        payTime: true,
                        receiver: true,
                        phone: true,
                        address: true,
                        provinceCode: true,
                        cityCode: true,
                        areaCode: true,
                        streetCode: true,
                        remark: true
                    }
                },
                orderItem: {
                    select: {
                        id: true,
                        nameSnapshot: true,
                        config1Snapshot: true,
                        config2Snapshot: true,
                        config3Snapshot: true,
                        quantity: true,
                        priceSnapshot: true,
                        productId: true,
                        configId: true,
                        product: {
                            select: {
                                id: true,
                                name: true,
                                mainImage: true,
                                brand: {
                                    select: {
                                        id: true,
                                        name: true
                                    }
                                },
                                category: {
                                    select: {
                                        id: true,
                                        name: true
                                    }
                                }
                            }
                        },
                        config: {
                            select: {
                                id: true,
                                config1: true,
                                config2: true,
                                config3: true,
                                salePrice: true,
                                originalPrice: true,
                                configImage: true
                            }
                        }
                    }
                },
                complaints: {
                    where: {
                        status: ComplaintStatus.正常
                    },
                    include: {
                        images: {
                            select: {
                                id: true,
                                image: true,
                                createdAt: true
                            }
                        }
                    }
                }
            }
        });

        if (!afterSale) {
            throw new HTTPException(404, { message: '售后记录不存在' });
        }

        // 获取投诉关联的售后信息
        const complaintDetails: ComplaintDetail[] = [];

        for (const complaint of afterSale.complaints) {
            // 为每个投诉获取关联的售后信息
            const complaintAfterSale = await db.afterSale.findFirst({
                where: { id: complaint.afterSaleId },
                include: {
                    order: {
                        select: {
                            id: true,
                            orderNo: true,
                            status: true,
                            actualPayAmount: true
                        }
                    },
                    orderItem: {
                        select: {
                            id: true,
                            nameSnapshot: true,
                            config1Snapshot: true,
                            config2Snapshot: true,
                            config3Snapshot: true,
                            quantity: true,
                            priceSnapshot: true,
                            productId: true,
                            configId: true,
                            product: {
                                select: {
                                    id: true,
                                    name: true,
                                    mainImage: true
                                }
                            },
                            config: {
                                select: {
                                    id: true,
                                    config1: true,
                                    config2: true,
                                    config3: true,
                                    salePrice: true,
                                    originalPrice: true,
                                    configImage: true
                                }
                            }
                        }
                    }
                }
            });

            if (complaintAfterSale) {
                const complaintDetail: ComplaintDetail = {
                    id: complaint.id,
                    userId: complaint.userId,
                    afterSaleId: complaint.afterSaleId,
                    content: complaint.content,
                    status: complaint.status,
                    createdAt: complaint.createdAt,
                    updatedAt: complaint.updatedAt,
                    images: complaint.images.map(img => ({
                        id: img.id,
                        image: img.image,
                        createdAt: img.createdAt
                    })),
                    afterSale: {
                        id: complaintAfterSale.id,
                        afterSaleNo: complaintAfterSale.afterSaleNo,
                        type: complaintAfterSale.type,
                        status: complaintAfterSale.status,
                        reason: complaintAfterSale.reason,
                        applyTime: complaintAfterSale.applyTime,
                        order: {
                            id: complaintAfterSale.order.id,
                            orderNo: complaintAfterSale.order.orderNo,
                            status: complaintAfterSale.order.status,
                            actualPayAmount: Number(complaintAfterSale.order.actualPayAmount)
                        },
                        orderItem: {
                            id: complaintAfterSale.orderItem.id,
                            productName: complaintAfterSale.orderItem.nameSnapshot,
                            configName: [complaintAfterSale.orderItem.config1Snapshot, complaintAfterSale.orderItem.config2Snapshot, complaintAfterSale.orderItem.config3Snapshot].filter(Boolean).join(' '),
                            quantity: complaintAfterSale.orderItem.quantity,
                            price: Number(complaintAfterSale.orderItem.priceSnapshot),
                            productId: complaintAfterSale.orderItem.productId,
                            configId: complaintAfterSale.orderItem.configId,
                            product: {
                                id: complaintAfterSale.orderItem.product.id,
                                name: complaintAfterSale.orderItem.product.name,
                                mainImage: complaintAfterSale.orderItem.product.mainImage
                            },
                            config: {
                                id: complaintAfterSale.orderItem.config.id,
                                config1: complaintAfterSale.orderItem.config.config1,
                                config2: complaintAfterSale.orderItem.config.config2,
                                config3: complaintAfterSale.orderItem.config.config3,
                                salePrice: Number(complaintAfterSale.orderItem.config.salePrice),
                                originalPrice: Number(complaintAfterSale.orderItem.config.originalPrice),
                                configImage: complaintAfterSale.orderItem.config.configImage ?? null,
                            }
                        }
                    }
                };
                complaintDetails.push(complaintDetail);
            }
        }

        // 转换数据格式
        const result: AfterSaleDetail = {
            id: afterSale.id,
            orderId: afterSale.orderId,
            orderItemId: afterSale.orderItemId,
            afterSaleNo: afterSale.afterSaleNo,
            type: afterSale.type,
            reason: afterSale.reason,
            remark: afterSale.remark,
            status: afterSale.status,
            rejectReason: afterSale.rejectReason,
            receiverProvince: afterSale.receiverProvince,
            receiverCity: afterSale.receiverCity,
            receiverArea: afterSale.receiverArea,
            receiverStreet: afterSale.receiverStreet,
            receiverAddress: afterSale.receiverAddress,
            receiverRemark: afterSale.receiverRemark,
            receiverName: afterSale.receiverName,
            receiverPhone: afterSale.receiverPhone,
            applyTime: afterSale.applyTime,
            completeTime: afterSale.completeTime,
            createdAt: afterSale.applyTime,
            images: afterSale.images.map(img => ({
                id: img.id,
                image: img.image,
                createdAt: img.createdAt
            })),
            order: {
                id: afterSale.order.id,
                orderNo: afterSale.order.orderNo,
                status: afterSale.order.status,
                actualPayAmount: Number(afterSale.order.actualPayAmount),
                createdAt: afterSale.order.createdAt,
                payTime: afterSale.order.payTime,
                receiver: afterSale.order.receiver,
                phone: afterSale.order.phone,
                address: afterSale.order.address
            },
            orderItem: {
                id: afterSale.orderItem.id,
                productName: afterSale.orderItem.nameSnapshot,
                configName: [afterSale.orderItem.config1Snapshot, afterSale.orderItem.config2Snapshot, afterSale.orderItem.config3Snapshot].filter(Boolean).join(' '),
                quantity: afterSale.orderItem.quantity,
                price: Number(afterSale.orderItem.priceSnapshot),
                productId: afterSale.orderItem.productId,
                configId: afterSale.orderItem.configId,
                product: {
                    id: afterSale.orderItem.product.id,
                    name: afterSale.orderItem.product.name,
                    mainImage: afterSale.orderItem.product.mainImage,
                    brand: afterSale.orderItem.product.brand ? { id: afterSale.orderItem.product.brand.id, name: afterSale.orderItem.product.brand.name } : null,
                    category: afterSale.orderItem.product.category ? { id: afterSale.orderItem.product.category.id, name: afterSale.orderItem.product.category.name } : null,
                },
                config: {
                    id: afterSale.orderItem.config.id,
                    config1: afterSale.orderItem.config.config1,
                    config2: afterSale.orderItem.config.config2,
                    config3: afterSale.orderItem.config.config3,
                    salePrice: Number(afterSale.orderItem.config.salePrice),
                    originalPrice: Number(afterSale.orderItem.config.originalPrice),
                    configImage: afterSale.orderItem.config.configImage
                }
            },
            complaints: complaintDetails
        };

        return result;
    }
}
