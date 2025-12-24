import { db } from "../../utils/db";
import { Prisma, AdminStatus } from "@prisma/client";
import bcrypt from 'bcryptjs';

export const getAdminListService = async (params: {
    page?: number;
    pageSize?: number;
    keyword?: string;
    status?: string;
    identityId?: string;
}) => {
    const page = Number(params.page) || 1;
    const pageSize = Number(params.pageSize) || 10;
    const skip = (page - 1) * pageSize;

    const where: Prisma.AdminWhereInput = {};

    if (params.keyword) {
        where.OR = [
            { account: { contains: params.keyword } },
            { name: { contains: params.keyword } },
            { email: { contains: params.keyword } },
        ];
    }

    if (params.status) {
        const statusMap: Record<string, AdminStatus> = {
            'ACTIVE': AdminStatus.启用,
            'INACTIVE': AdminStatus.禁用,
            'BANNED': AdminStatus.禁用 // Map banned to disabled for now
        };
        if (statusMap[params.status]) {
            where.status = statusMap[params.status];
        }
    }

    if (params.identityId) {
        where.adminIdentityAdmins = {
            some: {
                identityId: params.identityId
            }
        };
    }

    const [list, total] = await Promise.all([
        db.admin.findMany({
            where,
            skip,
            take: pageSize,
            orderBy: { createdAt: 'desc' },
            include: {
                adminIdentityAdmins: {
                    include: { identity: true }
                },
                adminProductCategoryAdmins: {
                    include: { category: true }
                },
                // For creatorName, we might need to join or fetch separately if not joined
                // Admin model has creatorId. We can self-join but Prisma requires relation def.
                // Assuming we don't need creatorName strictly or can populate it if relation exists.
                // There is no explicit relation `creator` in Admin model pointing to Admin, 
                // but there is `creatorId`.
            }
        }),
        db.admin.count({ where }),
    ]);

    const formattedList = list.map(admin => ({
        id: admin.id,
        account: admin.account,
        name: admin.name,
        email: admin.email,
        avatar: admin.avatar,
        nickname: admin.nickname,
        status: admin.status === AdminStatus.启用 ? 'ACTIVE' : 'INACTIVE',
        createdAt: admin.createdAt,
        lastLoginTime: admin.lastLoginTime,
        creatorId: admin.creatorId,
        identities: admin.adminIdentityAdmins.map(r => ({
            id: r.identity.id,
            name: r.identity.name,
            code: r.identity.code
        })),
        productCategories: admin.adminProductCategoryAdmins.map(r => ({
            id: r.category.id,
            name: r.category.name,
            code: r.category.code
        }))
    }));

    return {
        list: formattedList,
        total,
        page,
        pageSize,
    };
};

export const getAdminDetailService = async (adminId: string) => {
    const admin = await db.admin.findUnique({
        where: { id: adminId },
        include: {
            adminIdentityAdmins: { include: { identity: true } },
            adminProductCategoryAdmins: { include: { category: true } }
        }
    });

    if (!admin) return null;

    return {
        id: admin.id,
        account: admin.account,
        name: admin.name,
        email: admin.email,
        avatar: admin.avatar,
        nickname: admin.nickname,
        status: admin.status === AdminStatus.启用 ? 'ACTIVE' : 'INACTIVE',
        createdAt: admin.createdAt,
        lastLoginTime: admin.lastLoginTime,
        creatorId: admin.creatorId,
        identities: admin.adminIdentityAdmins.map(r => ({
            id: r.identity.id,
            name: r.identity.name,
            code: r.identity.code
        })),
        productCategories: admin.adminProductCategoryAdmins.map(r => ({
            id: r.category.id,
            name: r.category.name,
            code: r.category.code
        }))
    };
};

export const createAdminService = async (data: any, creatorId: string) => {
    const hashedPassword = await bcrypt.hash(data.password, 10);
    
    // Transaction to create admin and relations
    const admin = await db.$transaction(async (tx) => {
        const newAdmin = await tx.admin.create({
            data: {
                account: data.account,
                password: hashedPassword,
                name: data.name,
                email: data.email,
                avatar: data.avatar,
                nickname: data.nickname,
                status: AdminStatus.启用,
                creatorId: creatorId
            }
        });

        if (data.identityIds && data.identityIds.length > 0) {
            await tx.adminIdentity.createMany({
                data: data.identityIds.map((id: string) => ({
                    adminId: newAdmin.id,
                    identityId: id,
                    assignerId: creatorId,
                }))
            });
        }

        if (data.categoryIds && data.categoryIds.length > 0) {
             await tx.adminProductCategory.createMany({
                data: data.categoryIds.map((id: string) => ({
                    adminId: newAdmin.id,
                    categoryId: id,
                    creatorId: creatorId,
                }))
            });
        }
        
        return newAdmin;
    });

    return admin;
};

export const updateAdminService = async (adminId: string, data: any) => {
    // Handle relations update if necessary (complex)
    // For simplicity, just update basic fields for now, or handle relations
    const updateData: any = {};
    if (data.name) updateData.name = data.name;
    if (data.email) updateData.email = data.email;
    if (data.nickname) updateData.nickname = data.nickname;
    if (data.status) {
         const statusMap: Record<string, AdminStatus> = {
            'ACTIVE': AdminStatus.启用,
            'INACTIVE': AdminStatus.禁用,
        };
        if (statusMap[data.status]) updateData.status = statusMap[data.status];
    }
    
    // Updating identities/categories requires deleting old and adding new. 
    // Skipping for brevity unless requested.

    await db.admin.update({
        where: { id: adminId },
        data: updateData
    });
};

export const deleteAdminService = async (adminId: string) => {
    await db.admin.delete({ where: { id: adminId } });
};

export const resetAdminPasswordService = async (adminId: string, newPassword: string) => {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await db.admin.update({
        where: { id: adminId },
        data: { password: hashedPassword }
    });
};
