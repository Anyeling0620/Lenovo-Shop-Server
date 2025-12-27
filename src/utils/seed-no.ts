// scripts/seed.ts
import { faker } from '@faker-js/faker';
import { db } from './db';

async function main() {
  console.log('开始生成数据...');

  // 创建用户
  const user = await db.user.create({
    data: {
      email: faker.internet.email(), // 自动生成随机唯一邮箱
      password: '123456',
      account: faker.internet.username(), // 随机用户名
      nickname: '测试用户',
      memberType: '普通会员',
      gender: 'man',
      birthday: faker.date.birthdate({ min: 18, max: 60, mode: 'age' }),
      avatar: faker.image.avatar(),
    },
  });


  // 创建标签
  const tagNames = ['新品', '热卖', '促销', '限量', '推荐'];
  const tags = [];
  for (const name of tagNames) {
    const tag = await db.tag.create({ data: { name } });
    tags.push(tag);
  }

  // 创建优惠券
  const coupons = [];
  for (let i = 0; i < 20; i++) {
    const type = faker.helpers.arrayElement(['CASH', 'DISCOUNT']);
    const coupon = await db.coupon.create({
      data: {
        name: `${type} 优惠券${i + 1}`,
        type: type as 'CASH' | 'DISCOUNT',
        value: type === 'CASH' ? faker.number.float({ min: 5, max: 50, fractionDigits: 2 }) : faker.number.float({ min: 0.1, max: 0.9, fractionDigits: 2 }),
        threshold: faker.number.float({ min: 50, max: 500, fractionDigits: 2 }),
        startAt: faker.date.past(),
        expireAt: faker.date.future(),
        stackable: faker.datatype.boolean(),
      },
    });
    coupons.push(coupon);
  }

  // 创建代金券并关联用户
  const voucher = await db.voucher.create({
    data: {
      title: '新用户代金券',
      amount: 100,
      startAt: faker.date.past(),
      endAt: faker.date.future(),
      userVouchers: {
        create: {
          userId: user.id,
          status: 'UNUSED',
        },
      },
    },
  });

  // 创建 50 个商品及其关联
  const categories = ['笔记本', '台式机', '显示器', '平板', '手机', '配件'];

  for (let i = 0; i < 50; i++) {
    const category = faker.helpers.arrayElement(categories);

    await db.product.create({
      data: {
        category: category as any,
        brand: faker.company.name(),
        name: faker.commerce.productName(),
        description: faker.commerce.productDescription(),
        mainImage: faker.image.url(),
        homeRecommend: faker.datatype.boolean(),
        homeCarousel: faker.datatype.boolean(),
        homeCarouselImg: faker.image.url(),
        carousel: faker.datatype.boolean(),
        carouselImg: faker.image.url(),
        selfOperated: faker.datatype.boolean(),
        customizable: faker.datatype.boolean(),
        installment: faker.datatype.boolean(),
        installmentNum: faker.helpers.arrayElement([6, 12, 24]),
        publishedAt: faker.date.past(),
        unpublishedAt: faker.date.future(),

        // 标签关联
        tags: { create: tags.map(tag => ({ tagId: tag.id })) },

        // 商品宣传图
        promoImages: {
          create: [
            { index: 1, image: faker.image.url() },
            { index: 2, image: faker.image.url() },
          ],
        },

        // 商品外观图
        appearanceImgs: {
          create: [
            { image: faker.image.url() },
            { image: faker.image.url() },
          ],
        },

        // 商品配置
        configs: {
          create: [
            {
              style: '黑色',
              name: '基础款',
              price: faker.number.float({ min: 1000, max: 5000, fractionDigits: 2 }),
              originalPrice: faker.number.float({ min: 5000, max: 10000, fractionDigits: 2 }),
              stock: faker.number.int({ min: 10, max: 100 }),
              image: faker.image.url(),
            },
            {
              style: '白色',
              name: '高配款',
              price: faker.number.float({ min: 5000, max: 10000, fractionDigits: 2 }),
              originalPrice: faker.number.float({ min: 10000, max: 20000, fractionDigits: 2 }),
              stock: faker.number.int({ min: 5, max: 50 }),
              image: faker.image.url(),
            },
          ],
        },

        // 商品优惠券关联
        productCoupons: {
          create: coupons.slice(i % 20, (i % 20) + 2).map(c => ({ couponId: c.id })),
        },
      },
    });
  }

  console.log('50 个商品及关联数据创建完成');
}

main()
  .then(() => console.log('数据生成完成'))
  .catch(e => console.error(e))
  .finally(async () => await db.$disconnect());
