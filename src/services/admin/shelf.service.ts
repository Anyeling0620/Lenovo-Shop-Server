import { HTTPException } from "hono/http-exception";
import { db } from "../../utils/db";
import { ShelfProductStatus } from "@prisma/client";
import { assertCategoryAccess } from "../../utils/admin-auth";
import {
  HomePushResponse,
  NewPushResponse,
  ShelfProductResponse,
  ShelfStatsResponse,
} from "../../types/admin/api.type";

export const listShelfProducts = async (filters: {
  categoryId?: string;
  status?: ShelfProductStatus;
}): Promise<ShelfProductResponse[]> => {
  const list = await db.shelfProduct.findMany({
    where: {
      categoryId: filters.categoryId,
      status: filters.status,
    },
    include: {
      category: true,
      product: {
        include: { configs: true, brand: true, category: true },
      },
      items: {
        include: {
          config: true,
        },
      },
    },
    orderBy: { shelfTime: "desc" },
  });

  return list.map((s) => ({
    shelf_product_id: s.id,
    category_id: s.categoryId,
    category_name: s.category.name,
    product_id: s.productId,
    product_name: s.product.name,
    brand_name: s.product.brand.name,
    is_carousel: s.isCarousel,
    carousel_image: s.carouselImage,
    is_self_operated: s.isSelfOperated,
    is_customizable: s.isCustomizable,
    installment: s.installment,
    status: s.status,
    items: s.items.map((i) => ({
      shelf_product_item_id: i.id,
      config_id: i.configId,
      config1: i.config.config1,
      config2: i.config.config2,
      config3: i.config.config3,
      shelf_num: i.shelfNum,
      lock_num: i.lockNum,
    })),
  })) as ShelfProductResponse[];
};

export const createShelfProduct = async (
  sessionCategories: string[],
  payload: {
    productId: string;
    categoryId: string;
  }
) => {
  assertCategoryAccess(sessionCategories, payload.categoryId);

  const exist = await db.shelfProduct.findUnique({
    where: { categoryId_productId: { categoryId: payload.categoryId, productId: payload.productId } },
  });
  if (exist) throw new HTTPException(400, { message: "该商品已在此专区上架" });

  const shelf = await db.shelfProduct.create({
    data: {
      productId: payload.productId,
      categoryId: payload.categoryId,
    },
  });
  return { shelf_product_id: shelf.id };
};

export const updateShelfProductFlags = async (
  sessionCategories: string[],
  shelfProductId: string,
  payload: Partial<{
    isSelfOperated: boolean;
    isCustomizable: boolean;
    installment: number;
  }>
) => {
  const shelf = await db.shelfProduct.findUnique({ where: { id: shelfProductId } });
  if (!shelf) throw new HTTPException(404, { message: "上架商品不存在" });
  assertCategoryAccess(sessionCategories, shelf.categoryId);

  await db.shelfProduct.update({
    where: { id: shelfProductId },
    data: {
      isSelfOperated: payload.isSelfOperated ?? shelf.isSelfOperated,
      isCustomizable: payload.isCustomizable ?? shelf.isCustomizable,
      installment: payload.installment ?? shelf.installment,
    },
  });
  return true;
};

export const addShelfProductItem = async (
  sessionCategories: string[],
  payload: {
    shelfProductId: string;
    configId: string;
    shelfNum: number;
  }
) => {
  const shelf = await db.shelfProduct.findUnique({
    where: { id: payload.shelfProductId },
    include: { product: true },
  });
  if (!shelf) throw new HTTPException(404, { message: "上架商品不存在" });
  assertCategoryAccess(sessionCategories, shelf.categoryId);

  const config = await db.productConfig.findUnique({
    where: { id: payload.configId },
    include: { product: true },
  });
  if (!config) throw new HTTPException(404, { message: "配置不存在" });
  if (config.productId !== shelf.productId) {
    throw new HTTPException(400, { message: "配置不属于该商品" });
  }

  const existingStock = await db.stock.findUnique({ where: { configId: payload.configId } });
  if (!existingStock || existingStock.stockNum < payload.shelfNum) {
    throw new HTTPException(400, { message: "库存不足" });
  }

  const item = await db.shelfProductItem.upsert({
    where: {
      shelfProductId_configId: {
        shelfProductId: payload.shelfProductId,
        configId: payload.configId,
      },
    },
    update: {
      shelfNum: payload.shelfNum,
    },
    create: {
      shelfProductId: payload.shelfProductId,
      productId: shelf.productId,
      configId: payload.configId,
      shelfNum: payload.shelfNum,
    },
  });

  // 扣减库存
  await db.stock.update({
    where: { id: existingStock.id },
    data: { stockNum: existingStock.stockNum - payload.shelfNum },
  });

  return { shelf_product_item_id: item.id };
};

export const updateShelfProductItemQuantity = async (
  sessionCategories: string[],
  itemId: string,
  payload: { shelfNum: number; lockNum?: number }
) => {
  const item = await db.shelfProductItem.findUnique({
    where: { id: itemId },
    include: { shelfProduct: true },
  });
  if (!item) throw new HTTPException(404, { message: "上架配置不存在" });
  assertCategoryAccess(sessionCategories, item.shelfProduct.categoryId);

  const stock = await db.stock.findUnique({ where: { configId: item.configId } });
  if (!stock) throw new HTTPException(404, { message: "库存不存在" });

  const diff = payload.shelfNum - item.shelfNum;
  if (diff > 0 && stock.stockNum < diff) {
    throw new HTTPException(400, { message: "库存不足" });
  }

  await db.shelfProductItem.update({
    where: { id: itemId },
    data: {
      shelfNum: payload.shelfNum,
      lockNum: payload.lockNum ?? item.lockNum,
    },
  });

  await db.stock.update({
    where: { id: stock.id },
    data: { stockNum: stock.stockNum - diff },
  });

  return true;
};

export const deleteShelfProductItem = async (
  sessionCategories: string[],
  itemId: string
) => {
  const item = await db.shelfProductItem.findUnique({
    where: { id: itemId },
    include: { shelfProduct: true },
  });
  if (!item) throw new HTTPException(404, { message: "上架配置不存在" });
  assertCategoryAccess(sessionCategories, item.shelfProduct.categoryId);

  const stock = await db.stock.findUnique({ where: { configId: item.configId } });
  if (stock) {
    await db.stock.update({
      where: { id: stock.id },
      data: { stockNum: stock.stockNum + item.shelfNum },
    });
  }

  await db.shelfProductItem.delete({ where: { id: itemId } });
  return true;
};

export const setShelfCarousel = async (
  sessionCategories: string[],
  shelfProductId: string,
  payload: { isCarousel: boolean; carouselImage?: string | null }
) => {
  const shelf = await db.shelfProduct.findUnique({ where: { id: shelfProductId } });
  if (!shelf) throw new HTTPException(404, { message: "上架商品不存在" });
  assertCategoryAccess(sessionCategories, shelf.categoryId);

  await db.shelfProduct.update({
    where: { id: shelfProductId },
    data: {
      isCarousel: payload.isCarousel,
      carouselImage: payload.carouselImage ?? shelf.carouselImage,
    },
  });
  return true;
};

export const statsShelfByCategory = async (): Promise<ShelfStatsResponse[]> => {
  const rows = await db.shelfProduct.groupBy({
    by: ["categoryId"],
    _count: { _all: true },
  });

  const categories = await db.category.findMany({
    where: { id: { in: rows.map((r) => r.categoryId) } },
    select: { id: true, name: true, code: true },
  });
  const categoryMap = new Map(categories.map((c) => [c.id, c]));

  return rows.map((r) => {
    const cat = categoryMap.get(r.categoryId);
    return {
      category_id: r.categoryId,
      category_name: cat?.name ?? "",
      category_code: cat?.code ?? "",
      shelf_product_count: r._count._all,
    };
  }) as ShelfStatsResponse[];
};

export const listCategoryShelfProducts = async (categoryId: string): Promise<ShelfProductResponse[]> => {
  const list = await db.shelfProduct.findMany({
    where: { categoryId },
    include: {
      category: true,
      product: { include: { brand: true } },
      items: { include: { config: true } },
    },
  });
  return list.map((s) => ({
    shelf_product_id: s.id,
    category_id: s.categoryId,
    category_name: s.category.name,
    product_id: s.productId,
    product_name: s.product.name,
    brand_name: s.product.brand?.name,
    is_carousel: s.isCarousel,
    carousel_image: s.carouselImage,
    is_self_operated: s.isSelfOperated,
    is_customizable: s.isCustomizable,
    installment: s.installment,
    status: s.status,
    items: s.items.map((i) => ({
      shelf_product_item_id: i.id,
      config_id: i.configId,
      config1: i.config.config1,
      config2: i.config.config2,
      config3: i.config.config3,
      shelf_num: i.shelfNum,
      lock_num: i.lockNum,
    })),
  })) as ShelfProductResponse[];
};

export const setHomePush = async (payload: {
  shelfProductId: string;
  startTime: Date;
  endTime: Date;
  isCarousel?: boolean;
  carouselImage?: string | null;
}): Promise<{ home_push_id: string }> => {
  const exist = await db.homePush.findUnique({
    where: { shelfProductId: payload.shelfProductId },
  });
  if (exist) {
    await db.homePush.update({
      where: { id: exist.id },
      data: {
        startTime: payload.startTime,
        endTime: payload.endTime,
        isCarousel: payload.isCarousel ?? exist.isCarousel,
        carouselImage: payload.carouselImage ?? exist.carouselImage,
      },
    });
    return { home_push_id: exist.id };
  }
  const record = await db.homePush.create({
    data: {
      shelfProductId: payload.shelfProductId,
      startTime: payload.startTime,
      endTime: payload.endTime,
      isCarousel: payload.isCarousel ?? false,
      carouselImage: payload.carouselImage,
    },
  });
  return { home_push_id: record.id };
};

export const setNewPush = async (payload: {
  shelfProductId: string;
  startTime: Date;
  endTime: Date;
  isCarousel?: boolean;
  carouselImage?: string | null;
}): Promise<{ new_product_push_id: string }> => {
  const exist = await db.newProductPush.findUnique({
    where: { shelfProductId: payload.shelfProductId },
  });
  if (exist) {
    await db.newProductPush.update({
      where: { id: exist.id },
      data: {
        startTime: payload.startTime,
        endTime: payload.endTime,
        isCarousel: payload.isCarousel ?? exist.isCarousel,
        carouselImage: payload.carouselImage ?? exist.carouselImage,
      },
    });
    return { new_product_push_id: exist.id };
  }
  const record = await db.newProductPush.create({
    data: {
      shelfProductId: payload.shelfProductId,
      startTime: payload.startTime,
      endTime: payload.endTime,
      isCarousel: payload.isCarousel ?? false,
      carouselImage: payload.carouselImage,
    },
  });
  return { new_product_push_id: record.id };
};

export const listHomePush = async (): Promise<HomePushResponse[]> => {
  const list = await db.homePush.findMany({
    include: {
      shelfProduct: {
        include: { product: true },
      },
    },
  });
  return list.map((p) => ({
    home_push_id: p.id,
    shelf_product_id: p.shelfProductId,
    product_id: p.shelfProduct.productId,
    product_name: p.shelfProduct.product.name,
    is_carousel: p.isCarousel,
    carousel_image: p.carouselImage,
    start_time: p.startTime,
    end_time: p.endTime,
    status: p.status,
  })) as HomePushResponse[];
};

export const listNewPush = async (): Promise<NewPushResponse[]> => {
  const list = await db.newProductPush.findMany({
    include: {
      shelfProduct: {
        include: { product: true },
      },
    },
  });
  return list.map((p) => ({
    new_product_push_id: p.id,
    shelf_product_id: p.shelfProductId,
    product_id: p.shelfProduct.productId,
    product_name: p.shelfProduct.product.name,
    is_carousel: p.isCarousel,
    carousel_image: p.carouselImage,
    start_time: p.startTime,
    end_time: p.endTime,
    status: p.status,
  })) as NewPushResponse[];
};

export const updateShelfProductStatus = async (
  sessionCategories: string[],
  shelfProductId: string,
  status: ShelfProductStatus
) => {
  const shelf = await db.shelfProduct.findUnique({ where: { id: shelfProductId } });
  if (!shelf) throw new HTTPException(404, { message: "上架商品不存在" });
  assertCategoryAccess(sessionCategories, shelf.categoryId);
  await db.shelfProduct.update({
    where: { id: shelfProductId },
    data: { status, offShelfTime: status === ShelfProductStatus.下架 ? new Date() : null },
  });
  return true;
};
