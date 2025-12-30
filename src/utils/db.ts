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
    log: process.env.NODE_ENV === 'production' 
      ? ['warn', 'error']  // 生产环境仅记录警告和错误，性能更好
      : ['query', 'info', 'warn', 'error'], // 开发环境显示详细信息
  });

if (process.env.NODE_ENV !== 'production') {
  global.prisma = db;
}