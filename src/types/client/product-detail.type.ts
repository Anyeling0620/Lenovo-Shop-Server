import { ShelfProductStatus, SeckillRoundStatus, SeckillType, SeckillProductConfigStatus, ProductStatus, CategoryStatus, Tag } from '@prisma/client';
import { CategoryVO, ProductConfigVO, ProductVO, CouponItem } from './product.type';

export interface BrandVO {
  id: string;
  name: string;
  code: string;
  logo?: string | null;
}

export interface BannerImageVO {
  image: string;
  sort: number;
  createdAt: string; // YYYY-MM-DD HH:mm:ss
}

export interface AppearanceImageVO {
  image: string;
  createdAt: string; // YYYY-MM-DD HH:mm:ss
}

export interface ShelfItemVO {
  configId: string;
  shelfNum: number;
  lockNum: number;
  updatedAt: string; // YYYY-MM-DD HH:mm:ss
}

export interface ShelfProductBriefVO {
  id: string;
  categoryId: string;
  isSelfOperated: boolean;
  isCustomizable: boolean;
  installment: number; // 分期（月数，0/6/12/24）
  shelfTime: string; // YYYY-MM-DD HH:mm:ss
  updatedAt: string; // YYYY-MM-DD HH:mm:ss
  offShelfTime?: string | null; // YYYY-MM-DD HH:mm:ss
  status: ShelfProductStatus;
  category: CategoryVO;
}

export interface ShelfProductDetailResponse {
  shelf: ShelfProductBriefVO;
  product: ProductVO;
  brand: BrandVO;
  banners: BannerImageVO[];
  appearances: AppearanceImageVO[];
  configs: ProductConfigVO[]; // 上架配置（来自上架项关联的配置）
  shelfItems: ShelfItemVO[]; // 每个配置的上架数量/锁定数量
  coupons: CouponItem[]; // 可用优惠券
  tags: Tag[];
  hasShopCart:boolean;
}

export interface SeckillRoundBriefVO {
  id: string;        // 轮次id
  title: string;
  startTime: string; // YYYY-MM-DD HH:mm:ss
  endTime: string;   // YYYY-MM-DD HH:mm:ss
  status: SeckillRoundStatus;
}

export interface SeckillConfigDetailVO {
  id: string;
  configId: string;
  shelfNum: number;
  remainNum: number;
  lockNum: number;
  seckillPrice: number;
  status: SeckillProductConfigStatus;
  createdAt: string; // YYYY-MM-DD HH:mm:ss
  updatedAt: string; // YYYY-MM-DD HH:mm:ss
  config: ProductConfigVO; // 对应的商品原始配置
}

export interface SeckillProductDetailResponse {
  seckill: {
    id: string;
    productId: string;
    type: SeckillType;
    reduceAmount: number;
    discount: number;
  };
  round: SeckillRoundBriefVO;
  product: ProductVO;
  brand: BrandVO;
  banners: BannerImageVO[];
  appearances: AppearanceImageVO[];
  seckillConfigs: SeckillConfigDetailVO[]; // 秒杀配置
  tags: Tag[]; // 返回有效在用的标签
}
