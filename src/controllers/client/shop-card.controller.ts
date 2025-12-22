import { log } from "console";
import { Context } from "hono";
import { addToShoppingCardService, getShopCardsService } from "../../services/client/shop-card.service";

export async function addToShoppingCardController(c: Context) {
    const user = c.get('user');
    const userId = user?.user_id

    const body = await c.req.json()
    const configId  =  body.configId
    await addToShoppingCardService(userId,configId)

     return c.json({
        code: 201,
        message: 'success',
        data:null
    },201)
}



export async function getShoppingCardController(c: Context) {
    const user = c.get('user');
    const userId = user?.user_id

    const data = await getShopCardsService(userId)

    return c.json({
        code: 200,
        message: 'success',
        data: data,
    })
}