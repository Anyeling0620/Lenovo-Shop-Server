# 使用 Node.js 18 镜像
FROM node:18-alpine

# 第一步：修改容器内的镜像源为阿里云，确保能下载基本工具
RUN sed -i 's/dl-cdn.alpinelinux.org/mirrors.aliyun.com/g' /etc/apk/repositories && \
    apk add --no-cache libc6-compat

# 第二步：直接通过 npm 安装 pnpm，并强制使用国内镜像源
# 这样就不需要走 Clash 代理了
RUN npm install -g pnpm --registry=https://registry.npmmirror.com

WORKDIR /app

# 第三步：复制依赖文件
COPY package.json pnpm-lock.yaml ./

# 第四步：使用国内镜像源安装依赖
RUN pnpm install --registry=https://registry.npmmirror.com

# 第五步：生成 Prisma 客户端（必须在安装依赖后）
COPY prisma ./prisma/
RUN pnpm prisma generate

# 第六步：复制源代码并启动
COPY . .
EXPOSE 3003
CMD ["pnpm", "run", "start"]
