import {
  ShelfProductStatus,
  SeckillRoundStatus,
  SeckillType,
  SeckillProductConfigStatus,
  ProductStatus,
  CategoryStatus,
  ProductConfigStatus,
  Brand,
  Tag,
} from '@prisma/client';
import { db } from '../../utils/db';
import { queryAvailableCouponsByProductId } from './product.service';

import {
  ShelfProductDetailResponse,
  SeckillProductDetailResponse,
  BannerImageVO,
  AppearanceImageVO,
  BrandVO,
  ShelfItemVO,
  ShelfProductBriefVO,
  SeckillRoundBriefVO,
  SeckillConfigDetailVO,
} from '../../types/client/product-detail.type';

import {
  CategoryVO,
  CouponItem,
  ProductConfigVO,
  ProductVO,
} from '../../types/client/product.type';

/* ---------------- 工具函数 ---------------- */

const fmt = (d: Date | null | undefined): string | null => {
  if (!d) return null;
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
};

const toBrandVO = (b: Brand): BrandVO => ({
  id: b.id,
  name: b.name,
  code: b.code,
  logo: b.logo ?? null,
});

const toBannerVO = (
  rows: Array<{ image: string; sort: number; createdAt: Date }>,
): BannerImageVO[] =>
  rows.map(r => ({
    image: r.image,
    sort: r.sort,
    createdAt: fmt(r.createdAt)!,
  }));

const toAppearanceVO = (
  rows: Array<{ image: string; createdAt: Date }>,
): AppearanceImageVO[] =>
  rows.map(r => ({
    image: r.image,
    createdAt: fmt(r.createdAt)!,
  }));

/* ===========================================================
 * 获取货架商品详情
 * =========================================================== */
export async function getShelfProductDetailService(
  productId: string,
  userId?: string,
): Promise<ShelfProductDetailResponse | null> {
  const sp = await db.shelfProduct.findFirst({
    where: {
      productId,
      status: { in: [ShelfProductStatus.在售, ShelfProductStatus.售罄] },
      product: {
        status: ProductStatus.正常,
      },
    },
    orderBy: { shelfTime: 'desc' },
    include: {
      category: true,
      product: {
        include: {
          brand: true,
          category: true,
          banners: true,
          appearance: true,
          tags: { include: { tag: true } },
        },
      },
      items: {
        include: { config: true },
      },
    },
  });

  if (!sp || !sp.product) return null;

  const { product } = sp;

  /* ---------- 品牌 ---------- */
  const brand = toBrandVO(product.brand);

  /* ---------- 优惠券 ---------- */
  const coupons = await queryAvailableCouponsByProductId(product.id, userId);

  /* ---------- 标签 ---------- */
  const tags: Tag[] = product.tags
    .filter(r => r.tag.status === '启用')
    .map(r => r.tag);

  /* ---------- 上架配置（去重） ---------- */
  const configMap = new Map<string, ProductConfigVO>();
  for (const item of sp.items) {
    if (!item.config) continue;
    const c = item.config;
    configMap.set(c.id, {
      id: c.id,
      productId: c.productId,
      config1: c.config1,
      config2: c.config2,
      config3: c.config3 ?? undefined,
      salePrice: c.salePrice.toNumber(),
      originalPrice: c.originalPrice.toNumber(),
      configImage: c.configImage ?? undefined,
      createdAt: fmt(c.createdAt)!,
      updatedAt: fmt(c.updatedAt)!,
      status: c.status,
    });
  }

  /* ---------- 判断是否加入购物车 ---------- */
  let hasShopCart = false;
  if (userId && sp.items.length > 0) {
    const configIds = sp.items.map(item => item.configId);
    const cartItem = await db.cart.findFirst({
      where: {
        userId,
        productId,
        configId: { in: configIds },
        status: '有效',
      },
    });
    hasShopCart = !!cartItem;
  }

  return {
    shelf: {
      id: sp.id,
      categoryId: sp.categoryId,
      isSelfOperated: sp.isSelfOperated,
      isCustomizable: sp.isCustomizable,
      installment: sp.installment,
      shelfTime: fmt(sp.shelfTime)!,
      updatedAt: fmt(sp.updatedAt)!,
      offShelfTime: fmt(sp.offShelfTime),
      status: sp.status,
      category: {
        id: sp.category.id,
        name: sp.category.name,
        code: sp.category.code,
        parentId: sp.category.parentId ?? undefined,
        status: sp.category.status,
        createdAt: fmt(sp.category.createdAt)!,
        creatorId: sp.category.creatorId,
      },
    },
    product: {
      id: product.id,
      brandId: product.brandId,
      categoryId: product.categoryId,
      name: product.name,
      subTitle: product.subTitle ?? undefined,
      description: product.description ?? undefined,
      mainImage: product.mainImage ?? undefined,
      createdAt: fmt(product.createdAt)!,
      creatorId: product.creatorId,
      updatedAt: fmt(product.updatedAt)!,
      status: product.status,
      category: {
        id: product.category.id,
        name: product.category.name,
        code: product.category.code,
        parentId: product.category.parentId ?? undefined,
        status: product.category.status,
        createdAt: fmt(product.category.createdAt)!,
        creatorId: product.category.creatorId,
      },
    },
    brand,
    banners: toBannerVO(product.banners),
    appearances: toAppearanceVO(product.appearance),
    configs: [...configMap.values()],
    shelfItems: sp.items.map(it => ({
      configId: it.configId,
      shelfNum: it.shelfNum,
      lockNum: it.lockNum,
      updatedAt: fmt(it.updatedAt)!,
    })),
    coupons: coupons as CouponItem[],
    tags,
    hasShopCart, 
  };
}

/* ===========================================================
 * 获取秒杀商品详情
 * =========================================================== */
export async function getSeckillProductDetailService(
  productId: string,
  seckillRoundId: string,
): Promise<SeckillProductDetailResponse | null> {
  const now = new Date();

  const sp = await db.seckillProduct.findFirst({
    where: {
      productId,
      roundId: seckillRoundId,
      round: {
        status: SeckillRoundStatus.启用,
        endTime: { gt: now },
      },
      product: {
        status: ProductStatus.正常,
      },
    },
    include: {
      round: true,
      product: {
        include: {
          brand: true,
          category: true,
          banners: true,
          appearance: true,
          tags: { include: { tag: true } },
        },
      },
      configs: {
        include: {
          config: true,
        },
      },
    },
  });

  if (!sp || !sp.product || !sp.round) return null;

  const { product } = sp;

  const brand = toBrandVO(product.brand);

  const tags: Tag[] = product.tags
    .filter(r => r.tag.status === '启用')
    .map(r => r.tag);

  const seckillConfigs: SeckillConfigDetailVO[] = sp.configs
    .filter(cfg => !!cfg.config)
    .map(cfg => ({
      id: cfg.id,
      configId: cfg.configId,
      shelfNum: cfg.shelfNum,
      remainNum: cfg.remainNum,
      lockNum: cfg.lockNum,
      seckillPrice: cfg.seckillPrice.toNumber(),
      status: cfg.status,
      createdAt: fmt(cfg.createdAt)!,
      updatedAt: fmt(cfg.updatedAt)!,
      config: {
        id: cfg.config!.id,
        productId: cfg.config!.productId,
        config1: cfg.config!.config1,
        config2: cfg.config!.config2,
        config3: cfg.config!.config3 ?? undefined,
        salePrice: cfg.config!.salePrice.toNumber(),
        originalPrice: cfg.config!.originalPrice.toNumber(),
        configImage: cfg.config!.configImage ?? undefined,
        createdAt: fmt(cfg.config!.createdAt)!,
        updatedAt: fmt(cfg.config!.updatedAt)!,
        status: cfg.config!.status,
      },
    }));

  return {
    seckill: {
      id: sp.id,
      productId: sp.productId,
      type: sp.type,
      reduceAmount: sp.reduceAmount.toNumber(),
      discount: sp.discount.toNumber(),
    },
    round: {
      id: sp.round.id,
      title: sp.round.title,
      startTime: fmt(sp.round.startTime)!,
      endTime: fmt(sp.round.endTime)!,
      status: sp.round.status,
    },
    product: {
      id: product.id,
      brandId: product.brandId,
      categoryId: product.categoryId,
      name: product.name,
      subTitle: product.subTitle ?? undefined,
      description: product.description ?? undefined,
      mainImage: product.mainImage ?? undefined,
      createdAt: fmt(product.createdAt)!,
      creatorId: product.creatorId,
      updatedAt: fmt(product.updatedAt)!,
      status: product.status,
      category: {
        id: product.category.id,
        name: product.category.name,
        code: product.category.code,
        parentId: product.category.parentId ?? undefined,
        status: product.category.status,
        createdAt: fmt(product.category.createdAt)!,
        creatorId: product.category.creatorId,
      },
    },
    brand,
    banners: toBannerVO(product.banners),
    appearances: toAppearanceVO(product.appearance),
    seckillConfigs,
    tags,
  };
}
