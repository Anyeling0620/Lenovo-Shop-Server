import { Context } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { ProductType, SearchFiltersType } from '../../types/client/product.type';
import {
  getProductCardByCategoryService, getProductCardByNewService, getProductCardIndexService,
  getSeckillProductCardService, getProductCardBySearchService
} from '../../services/client/product.service';
import { log } from 'node:console';

/**
 * 根据品类编码获取商品卡片控制器（无分页，返回所有满足条件的商品）
 * 核心逻辑：仅返回上架数量>0的商品配置
 * @param c Hono Context
 * @returns JSON响应
 */
export async function getProductCardController(c: Context) {
  const user = c.get('user');
  const userId = user?.user_id;

  // 1. 获取查询参数（仅categoryCode，必传）
  const categoryCode = c.req.param('category-code') as ProductType;

  // 验证品类编码是否传入
  if (!categoryCode) {
    throw new HTTPException(400, { message: '品类编码categoryCode为必传参数' });
  }

  // 2. 调用服务层获取数据
  const productCardData = await getProductCardByCategoryService({
    categoryCode, userId
  });

  // 3. 返回响应
  return c.json({
    code: 200,
    message: 'success',
    data: productCardData,
  });

}


export async function getProductCardByNewController(c: Context) {
  const user = c.get('user');
  const userId = user?.user_id;

  // 2. 调用服务层获取数据
  const productCardData = await getProductCardByNewService(userId);

  // 3. 返回响应
  return c.json({
    code: 200,
    message: 'success',
    data: productCardData,
  });

}

export async function getProductCardIndexController(c: Context) {
  const user = c.get('user');
  const userId = user?.user_id;
  // 2. 调用服务层获取数据
  const productCardData = await getProductCardIndexService();

  // 3. 返回响应
  return c.json({
    code: 200,
    message: 'success',
    data: productCardData,
  });

}

export async function getSeckillProductCardController(c: Context) {
  const user = c.get('user');
  const userId = user?.user_id;
  // 调用服务层获取秒杀商品卡片数据
  const seckillProductCardData = await getSeckillProductCardService(userId);

  return c.json({
    code: 200,
    message: 'success',
    data: seckillProductCardData,
  });

}


// 获取搜索商品卡片控制器
export async function getProductCardBySearchController(c: Context) {
  const q = c.req.query();
  const user = c.get('user');
  const userId = user?.user_id;

  const first = (keys: string[], def?: string) => {
    for (const k of keys) {
      if (q[k] !== undefined) return q[k];
    }
    return def;
  };
  const toBool = (v: string | undefined, def = false) => {
    if (v === undefined) return def;
    const s = String(v).toLowerCase();
    return s === 'true' || s === '1' || s === 'yes' || s === 'on';
  };
  const toNum = (v: string | undefined): number | undefined => {
    if (v === undefined || v === '') return undefined;
    const n = Number(v);
    return Number.isNaN(n) ? undefined : n;
  };

  const sortBy = (first(['sortBy'], 'recommend') as 'recommend' | 'new' | 'comment' | 'price');
  const priceOrder = first(['priceOrder'], undefined) as 'asc' | 'desc' | undefined;
  const commentOrder = first(['commentOrder'], undefined) as 'asc' | 'desc' | undefined;
  const inStock = toBool(first(['inStock'], 'false'));
  const keyword = first(['keyword'], undefined);

  const min = toNum(first(['priceRange[min]', 'priceRange.min', 'min'], undefined));
  const max = toNum(first(['priceRange[max]', 'priceRange.max', 'max'], undefined));

  const self = toBool(first(['tabFilters[self]', 'tabFilters.self', 'self'], 'false'));
  const discountCoupon = toBool(first(['tabFilters[discountCoupon]', 'tabFilters.discountCoupon', 'discountCoupon'], 'false'));
  const custom = toBool(first(['tabFilters[custom]', 'tabFilters.custom', 'custom'], 'false'));
  const installment = toBool(first(['tabFilters[installment]', 'tabFilters.installment', 'installment'], 'false'));
  const tradeIn = toBool(first(['tabFilters[tradeIn]', 'tabFilters.tradeIn', 'tradeIn'], 'false'));

  const params: SearchFiltersType = {
    sortBy,
    priceOrder,
    commentOrder,
    inStock,
    priceRange: { min, max },
    tabFilters: { self, discountCoupon, custom, installment, tradeIn },
    keyword,
  };

  const productCardData = await getProductCardBySearchService(params, userId);
  return c.json(
    {
      code: 200,
      message: 'success',
      data: productCardData,
    },
    200,
  );
}

