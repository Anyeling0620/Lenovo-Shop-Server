import { log } from "console";
import { Context } from "hono";
import {
    addToShoppingCardService,
    deleteShopCardsService,
    getShopCardsService
} from "../../services/client/shop-card.service";

export async function addToShoppingCardController(c: Context) {
    const user = c.get('user');
    const userId = user?.user_id

    const body = await c.req.json()
    const configId = body.configId
    await addToShoppingCardService(userId, configId)

    return c.json({
        code: 201,
        message: 'success',
        data: null
    }, 201)
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


/**
 * 删除购物车项目的控制器函数
 * @async
 * @function deleteShoppingCardsController
 * @param {Context} c - Hono框架的上下文对象，包含请求和响应信息
 * @returns {Promise<Response>} 返回一个Promise，解析为JSON格式的响应对象
 * 
 * 处理流程：
 * 1. 从上下文中获取当前用户信息
 * 2. 提取用户ID
 * 3. 从请求体中解析要删除的卡片ID数组
 * 4. 记录删除的卡片ID（日志）
 * 5. 调用服务层函数执行删除操作
 * 6. 返回包含操作结果的JSON响应
 * 
 * 响应格式：
 * {
 *     code: 201,
 *     message: '删除购物车成功',
 *     data: { count: 删除的项目数量 }
 * }
 */
export async function deleteShoppingCardsController(c: Context) {
    const user = c.get('user');
    const userId = user?.user_id
    const card_ids = await c.req.json()


    const count = await deleteShopCardsService(userId, card_ids)

    return c.json({
        code: 201,
        message: '删除购物车成功',
        data: { count }
    }, 201)
}
