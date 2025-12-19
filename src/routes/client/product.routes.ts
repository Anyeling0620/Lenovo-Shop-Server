import { Hono } from "hono";
import { getProductCardController,
getProductCardByNewController,
getProductCardIndexController
} from "../../controllers/client/product.controller";




const products = new Hono()

products.get("/product-cards/:category-code", getProductCardController);
products.get("/new-product-cards", getProductCardByNewController);
products.get("/index-product-cards", getProductCardIndexController)

export default products

