import { Context } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { getProductEvaluationsService, likeEvaluationService } from '../../services/client/evaluation.service';

export async function getProductEvaluationsController(c: Context) {
  const productId = c.req.param('productId');
  if (!productId) {
    throw new HTTPException(400, { message: '缺少参数' });
  }

  const data = await getProductEvaluationsService(productId);
  return c.json({ code: 200, message: 'success', data });
}

export const likeEvaluationController = async (c: Context) => {
  const evaluationId = c.req.param('evaluationId');
  if (!evaluationId) throw new HTTPException(400, { message: '缺少参数' });
  const updated = await likeEvaluationService(evaluationId);
  
  return c.json({ code: 200, message: 'success', data: updated });
}

