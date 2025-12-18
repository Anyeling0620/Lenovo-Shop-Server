import { HTTPException } from 'hono/http-exception';
import { db } from '../utils/db';
import { ProductItem, ProductsResponse, ProductType } from '../types/product.type';
import { ProductCategory } from '@prisma/client';

export async function getProductsService(type: ProductType): Promise<ProductsResponse> {
    // 英文类型到中文类别的映射
    const typeToCategoryMap: Record<ProductType, ProductCategory> = {
        notebooks: '笔记本',
        desktops: '台式机',
        monitor: '显示器',
        tablets: '平板',
        phones: '手机',
        fittings: '配件',
    };
    
    // 类别标题映射
    const categoryTitleMap: Record<ProductCategory, string> = {
        笔记本: '笔记本',
        台式机: '台式机',
        显示器: '显示器',
        平板: '平板',
        手机: '手机',
        配件: '配件',
    };

    // 将英文类型转换为中文类别
    const category = typeToCategoryMap[type];
    console.log('Category value:', category); // 添加这行代码


    // 查询产品基础信息
    const products = await db.product.findMany({
        where: {
            category: category,
        },
        include: {
            // 关联标签（保留，虽然前端未使用）
            tags: {
                include: {
                    tag: true
                }
            },
            // 关联所有配置（用于判断库存和取最低价格配置）
            configs: {
                orderBy: { price: 'asc' },
                select: {
                    id: true,
                    price: true,
                    originalPrice: true,
                    stock: true // 新增：查询库存
                }
            },
            // 关联优惠券并过滤有效优惠券（未过期且已开始）
            productCoupons: {
                include: {
                    coupon: {
                        select: {
                            type: true,
                            value: true,
                            startAt: true,
                            expireAt: true
                        }
                    }
                }
            }
        }
    });

    // 处理空数据场景
    if (products.length === 0) {
        return {
            title: categoryTitleMap[category], // 使用映射的标题
            productList: []
        };
    }

    // 格式化产品列表
    const productList: ProductItem[] = await Promise.all(
        products.map(async (product) => {
            // 处理配置信息：取最低价格配置，同时判断库存
            const sortedConfigs = product.configs.sort((a, b) => a.price - b.price);
            const minConfig = sortedConfigs[0];

            if (!minConfig) {
                throw new HTTPException(500, {
                    message: `产品${product.id}缺少配置信息`
                });
            }

            // 判断是否有库存：任意配置库存>0则为有库存
            const hasStock = sortedConfigs.some(config => config.stock > 0);

            // 处理有效优惠券：过滤出当前时间在有效期内的优惠券
            const now = new Date();
            const validCoupons = product.productCoupons.filter(pc => {
                const coupon = pc.coupon;
                return coupon.startAt <= now && coupon.expireAt >= now;
            });

            // 优惠券信息处理（取第一个有效优惠券）
            const hasCoupon = validCoupons.length > 0;
            const couponInfo = hasCoupon
                ? {
                    type: validCoupons[0].coupon.type,
                    value: validCoupons[0].coupon.value
                }
                : null;

            return {
                productId: product.id,
                productName: product.name,
                description: product.description,
                mainImage: product.mainImage,
                isCarousel: product.carousel,
                carouselImage: product.carouselImg,
                minPrice: minConfig.price,
                originalPrice: minConfig.originalPrice,
                configId: minConfig.id,
                isSelfOperated: product.selfOperated,
                hasCoupon,
                couponInfo,
                isCustomizable: product.customizable,
                supportInstallment: product.installment,
                installmentNum: product.installmentNum,
                supportTradeIn: product.supportTradeIn,
                hasStock
            };
        })
    );

    return {
        title: categoryTitleMap[category], // 动态生成标题
        productList
    };
}



export async function getNewProductsSerevice(): Promise<ProductsResponse[]> {
    // 定义所有产品类别
    const categories: ProductCategory[] = ['笔记本', '台式机', '显示器', '平板', '手机', '配件'];

    // 类别标题映射
    const categoryTitleMap: Record<ProductCategory, string> = {
        笔记本: '笔记本',
        台式机: '台式机',
        显示器: '显示器',
        平板: '平板',
        手机: '手机',
        配件: '配件',
    };

    // 为每个类别查询最新的4个产品
    const results = await Promise.all(
        categories.map(async (category) => {
            // 查询该类别最新发布的4个产品
            const products = await db.product.findMany({
                where: {
                    category: category,
                    // publishedAt: { not: null }, // 确保产品已发布
                    // unpublishedAt: null // 确保产品未下架
                },
                orderBy: {
                    publishedAt: 'desc' // 按发布时间降序排列
                },
                take: 4, // 只取前4个
                include: {
                    // 关联标签
                    tags: {
                        include: {
                            tag: true
                        }
                    },
                    // 关联所有配置（用于判断库存和取最低价格配置）
                    configs: {
                        orderBy: { price: 'asc' },
                        select: {
                            id: true,
                            price: true,
                            originalPrice: true,
                            stock: true
                        }
                    },
                    // 关联优惠券并过滤有效优惠券（未过期且已开始）
                    productCoupons: {
                        include: {
                            coupon: {
                                select: {
                                    type: true,
                                    value: true,
                                    startAt: true,
                                    expireAt: true
                                }
                            }
                        }
                    }
                }
            });

            // 格式化产品列表，复用 getProductsService 中的逻辑
            const productList: ProductItem[] = await Promise.all(
                products.map(async (product) => {
                    // 处理配置信息：取最低价格配置，同时判断库存
                    const sortedConfigs = product.configs.sort((a, b) => a.price - b.price);
                    const minConfig = sortedConfigs[0];

                    if (!minConfig) {
                        throw new HTTPException(500, {
                            message: `产品${product.id}缺少配置信息`
                        });
                    }

                    // 判断是否有库存：任意配置库存>0则为有库存
                    const hasStock = sortedConfigs.some(config => config.stock > 0);

                    // 处理有效优惠券：过滤出当前时间在有效期内的优惠券
                    const now = new Date();
                    const validCoupons = product.productCoupons.filter(pc => {
                        const coupon = pc.coupon;
                        return coupon.startAt <= now && coupon.expireAt >= now;
                    });

                    // 优惠券信息处理（取第一个有效优惠券）
                    const hasCoupon = validCoupons.length > 0;
                    const couponInfo = hasCoupon
                        ? {
                            type: validCoupons[0].coupon.type,
                            value: validCoupons[0].coupon.value
                        }
                        : null;

                    return {
                        productId: product.id,
                        productName: product.name,
                        description: product.description,
                        mainImage: product.mainImage,
                        isCarousel: product.carousel,
                        carouselImage: product.carouselImg,
                        minPrice: minConfig.price,
                        originalPrice: minConfig.originalPrice,
                        configId: minConfig.id,
                        isSelfOperated: product.selfOperated,
                        hasCoupon,
                        couponInfo,
                        isCustomizable: product.customizable,
                        supportInstallment: product.installment,
                        installmentNum: product.installmentNum,
                        supportTradeIn: product.supportTradeIn,
                        hasStock
                    };
                })
            );

            // 返回该类别的结果
            return {
                title: categoryTitleMap[category],
                productList
            };
        })
    );

    return results;
}


export async function getIndexProductsService(): Promise<ProductsResponse[]> {
    // 查询所有首页推荐产品
    const products = await db.product.findMany({
        where: {
            homeRecommend: true,
        },
        include: {
            // 关联标签
            tags: {
                include: {
                    tag: true
                }
            },
            // 关联所有配置（用于判断库存和取最低价格配置）
            configs: {
                orderBy: { price: 'asc' },
                select: {
                    id: true,
                    price: true,
                    originalPrice: true,
                    stock: true
                }
            },
            // 关联优惠券并过滤有效优惠券（未过期且已开始）
            productCoupons: {
                include: {
                    coupon: {
                        select: {
                            type: true,
                            value: true,
                            startAt: true,
                            expireAt: true
                        }
                    }
                }
            }
        }
    });

    // 按类别和品牌分组
    const groupedProducts = products.reduce((acc, product) => {
        const title = ` ${product.brand}${product.category}`;
        if (!acc[title]) {
            acc[title] = [];
        }
        acc[title].push(product);
        return acc;
    }, {} as Record<string, typeof products>);

    // 格式化结果，每个类别取前8个产品
    const results = Object.entries(groupedProducts).map(([title, products]) => {
        const productList: ProductItem[] = products.slice(0, 8).map(product => {
            // 处理配置信息：取最低价格配置，同时判断库存
            const sortedConfigs = product.configs.sort((a, b) => a.price - b.price);
            const minConfig = sortedConfigs[0];

            if (!minConfig) {
                throw new HTTPException(500, {
                    message: `产品${product.id}缺少配置信息`
                });
            }

            // 判断是否有库存：任意配置库存>0则为有库存
            const hasStock = sortedConfigs.some(config => config.stock > 0);

            // 处理有效优惠券：过滤出当前时间在有效期内的优惠券
            const now = new Date();
            const validCoupons = product.productCoupons.filter(pc => {
                const coupon = pc.coupon;
                return coupon.startAt <= now && coupon.expireAt >= now;
            });

            // 优惠券信息处理（取第一个有效优惠券）
            const hasCoupon = validCoupons.length > 0;
            const couponInfo = hasCoupon
                ? {
                    type: validCoupons[0].coupon.type,
                    value: validCoupons[0].coupon.value
                }
                : null;

            return {
                productId: product.id,
                productName: product.name,
                description: product.description,
                mainImage: product.mainImage,
                isCarousel: product.carousel,
                carouselImage: product.carouselImg,
                minPrice: minConfig.price,
                originalPrice: minConfig.originalPrice,
                configId: minConfig.id,
                isSelfOperated: product.selfOperated,
                hasCoupon,
                couponInfo,
                isCustomizable: product.customizable,
                supportInstallment: product.installment,
                installmentNum: product.installmentNum,
                supportTradeIn: product.supportTradeIn,
                hasStock
            };
        });

        return {
            title,
            productList
        };
    });

    return results;
}
