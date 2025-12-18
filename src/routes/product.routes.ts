import { Hono } from "hono";
import {
getProductsByTypeController,
getNewProductsController,
getIndexProductGroupsController
 } from "../controllers/product.controller";



const products = new Hono()

products.get('/:type', getProductsByTypeController);
products.get('/new/index', getNewProductsController);
products.get('/index/groups', getIndexProductGroupsController);


export default products

