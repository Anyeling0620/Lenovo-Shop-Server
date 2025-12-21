import { Hono } from "hono";
import { getProductCardController,
getProductCardByNewController,
getProductCardIndexController,
getSeckillProductCardController,
getProductCardBySearchController
} from "../../controllers/client/product.controller";
import { getProductEvaluationsController, likeEvaluationController } from "../../controllers/client/evaluation.controller";
import { getSeckillProductDetailController, getShelfProductDetailController } from "../../controllers/client/product-detail.controller";
import { jwtMiddleware } from "../../middleware/jwt.middleware";
import { jwtLooseMiddleware } from "../../middleware/jwt-loose.middleware";




const products = new Hono()

// 获取商品列表
products.get("/product-cards/:category-code",jwtLooseMiddleware, getProductCardController);
products.get("/new-product-cards",jwtLooseMiddleware, getProductCardByNewController);
products.get("/index-product-cards",jwtLooseMiddleware, getProductCardIndexController);

// 获取秒杀商品 -- 不可购买多个 
products.get("/seckill-product-cards",jwtLooseMiddleware, getSeckillProductCardController); 

// 搜索商品  -- 优惠券/收藏夹
products.get("/search-product-cards",jwtLooseMiddleware, getProductCardBySearchController);

// 商品评价列表
products.get("/:productId/evaluations", getProductEvaluationsController);

// 点赞商品评价
products.get("/evaluations/:evaluationId/like", jwtMiddleware ,likeEvaluationController);

// 商品详情（货架售卖） -- 优惠券/收藏夹
products.get("/shelf-products/:id/detail",jwtLooseMiddleware, getShelfProductDetailController);

// 商品详情（秒杀区）-- 不可重复购买
products.get("/seckill-products/:seckillId/:id/detail",jwtLooseMiddleware, getSeckillProductDetailController);

export default products
