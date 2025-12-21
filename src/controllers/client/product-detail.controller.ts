import { Context } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { getShelfProductDetailService, getSeckillProductDetailService } from '../../services/client/product-detail.service';
import { log } from 'console';

export async function getShelfProductDetailController(c: Context) {
  const id = c.req.param('id');
  const user = c.get('user');
  const userId = user?.user_id;
  if (!id) throw new HTTPException(400, { message: '缺少参数' });
  const data = await getShelfProductDetailService(id, userId);
  if (!data) throw new HTTPException(404, { message: '未找到商品数据' });
  return c.json({ code: 200, message: 'success', data });
}

export async function getSeckillProductDetailController(c: Context) {
  const id = c.req.param('id');
  const roundId = c.req.param('seckillId');
  if (!id || !roundId) throw new HTTPException(400, { message: '缺少参数' });
  const data = await getSeckillProductDetailService(id, roundId);
  if (!data) throw new HTTPException(404, { message: '未找到商品数据' });
  return c.json({ code: 200, message: 'success', data });
}

