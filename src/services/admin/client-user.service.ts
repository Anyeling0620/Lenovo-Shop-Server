import { db } from "../../utils/db";
import { Prisma } from "@prisma/client";

export const getClientListService = async (params: {
    page?: number;
    pageSize?: number;
    keyword?: string;
    memberType?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
}) => {
    const page = Number(params.page) || 1;
    const pageSize = Number(params.pageSize) || 10;
    const skip = (page - 1) * pageSize;

    const where: Prisma.UserWhereInput = {};

    if (params.keyword) {
        where.OR = [
            { account: { contains: params.keyword } },
            { nickname: { contains: params.keyword } },
            { email: { contains: params.keyword } },
        ];
    }

    if (params.memberType) {
        // Assuming memberType matches the enum in schema or we need mapping
        // Schema has MemberType enum: 普通会员, 超级会员, 至尊会员
        // Frontend sends 'NORMAL' | 'VIP' | 'SVIP' ? 
        // We might need to map frontend values to DB enum values if they differ.
        // Let's assume for now they might send mapped values or we check what frontend sends.
        // If frontend sends 'NORMAL', we might need to map to '普通会员'
        const map: Record<string, string> = {
            'NORMAL': '普通会员',
            'VIP': '超级会员',
            'SVIP': '至尊会员'
        };
        if (map[params.memberType]) {
             where.memberType = map[params.memberType] as any;
        }
    }

    // Status is not in User model, ignoring for filter or treating as always active
    
    if (params.startDate && params.endDate) {
        where.createdAt = {
            gte: new Date(params.startDate),
            lte: new Date(params.endDate),
        };
    }

    const [list, total] = await Promise.all([
        db.user.findMany({
            where,
            skip,
            take: pageSize,
            orderBy: { createdAt: 'desc' },
            include: {
                _count: {
                    select: { orders: true }
                },
                orders: {
                   select: {
                       actualPayAmount: true
                   }
                }
            }
        }),
        db.user.count({ where }),
    ]);

    const formattedList = list.map(user => {
        const totalSpent = user.orders.reduce((sum, order) => sum + Number(order.actualPayAmount), 0);
        return {
            id: user.id,
            email: user.email,
            account: user.account,
            memberType: user.memberType === '普通会员' ? 'NORMAL' : user.memberType === '超级会员' ? 'VIP' : 'SVIP',
            gender: user.gender === 'man' ? 'MALE' : user.gender === 'woman' ? 'FEMALE' : 'UNKNOWN',
            birthday: user.birthday,
            avatar: user.avatar,
            nickname: user.nickname,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
            lastLoginTime: null, // Need to join UserLogin table for this
            status: 'ACTIVE', // Default
            orderCount: user._count.orders,
            totalSpent: totalSpent,
        };
    });

    return {
        list: formattedList,
        total,
        page,
        pageSize,
    };
};

export const getClientDetailService = async (userId: string) => {
    const user = await db.user.findUnique({
        where: { id: userId },
        include: {
            _count: { select: { orders: true } },
            orders: { select: { actualPayAmount: true } }
        }
    });

    if (!user) return null;

    const totalSpent = user.orders.reduce((sum, order) => sum + Number(order.actualPayAmount), 0);

    return {
        id: user.id,
        email: user.email,
        account: user.account,
        memberType: user.memberType === '普通会员' ? 'NORMAL' : user.memberType === '超级会员' ? 'VIP' : 'SVIP',
        gender: user.gender === 'man' ? 'MALE' : user.gender === 'woman' ? 'FEMALE' : 'UNKNOWN',
        birthday: user.birthday,
        avatar: user.avatar,
        nickname: user.nickname,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        status: 'ACTIVE',
        orderCount: user._count.orders,
        totalSpent: totalSpent,
    };
};

export const updateClientService = async (userId: string, data: any) => {
    // Map frontend data to DB fields
    // Frontend might send 'NORMAL', we need '普通会员'
    const memberTypeMap: Record<string, any> = {
        'NORMAL': '普通会员',
        'VIP': '超级会员',
        'SVIP': '至尊会员'
    };
    
    const updateData: any = {};
    if (data.nickname) updateData.nickname = data.nickname;
    if (data.memberType && memberTypeMap[data.memberType]) updateData.memberType = memberTypeMap[data.memberType];
    // Add other fields as needed

    await db.user.update({
        where: { id: userId },
        data: updateData
    });
};

export const deleteClientService = async (userId: string) => {
    await db.user.delete({
        where: { id: userId }
    });
};

export const getClientStatisticsService = async () => {
    const totalUsers = await db.user.count();
    // Assuming 'active' means logged in recently or just all users for now
    const activeUsers = totalUsers; 
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const newUsersToday = await db.user.count({
        where: {
            createdAt: {
                gte: today
            }
        }
    });

    const vipUsers = await db.user.count({ where: { memberType: '超级会员' } });
    const svipUsers = await db.user.count({ where: { memberType: '至尊会员' } });

    // Average order value
    // This might be heavy, for now simplify or mock
    const totalOrders = await db.order.count();
    const totalRevenueAgg = await db.order.aggregate({
        _sum: {
            actualPayAmount: true
        }
    });
    const totalRevenue = Number(totalRevenueAgg._sum.actualPayAmount || 0);
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    return {
        totalUsers,
        activeUsers,
        newUsersToday,
        vipUsers,
        svipUsers,
        averageOrderValue: Number(averageOrderValue.toFixed(2))
    };
};
