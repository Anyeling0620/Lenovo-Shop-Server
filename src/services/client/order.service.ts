import { CreateOrderInput, OrderDetailResponse, OrderItemInput, OrderItemSummary, OrderListItem, OrderListQuery, OrderListResponse, OrderResponse, OrderStats, SimpleOrderItem } from '../../types/client/order.type';
import { HTTPException } from 'hono/http-exception';
import { db } from '../../utils/db';
import { log } from 'console';

export class OrderService {
    /**
     * 创建订单
     */
    async createOrder(input: CreateOrderInput): Promise<OrderResponse> {
        // 1. 验证秒杀订单规则
        if (input.seckill) {
            if (input.items.length !== 1) {
                throw new HTTPException(400, { message: '秒杀订单只能包含一个商品' });
            }
            if (input.items[0].quantity !== 1) {
                throw new HTTPException(400, { message: '秒杀商品数量必须为1' });
            }
            if (!input.items[0].seckillRoundId) {
                throw new HTTPException(400, { message: '秒杀订单必须指定秒杀轮次' });
            }
        }

        // 2. 验证优惠券规则
        if (input.couponIds.length > 0) {
            await this.validateCoupons(input.couponIds, input.userId);
        }

        // 3. 验证收货地址
        const address = await db.receiptAddress.findFirst({
            where: {
                id: input.addressId,
                userId: input.userId,
            },
        });

        if (!address) {
            throw new HTTPException(404, { message: '收货地址不存在' });
        }

        // 4. 验证商品和库存
        const productDetails = await this.validateProducts(input.items, input.seckill);

        // 5. 计算价格
        const priceResult = await this.calculatePrice(
            productDetails,
            input.couponIds,
            input.userId,
            input.seckill
        );

        // 6. 生成订单号
        const orderNo = this.generateOrderNo();

        // 7. 创建订单（使用事务）
        const order = await db.$transaction(async (tx) => {
            // 锁定库存
            await this.lockStock(tx, productDetails, input.seckill);

            // 创建订单
            const order = await tx.order.create({
                data: {
                    userId: input.userId,
                    orderNo,
                    status: '待支付',
                    payAmount: priceResult.totalAmount,
                    actualPayAmount: priceResult.finalAmount,
                    provinceCode: address.provinceCode,
                    cityCode: address.cityCode,
                    areaCode: address.areaCode,
                    streetCode: address.streetCode,
                    address: address.address,
                    receiver: address.receiver,
                    phone: address.phone,
                    payLimitTime: new Date(Date.now() + 30 * 60 * 1000), // 30分钟支付限制
                },
            });

            // 创建订单商品项
            await Promise.all(
                productDetails.map(async (item) => {
                    const product = await tx.product.findUnique({
                        where: { id: item.productId },
                        include: { configs: { where: { id: item.configId } } },
                    });

                    const config = product?.configs[0];
                    if (!config) throw new HTTPException(404, { message: '商品配置不存在' });

                    await tx.orderItem.create({
                        data: {
                            orderId: order.id,
                            productId: item.productId,
                            configId: item.configId,
                            quantity: item.quantity,
                            priceSnapshot: config.salePrice,
                            discountSnapshot: item.discount || 0,
                            payAmountSnapshot: item.finalPrice,
                            seckill: input.seckill,
                            nameSnapshot: product.name,
                            imageSnapshot: product.mainImage || '',
                            config1Snapshot: config.config1,
                            config2Snapshot: config.config2,
                            config3Snapshot: config.config3 || '',
                        },
                    });
                })
            );

            // 标记优惠券为使用中
            if (input.couponIds.length > 0) {
                await Promise.all(
                    input.couponIds.map((couponId) =>
                        tx.userCoupon.updateMany({
                            where: {
                                userId: input.userId,
                                id: couponId,
                                status: '未使用',
                            },
                            data: {
                                status: '已使用',
                                orderId: order.id,
                                actualAmount: priceResult.couponDiscount,
                                useTime: new Date(), // 记录使用时间
                            },
                        })
                    )
                );
            }

            return order;
        });

        // 8. 返回订单详情
        const orderItems = await db.orderItem.findMany({
            where: { orderId: order.id },
            include: { product: true, config: true },
        });

        return {
            orderId: order.id,
            orderNo: order.orderNo,
            payAmount: Number(order.payAmount),
            actualPayAmount: Number(order.actualPayAmount),
            status: order.status,
            items: orderItems.map((item) => ({
                productId: item.productId,
                productName: item.nameSnapshot,
                config1: item.config1Snapshot,
                config2: item.config2Snapshot,
                config3: item.config3Snapshot!,
                quantity: item.quantity,
                price: Number(item.priceSnapshot),
                discount: Number(item.discountSnapshot),
                payAmount: Number(item.payAmountSnapshot),
            })),
            createdAt: order.createdAt,
            payLimitTime: order.payLimitTime,
        };
    }

    /**
 * 确认收货
 */
    async confirmReceipt(orderId: string, userId: string): Promise<void> {
        // 1. 验证订单
        const order = await db.order.findFirst({
            where: {
                id: orderId,
                userId,
                isVisible: true,
            },
            include: {
                items: true, // 需要获取订单商品项
            },
        });

        if (!order) {
            throw new HTTPException(404, { message: '订单不存在' });
        }

        // 2. 检查订单状态
        if (order.status !== '待收货') {
            throw new HTTPException(400, {
                message: `只有"待收货"的订单可以确认收货，当前状态为"${order.status}"`
            });
        }

        // 4. 更新订单状态并清除锁库存（使用事务）
        await db.$transaction(async (tx) => {
            // 更新订单状态
            const now = new Date();
            await tx.order.update({
                where: { id: orderId },
                data: {
                    status: '已收货',
                    receiveTime: now,
                    completeTime: now, // 同时标记为完成
                },
            });

            // 5. 清除锁库存（真正减少库存）
            for (const item of order.items) {
                if (item.seckill) {
                    // 秒杀商品：清除锁库存，减少剩余库存
                    await tx.seckillProductConfig.updateMany({
                        where: {
                            configId: item.configId,
                        },
                        data: {
                            lockNum: { decrement: item.quantity },
                            // 注意：这里不需要再减少 remainNum，因为支付时已经减少了
                        },
                    });
                } else {
                    // 普通商品：清除锁库存，减少上架库存
                    await tx.shelfProductItem.updateMany({
                        where: {
                            productId: item.productId,
                            configId: item.configId,
                        },
                        data: {
                            lockNum: { decrement: item.quantity },
                            // 注意：这里不需要再减少 shelfNum，因为支付时已经减少了
                        },
                    });
                }
            }
        });
    }

    /**
     * 取消订单
     */
    async cancelOrder(orderId: string, userId: string): Promise<void> {
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
            throw new HTTPException(400, { message: '只有待支付订单可以取消' });
        }

        await db.$transaction(async (tx) => {
            // 更新订单状态
            await tx.order.update({
                where: { id: orderId },
                data: {
                    status: '已取消',
                    cancelTime: new Date(),
                },
            });

            // 释放库存
            const orderItems = await tx.orderItem.findMany({
                where: { orderId },
            });

            for (const item of orderItems) {
                if (item.seckill) {
                    await tx.seckillProductConfig.updateMany({
                        where: {
                            configId: item.configId,
                        },
                        data: {
                            lockNum: { decrement: item.quantity },
                        },
                    });
                } else {
                    await tx.shelfProductItem.updateMany({
                        where: {
                            configId: item.configId,
                        },
                        data: {
                            lockNum: { decrement: item.quantity },
                        },
                    });
                }
            }

            // 恢复优惠券
            await tx.userCoupon.updateMany({
                where: {
                    orderId,
                    status: '已使用',
                },
                data: {
                    status: '未使用',
                    orderId: null,
                    actualAmount: 0,
                },
            });
        });
    }

    /**
     * 验证优惠券
     */
    private async validateCoupons(couponIds: string[], userId: string): Promise<void> {
        if (couponIds.length === 0) return;

        // 获取优惠券详情
        const userCoupons = await db.userCoupon.findMany({
            where: {
                id: { in: couponIds },
                userId,
                status: '未使用',
            },
            include: { coupon: true },
        });

        if (userCoupons.length !== couponIds.length) {
            throw new HTTPException(400, { message: '部分优惠券不存在或不可用' });
        }

        // 检查优惠券是否过期
        const now = new Date();
        for (const userCoupon of userCoupons) {
            if (now < userCoupon.coupon.startTime || now > userCoupon.coupon.expireTime) {
                throw new HTTPException(400, { message: `优惠券 ${userCoupon.coupon.name} 不在有效期内` });
            }
        }

        // 检查优惠券类型规则
        const couponTypes = userCoupons.map((uc) => uc.coupon.type);
        const hasDiscountCoupon = couponTypes.includes('折扣');
        const hasFullReductionCoupon = couponTypes.includes('满减');

        if (hasDiscountCoupon && hasFullReductionCoupon) {
            throw new HTTPException(400, { message: '折扣券不能和满减券混用' });
        }

        if (hasDiscountCoupon && couponIds.length > 1) {
            throw new HTTPException(400, { message: '折扣券不能多张使用' });
        }

        // 检查叠加规则
        if (couponIds.length > 1) {
            const allStackable = userCoupons.every((uc) => uc.coupon.isStackable);
            if (!allStackable) {
                throw new HTTPException(400, { message: '非叠加优惠券不能同时使用' });
            }
        }
    }

    /**
     * 验证商品和库存
     */
    private async validateProducts(
        items: OrderItemInput[],
        isSeckill: boolean
    ): Promise<any[]> {
        const results = [];

        for (const item of items) {
            if (isSeckill) {
                // 验证秒杀商品
                const seckillConfig = await db.seckillProductConfig.findFirst({
                    where: {
                        seckillProduct: {
                            roundId: item.seckillRoundId,
                        },
                        configId: item.configId,
                        status: '正常',
                    },
                    include: {
                        seckillProduct: true,
                        config: true,
                    },
                });

                if (!seckillConfig) {
                    throw new HTTPException(404, { message: '秒杀商品不存在或已下架' });
                }

                if (seckillConfig.remainNum - seckillConfig.lockNum < item.quantity) {
                    throw new HTTPException(400, { message: '秒杀商品库存不足' });
                }

                results.push({
                    productId: item.productId,
                    configId: item.configId,
                    quantity: item.quantity,
                    price: Number(seckillConfig.seckillPrice),
                    discount: Number(seckillConfig.config.originalPrice) - Number(seckillConfig.seckillPrice),
                    finalPrice: Number(seckillConfig.seckillPrice),
                    seckillRoundId: item.seckillRoundId,
                });
            } else {
                // 验证普通商品
                const shelfItem = await db.shelfProductItem.findFirst({
                    where: {
                        productId: item.productId,
                        configId: item.configId,
                        shelfProduct: {
                            status: '在售',
                        },
                    },
                    include: {
                        config: true,
                        shelfProduct: true,
                    },
                });

                if (!shelfItem) {
                    throw new HTTPException(404, { message: '商品不存在或已下架' });
                }

                if (shelfItem.shelfNum - shelfItem.lockNum < item.quantity) {
                    throw new HTTPException(400, { message: '商品库存不足' });
                }

                results.push({
                    productId: item.productId,
                    configId: item.configId,
                    quantity: item.quantity,
                    price: Number(shelfItem.config.salePrice),
                    discount: 0,
                    finalPrice: Number(shelfItem.config.salePrice),
                });
            }
        }

        return results;
    }

    /**
     * 计算价格
     */
    private async calculatePrice(
        productDetails: any[],
        couponIds: string[],
        userId: string,
        isSeckill: boolean
    ): Promise<{
        totalAmount: number;
        couponDiscount: number;
        finalAmount: number;
    }> {
        let totalAmount = productDetails.reduce(
            (sum, item) => sum + item.finalPrice * item.quantity,
            0
        );

        let couponDiscount = 0;

        if (couponIds.length > 0) {
            const userCoupons = await db.userCoupon.findMany({
                where: {
                    id: { in: couponIds },
                    userId,
                },
                include: { coupon: true },
            });

            // 按类型分组
            const discountCoupons = userCoupons.filter((uc) => uc.coupon.type === '折扣');
            const fullReductionCoupons = userCoupons.filter((uc) => uc.coupon.type === '满减');

            if (discountCoupons.length > 0) {
                // 折扣券（只能一张）
                const coupon = discountCoupons[0].coupon;
                couponDiscount = totalAmount * (1 - Number(coupon.discount));
            } else if (fullReductionCoupons.length > 0) {
                // 满减券（可叠加）
                for (const userCoupon of fullReductionCoupons) {
                    const coupon = userCoupon.coupon;
                    if (totalAmount >= Number(coupon.threshold)) {
                        couponDiscount += Number(coupon.amount);
                    }
                }
            }
        }

        // 秒杀商品不能使用优惠券
        if (isSeckill) {
            couponDiscount = 0;
        }

        const finalAmount = Math.max(0, totalAmount - couponDiscount);

        return {
            totalAmount,
            couponDiscount,
            finalAmount,
        };
    }

    /**
     * 锁定库存
     */
    private async lockStock(tx: any, productDetails: any[], isSeckill: boolean): Promise<void> {
        for (const item of productDetails) {
            if (isSeckill) {
                await tx.seckillProductConfig.updateMany({
                    where: {
                        configId: item.configId,
                    },
                    data: {
                        lockNum: { increment: item.quantity },
                    },
                });
            } else {
                await tx.shelfProductItem.updateMany({
                    where: {
                        productId: item.productId,
                        configId: item.configId,
                    },
                    data: {
                        lockNum: { increment: item.quantity },
                    },
                });
            }
        }
    }

    /**
     * 生成订单号
     */
    private generateOrderNo(): string {
        const timestamp = Date.now().toString();
        const random = Math.floor(Math.random() * 10000)
            .toString()
            .padStart(4, '0');
        return timestamp + random;
    }


    /**
     * 获取用户订单列表
     */
    async getUserOrders(
        userId: string,
        query: OrderListQuery
    ): Promise<OrderListResponse> {
        const {
            // page = 1,
            // pageSize = 10,
            status,
            startDate,
            endDate,
            keyword,
        } = query;

        // 构建查询条件
        const where: any = {
            userId,
            isVisible: true, // 只返回用户可见的订单
        };

        if (status) {
            where.status = status;
        }

        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate) {
                where.createdAt.gte = new Date(startDate);
            }
            if (endDate) {
                where.createdAt.lte = new Date(endDate);
            }
        }

        if (keyword) {
            where.OR = [
                { orderNo: { contains: keyword } },
                { receiver: { contains: keyword } },
                { phone: { contains: keyword } },
                { address: { contains: keyword } },
                {
                    items: {
                        some: {
                            nameSnapshot: { contains: keyword },
                        },
                    },
                },
            ];
        }

        // 计算总数
        const total = await db.order.count({ where });

        // 计算分页
        // const skip = (page - 1) * pageSize;
        // const totalPages = Math.ceil(total / pageSize);

        // 查询订单列表
        const orders = await db.order.findMany({
            where,
            // skip,
            // take: pageSize,
            orderBy: {
                createdAt: 'desc',
            },
            include: {
                items: {
                    include: {
                        product: true,
                        config: true,
                    },
                },
            },
        });

        // 转换数据格式
        const data: OrderListItem[] = orders.map((order) => ({
            id: order.id,
            orderNo: order.orderNo,
            status: order.status,
            payAmount: Number(order.payAmount),
            actualPayAmount: Number(order.actualPayAmount),
            createdAt: order.createdAt,
            payTime: order.payTime || undefined,
            items: order.items.map((item) => ({
                id: item.id,
                configId:item.configId,
                productId: item.productId,
                productName: item.nameSnapshot,
                config1: item.config1Snapshot,
                config2: item.config2Snapshot,
                config3: item.config3Snapshot || undefined,
                quantity: item.quantity,
                priceSnapshot: Number(item.priceSnapshot),
                payAmountSnapshot: Number(item.payAmountSnapshot),
                imageSnapshot: item.imageSnapshot || undefined,
                seckill: item.seckill,
            })),
        }));

        return {
            total,
            // page,
            // pageSize,
            // totalPages,
            data,
        };
    }

    /**
     * 获取订单详情
     */
    async getOrderDetail(orderId: string, userId: string): Promise<OrderDetailResponse> {
        const order = await db.order.findFirst({
            where: {
                id: orderId,
                userId,
                isVisible: true,
            },
            include: {
                items: {
                    include: {
                        product: true,
                        config: true,
                    },
                },
                userCoupons: {
                    include: {
                        coupon: true,
                    },
                },
                vouchers: {
                    include: {
                        voucher: true,
                    },
                },
            },
        });

        if (!order) {
            throw new HTTPException(404, { message: '订单不存在' });
        }

        // 获取收货地址详情
        const address = await db.receiptAddress.findFirst({
            where: {
                userId,
                provinceCode: order.provinceCode,
                cityCode: order.cityCode,
                areaCode: order.areaCode,
                streetCode: order.streetCode,
            },
            include: {
                province: true,
                city: true,
                area: true,
                street: true,
            },
        });

        return {
            id: order.id,
            orderNo: order.orderNo,
            status: order.status,
            payAmount: Number(order.payAmount),
            actualPayAmount: Number(order.actualPayAmount),
            payType: order.payType || undefined,
            payTime: order.payTime || undefined,
            createdAt: order.createdAt,
            payLimitTime: order.payLimitTime,
            cancelTime: order.cancelTime || undefined,
            shipTime: order.shipTime || undefined,
            receiveTime: order.receiveTime || undefined,
            completeTime: order.completeTime || undefined,
            remark: order.remark || undefined,
            logisticsNo: order.logisticsNo || undefined,

            // 收货信息
            address: {
                province: address?.province?.name || '',
                city: address?.city?.name || '',
                area: address?.area?.name || '',
                street: address?.street?.name || '',
                detail: order.address,
                receiver: order.receiver,
                phone: order.phone,
            },

            // 商品信息
            items: order.items.map((item) => ({
                id: item.id,
                configId:item.configId,
                productId: item.productId,
                productName: item.nameSnapshot,
                config1: item.config1Snapshot,
                config2: item.config2Snapshot,
                config3: item.config3Snapshot || undefined,
                quantity: item.quantity,
                priceSnapshot: Number(item.priceSnapshot),
                discountSnapshot: Number(item.discountSnapshot),
                payAmountSnapshot: Number(item.payAmountSnapshot),
                imageSnapshot: item.imageSnapshot || undefined,
                seckill: item.seckill,
            })),

            // 优惠信息
            coupons: order.userCoupons.map((uc) => ({
                id: uc.coupon.id,
                name: uc.coupon.name,
                type: uc.coupon.type,
                amount: Number(uc.actualAmount),
                discount: Number(uc.coupon.discount),
            })),

            // 代金券信息
            vouchers: order.vouchers.map((vr) => ({
                id: vr.voucher.id,
                title: vr.voucher.title,
                usedAmount: Number(vr.usedAmount),
                useTime: vr.useTime,
            })),
        };
    }


    async getOrderStats(userId: string): Promise<OrderStats> {
        const [
            totalCount,
            pendingPaymentCount,
            pendingShipmentCount,
            pendingReceiptCount,
            completedCount,
            cancelledCount,
            totalAmount,
        ] = await Promise.all([
            // 总订单数
            db.order.count({
                where: { userId, isVisible: true },
            }),
            // 待支付订单数
            db.order.count({
                where: { userId, status: '待支付', isVisible: true },
            }),
            // 待发货订单数
            db.order.count({
                where: { userId, status: '待发货', isVisible: true },
            }),
            // 待收货订单数
            db.order.count({
                where: { userId, status: '待收货', isVisible: true },
            }),
            // 已完成订单数
            db.order.count({
                where: { userId, status: '已收货', isVisible: true },
            }),
            // 已取消订单数
            db.order.count({
                where: { userId, status: '已取消', isVisible: true },
            }),
            // 总消费金额
            db.order.aggregate({
                where: {
                    userId,
                    status: { in: ['已支付', '待发货', '已发货', '待收货', '已收货'] },
                    isVisible: true,
                },
                _sum: {
                    actualPayAmount: true,
                },
            }),
        ]);

        return {
            totalCount,
            pendingPaymentCount,
            pendingShipmentCount,
            pendingReceiptCount,
            completedCount,
            cancelledCount,
            totalAmount: Number(totalAmount._sum.actualPayAmount || 0),
        };
    }

    async getUserSimpleOrders(userId: string): Promise<SimpleOrderItem[]> {
        // 查询用户所有订单
        const orders = await db.order.findMany({
            where: {
                userId,
                isVisible: true,
            },
            orderBy: {
                createdAt: 'desc',
            },
            include: {
                items: {
                    include: {
                        product: true,
                        config: true,
                    },
                },
            },
        });

        // 转换数据格式
        return orders.map((order) => ({
            id: order.id,
            orderNo: order.orderNo,
            status: order.status,
            payAmount: Number(order.payAmount),
            actualPayAmount: Number(order.actualPayAmount),
            payType: order.payType || undefined,
            payTime: order.payTime || undefined,
            createdAt: order.createdAt,
            items: order.items.map((item) => ({
                id: item.id,
                configId:item.configId,
                productId: item.productId,
                productName: item.nameSnapshot,
                config1: item.config1Snapshot,
                config2: item.config2Snapshot,
                config3: item.config3Snapshot || undefined,
                quantity: item.quantity,
                priceSnapshot: Number(item.priceSnapshot),
                payAmountSnapshot: Number(item.payAmountSnapshot),
                imageSnapshot: item.imageSnapshot || undefined,
                seckill: item.seckill,
            })),
        }));
    }

    async deleteOrderService(userId: string, orderId: string): Promise<number> {
        // 1. 验证订单是否存在且属于该用户
        const order = await db.order.findFirst({
            where: {
                id: orderId,
                userId: userId,
                isVisible: true, // 只查询未删除的订单
            },
        });

        if (!order) {
            throw new HTTPException(404, {
                message: '订单不存在或已被删除'
            });
        }

        // 2. 检查订单状态是否允许删除
        const allowedStatuses = ['待支付', '已取消', '已完成'];
        if (!allowedStatuses.includes(order.status)) {
            throw new HTTPException(400, {
                message: `订单状态为"${order.status}"，不允许删除`
            });
        }

        // 3. 执行逻辑删除
        const result = await db.order.update({
            where: {
                id: orderId,
                userId: userId, // 确保只能删除自己的订单
            },
            data: {
                isVisible: false,
            },
        });
        return result ? 1 : 0;
    }

}


