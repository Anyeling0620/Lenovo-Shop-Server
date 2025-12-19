import { Context } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { ProductType, PushType } from '../../types/client/product.type';
import { getProductCardByCategoryService, getProductCardByNewService, getProductCardIndexService } from '../../services/client/product.service';
import { log } from 'node:console';

/**
 * 根据品类编码获取商品卡片控制器（无分页，返回所有满足条件的商品）
 * 核心逻辑：仅返回上架数量>0的商品配置
 * @param c Hono Context
 * @returns JSON响应
 */
export async function getProductCardController(c: Context) {

  // 1. 获取查询参数（仅categoryCode，必传）
  const categoryCode = c.req.param('category-code') as ProductType;

  // 验证品类编码是否传入
  if (!categoryCode) {
    throw new HTTPException(400, { message: '品类编码categoryCode为必传参数' });
  }

  // 2. 调用服务层获取数据
  const productCardData = await getProductCardByCategoryService({
    categoryCode,
  });

  // 3. 返回响应
  return c.json({
    code: 200,
    message: 'success',
    data: productCardData,
  });

}


export async function getProductCardByNewController(c: Context) {

  // 2. 调用服务层获取数据
  const productCardData = await getProductCardByNewService();

  // 3. 返回响应
  return c.json({
    code: 200,
    message: 'success',
    data: productCardData,
  });

}

export async function getProductCardIndexController(c: Context) {

  // 2. 调用服务层获取数据
  const productCardData = await getProductCardIndexService();

  // 3. 返回响应
  return c.json({
    code: 200,
    message: 'success',
    data: productCardData,
  });

}