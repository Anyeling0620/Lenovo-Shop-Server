import { ShelfProduct, Product, Coupon, CouponCenter, ProductConfig } from '@prisma/client';

/**
 * 商品关联的可用优惠券信息
 */
export interface CouponItem extends CouponCenter{
  coupon: Coupon; // 优惠券信息
}

/**
 * 商品卡片信息（核心返回结构）
 */
export interface ProductCardItem {
  shelfProduct: ShelfProduct; // 货架商品全部信息
  product: Product; // 商品基本信息
  minPriceConfig: ProductConfig; // 有在售数量的最低售价配置
  coupons: CouponItem[]; // 关联的可用优惠券
}

/**
 * 单品类商品卡片返回结果（无分页，返回所有满足条件的商品）
 */
export interface SingleProductCardResponse {
  items: ProductCardItem[]; // 该品类的所有商品卡片
}

export interface ProductGroup{
  title: string | ProductType; //  (ProductCardIndexResponse)品牌名+品类名  (ProductCardNewResponse)品类名
  items: ProductCardItem[]; // 该品牌+品类的所有商品卡片
}

export interface CarouseProduct{
  image : string;
  product : ProductCardItem;
}

export interface ProductCardNewResponse {
  carouselItems: CarouseProduct[]; // 轮播图
  items: ProductGroup[];  // 该品类的所有商品卡片
}
export interface ProductCardIndexResponse{
  carouselItems: CarouseProduct[]; // 轮播图
  items: ProductGroup[]; // 该品牌+品类的所有商品卡片
}

/**
 * 产品类型枚举（对应品类表的code字段）
 */
export enum ProductType {
  LAPTOP = "LAPTOP",
  DESKTOP = "DESKTOP",
  MONITOR = "MONITOR",
  TABLET = "TABLET",
  PHONE = "PHONE",
  SERVICE = "SERVICE",
  PART = "PART"
}

/**
 * 商品卡片查询参数（仅保留品类编码）
 */
export interface ProductCardQuery {
  categoryCode: ProductType; // 品类编码（必传）
}

