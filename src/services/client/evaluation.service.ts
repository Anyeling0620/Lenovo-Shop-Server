import { db } from '../../utils/db';
import { ProductEvaluationListResponse } from '../../types/client/evaluation.type';
import { HTTPException } from 'hono/http-exception';

// format Date to 'YYYY-MM-DD HH:mm:ss'
const formatDateTime = (d: Date) => {
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
};

export async function getProductEvaluationsService(productId: string): Promise<ProductEvaluationListResponse> {
  if (!productId) {
    return { items: [] };
  }

  const evaluations = await db.productEvaluation.findMany({
    where: { productId },
    orderBy: { createdAt: 'desc' },
    include: {
      user: {
        select: {
          id: true,
          nickname: true,
          avatar: true,
        },
      },
      images: {
        select: { image: true },
      },
      product: {
        select: { name: true },
      },
      config: {
        select: { config1: true, config2: true, config3: true },
      },
    },
  });

  const items = evaluations.map((e) => ({
    id: e.id,
    productName: e.product?.name ?? '',
    configs: [e.config?.config1, e.config?.config2, e.config?.config3].filter(Boolean) as string[],
    userId: e.userId,
    star: e.star?.toNumber ? e.star.toNumber() : (e.star as unknown as number),
    content: e.content ?? null,
    createdAt: formatDateTime(e.createdAt),
    images: (e.images || []).map((img) => img.image),
    user: {
      id: e.user.id,
      nickname: e.user.nickname ?? null,
      avatar: e.user.avatar ?? null,
    },
    likeNum: e.likeNum,
  }));

  return { items };
}


export async function likeEvaluationService(id: string) {

  const like = await db.productEvaluation.findUnique({
  where: { id: id }, // 主键查询
});

// 此时 like 可能是 null，判断会生效
if (!like) {
  throw new HTTPException(404, { message: "不存在的评价" });
}

  return await db.productEvaluation.update({
    where: { id: id },
    data: { likeNum: { increment: 1 } },
    select: { id: true, likeNum: true },
  });
}
