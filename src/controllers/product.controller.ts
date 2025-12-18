import { HTTPException } from 'hono/http-exception';
import { getProductsService, getNewProductsSerevice ,getIndexProductsService} from '../services/product.service';
import { ProductType } from '../types/product.type';


const isValidProductType = (type: string): type is ProductType => {
    return ['notebooks', 'tablets', 'desktops', 'monitor', 'phones', 'fittings'].includes(type);
};


export async function getProductsByTypeController(c: any) {

  const type = c.req.param('type');

  if (!type || !isValidProductType(type)) throw new HTTPException(400, { message: "无效的参数" })

  const data = await getProductsService(type);

  return c.json({
    code: 200,
    message: 'success',
    data
  });

}


export async function getNewProductsController(c: any) {
  
  const data = await getNewProductsSerevice()

  return c.json({
    code: 200,
    message: 'success',
    data
  });
  
}


export async function getIndexProductGroupsController(c:any) {
  const data = await getIndexProductsService()
  return c.json({
    code: 200,
    message: 'success',
    data
  })
}