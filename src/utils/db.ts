// src/utils/db.ts
import { PrismaClient } from '@prisma/client';

// 声明全局变量，避免在开发环境中多次实例化 PrismaClient
declare global {
  var prisma: PrismaClient | undefined;
}

// 如果是生产环境直接使用，否则复用全局实例（避免热重载多次连接）
export const db =
  global.prisma ||
  new PrismaClient({
    log: ['query', 'info', 'warn', 'error'], // 可打印 SQL 和日志
  });

if (process.env.NODE_ENV !== 'production') {
  global.prisma = db;
}