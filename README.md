To install dependencies:
```sh
pnpm install
```

To run:
```sh
pnpm dev
```

open http://localhost:3003





## 运行前请先创建 .env 文件，并填入以下内容
```
PORT=3003
HOST=0.0.0.0
NODE_ENV=development
DATABASE_URL="mysql://root:123456@localhost:3307/lenovo_shop"

ACCESS_TOKEN_SECRET="dsyctyuioktytg78654tryuhihuesretyguiy5435sdtygy8uhbvgcfrd5"
REFRESH_TOKEN_SECRET="2345678e5dtyfg7y8ou9oljytyrydtvyg7h8ikjuytrdfyvhu"
QQ_EMAIL_USER=""
QQ_EMAIL_PASS=""
QQ_EMAIL_HOST="smtp.qq.com"

COOKIE_DOMAIN="localhost"
CORS_ORIGINS="http://localhost:3000"
```

## pnpm prisma generate // 生成数据库文件
## pnpm prisma migrate dev --name init  // 创建数据库表
