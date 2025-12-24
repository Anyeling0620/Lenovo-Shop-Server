import { HTTPException } from "hono/http-exception";
import { db } from "../../utils/db";
import { ShelfProductStatus, ProductStatus, CartStatus } from "@prisma/client";
import { CartListItemVO, CartListResponse } from "../../types/client/shop-card.type";


export async function addToShoppingCardService(userId: string, configId: string) {
  if (!userId) throw new HTTPException(401, { message: "未登录" });
  if (!configId) throw new HTTPException(400, { message: "缺少必要参数" });

  // 1) 通过配置ID找到上架项，取出商品ID，并校验上架商品有效
  const shelfItem = await db.shelfProductItem.findFirst({
    where: { configId },
    include: {
      shelfProduct: true,
      product: true,
      config: true,
    },
  });
  if (!shelfItem) throw new HTTPException(404, { message: "配置不存在或未上架" });

  const productId = shelfItem.productId;

  // 校验：上架商品状态有效，且商品本身为正常
  const shelfValid = shelfItem.shelfProduct && [ShelfProductStatus.在售, ShelfProductStatus.售罄].includes(shelfItem.shelfProduct.status as "在售" | "售罄");
  const productValid = shelfItem.product && shelfItem.product.status === ProductStatus.正常;
  if (!shelfValid || !productValid) throw new HTTPException(400, { message: "商品不可加入购物车" });

  // 2) 若购物车已有相同(productId+configId)，则数量+1，否则创建
  const existing = await db.cart.findFirst({
    where: { userId, productId, configId },
  });

  if (existing) {
    await db.cart.update({
      where: { id: existing.id },
      data: {
        quantity: existing.quantity + 1,
        // 价格以当前配置售价记录（快照）
        price: shelfItem.config?.salePrice ?? existing.price,
      },
    });
  } else {
    await db.cart.create({
      data: {
        userId,
        productId,
        configId,
        quantity: 1,
        price: shelfItem.config?.salePrice ?? 0 as any,
      },
    });
  }
}

export async function getShopCardsService(userId: string): Promise<CartListResponse> {
  if (!userId) throw new HTTPException(401, { message: "未登录" });

  // 1) 读取购物车，联表商品、配置（用于展示）
  const carts = await db.cart.findMany({
    where: {
      userId,
      status: CartStatus.有效
    },
    include: {
      product: {
        include: {
          banners: true,
        },
      },
      config: true,
    },
    orderBy: { updatedAt: "desc" },
  });

  if (carts.length === 0) return { items: [] };

  // 2) 为“可重新选择配置”，查询同商品在上架项下可用的所有配置
  const productIds = Array.from(new Set(carts.map(c => c.productId)));
  const shelfItems = await db.shelfProductItem.findMany({
    where: { productId: { in: productIds } },
    include: { config: true },
  });
  const optionsByProduct = new Map<string, any[]>();
  for (const it of shelfItems) {
    if (!it.config) continue;
    const arr = optionsByProduct.get(it.productId) || [];
    arr.push(it.config);
    optionsByProduct.set(it.productId, arr);
  }

  // 3) 组装列表项
  const items: CartListItemVO[] = carts.map(c => {
    const cfg = c.config!;
    const prod = c.product!;
    const availableConfigs = (optionsByProduct.get(c.productId) || []).map(x => ({
      id: x.id,
      config1: x.config1,
      config2: x.config2,
      config3: x.config3 ?? undefined,
      salePrice: x.salePrice.toNumber(),
      originalPrice: x.originalPrice.toNumber(),
      configImage: x.configImage ?? null,
    }));

    return {
      cartId: c.id,
      productId: c.productId,
      configId: c.configId,
      quantity: c.quantity,
      name: prod.name,
      subTitle: prod.subTitle ?? undefined,
      description: prod.description ?? undefined,
      image: cfg.configImage ?? prod.mainImage ?? null,
      config1: cfg.config1,
      config2: cfg.config2,
      config3: cfg.config3 ?? undefined,
      salePrice: cfg.salePrice.toNumber(),
      originalPrice: cfg.originalPrice.toNumber(),
      availableConfigs,
    };
  });

  return { items };
}


/**
 * 删除用户购物车中的商品项服务
 * 
 * 该服务用于删除指定用户的购物车中的商品项。它会在事务中执行以下操作：
 * 1. 验证购物车项是否属于当前用户且状态有效
 * 2. 执行删除操作
 * 3. 返回删除结果
 * 
 * @param {string} userId - 用户ID，用于验证购物车项的所有权
 * @param {string[]} cardIds - 需要删除的购物车项ID数组
 * @returns {Promise<number>} 返回成功删除的购物车项数量
 * 
 * @throws {HTTPException} 当以下情况发生时抛出异常：
 * - cardIds数组为空时，抛出400错误，提示"缺少参数数据"
 * - 未找到有效的购物车项时，抛出404错误，提示"未找到有效的购物车项"
 * 
 * @example
 * // 示例调用
 * try {
 *   const deletedCount = await deleteShopCardsService('user123', ['cart1', 'cart2']);
 *   console.log(`成功删除 ${deletedCount} 个购物车项`);
 * } catch (error) {
 *   console.error('删除购物车项失败:', error);
 * }
 */
export async function deleteShopCardsService(userId: string, cardIds: string[]): Promise<number> {
  if (cardIds.length === 0) {
    throw new HTTPException(400, { message: "缺少参数数据" })
  }


  const result = await db.$transaction(async (tx) => {
    // 1. 验证购物车项是否属于当前用户
    const existingCarts = await tx.cart.findMany({
      where: {
        id: { in: cardIds },
        userId: userId,
      },
      select: {
        id: true,
        quantity: true,
        productId: true
      }
    })

    if (existingCarts.length === 0) {
      throw new HTTPException(404, { message: "未找到有效的购物车项" })
    }

    // 2. 执行删除操作
    const deletedCarts = await tx.cart.deleteMany({
      where: {
        id: { in: existingCarts.map(cart => cart.id) },
        userId: userId
      }
    })

    // 3. 返回删除结果
    return {
      success: true,
      deletedCount: deletedCarts.count,
      deletedItems: existingCarts
    }
  })

  return result.deletedCount

}
