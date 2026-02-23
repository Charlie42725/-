const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 開始建立測試資料...\n');

  // ========== 品牌 ==========
  const brands = await Promise.all([
    prisma.brand.create({
      data: {
        name: '原神',
        slug: 'genshin-impact',
        description: 'miHoYo 開發的開放世界冒險遊戲',
        logoUrl: '/uploads/1761051292334-7e36e040661223f481f9a418841557e3.jpg',
        isActive: true,
      }
    }),
    prisma.brand.create({
      data: {
        name: '海賊王',
        slug: 'one-piece',
        description: '尾田榮一郎的經典海洋冒險漫畫',
        logoUrl: '/uploads/1760897372643-d3887191.jpg',
        isActive: true,
      }
    }),
    prisma.brand.create({
      data: {
        name: '鬼滅之刃',
        slug: 'demon-slayer',
        description: '吾峠呼世晴的人氣漫畫作品',
        logoUrl: '/uploads/1761051376386-bc16b851beb37884d9f3ac48abe191fd.jpg',
        isActive: true,
      }
    }),
    prisma.brand.create({
      data: {
        name: '咒術迴戰',
        slug: 'jujutsu-kaisen',
        description: '芥見下下的人氣少年漫畫',
        logoUrl: '/uploads/1761051397561-1e81f6802d9312b4b09b871ed420c093.jpg',
        isActive: true,
      }
    }),
  ]);

  console.log(`✅ 建立了 ${brands.length} 個品牌`);

  // ========== 商品 ==========
  const products = await Promise.all([
    // 原神商品 1
    prisma.product.create({
      data: {
        brandId: brands[0].id,
        name: '一番賞 原神 璃月仙境',
        slug: 'genshin-liyue-wonderland',
        shortDescription: '璃月港主題限定一番賞，收錄鍾離、凝光等人氣角色',
        longDescription: '此系列以璃月港的壯麗風景為靈感，收錄了鍾離、凝光、刻晴等人氣角色的精美公仔與周邊商品。A賞為鍾離岩王帝君形態公仔，極具收藏價值。',
        price: 350,
        totalTickets: 80,
        soldTickets: 23,
        status: 'active',
        coverImage: '/uploads/1761125283225-287624572f856bd353a15b5a0fadfc1e.png',
      }
    }),
    // 原神商品 2
    prisma.product.create({
      data: {
        brandId: brands[0].id,
        name: '一番賞 原神 稻妻雷電',
        slug: 'genshin-inazuma-raiden',
        shortDescription: '稻妻主題限定，收錄雷電將軍、神里綾華等角色',
        longDescription: '以稻妻永恆不變的雷電為主題，A賞為雷電將軍的精緻大公仔，B賞為神里綾華舞蹈造型公仔。',
        price: 400,
        totalTickets: 70,
        soldTickets: 45,
        status: 'active',
        coverImage: '/uploads/1761125288034-4928d2b15fcb21e4fba4cfde13c457b5.png',
      }
    }),
    // 海賊王商品 1
    prisma.product.create({
      data: {
        brandId: brands[1].id,
        name: '一番賞 海賊王 GEAR5',
        slug: 'one-piece-gear5',
        shortDescription: '魯夫 GEAR5 尼卡形態主題一番賞',
        longDescription: '以魯夫覺醒後的 GEAR5 尼卡形態為主題，A賞為大型尼卡魯夫公仔，造型動感十足。收錄多款角色的戰鬥姿態周邊。',
        price: 300,
        totalTickets: 100,
        soldTickets: 67,
        status: 'active',
        coverImage: '/uploads/1760897192937-1553580211-30129be9d8e1b24e375e563448554807-696x391.jpg',
      }
    }),
    // 海賊王商品 2 (已售罄)
    prisma.product.create({
      data: {
        brandId: brands[1].id,
        name: '一番賞 海賊王 四皇集結',
        slug: 'one-piece-yonko',
        shortDescription: '四皇主題一番賞，收錄四位頂級海賊',
        longDescription: '以四皇為主題的經典系列，收錄紅髮傑克斯、黑鬍子等角色。已完售。',
        price: 350,
        totalTickets: 80,
        soldTickets: 80,
        status: 'sold_out',
        coverImage: '/uploads/1760961346183-03.jpg',
      }
    }),
    // 鬼滅商品
    prisma.product.create({
      data: {
        brandId: brands[2].id,
        name: '一番賞 鬼滅之刃 煉獄杏壽郎',
        slug: 'demon-slayer-rengoku',
        shortDescription: '炎柱煉獄杏壽郎主題限定一番賞',
        longDescription: '以劇場版無限列車中大放異彩的炎柱煉獄杏壽郎為主角，A賞為煉獄杏壽郎的奧義招式動態公仔。',
        price: 350,
        totalTickets: 90,
        soldTickets: 12,
        status: 'active',
        coverImage: '/uploads/1760961309234-S__32088081.jpg',
      }
    }),
    // 咒術迴戰商品
    prisma.product.create({
      data: {
        brandId: brands[3].id,
        name: '一番賞 咒術迴戰 渋谷決戰',
        slug: 'jjk-shibuya-battle',
        shortDescription: '渋谷事變篇主題，收錄五條悟、虎杖悠仁等角色',
        longDescription: '以動畫第二季渋谷事變篇的精彩戰鬥場景為主題，A賞為五條悟解除無量空處的震撼造型。',
        price: 400,
        totalTickets: 60,
        soldTickets: 38,
        status: 'active',
        coverImage: '/uploads/1761051302681-7d398fb1848b4e8b72697e3c6f0a03ec.jpg',
      }
    }),
  ]);

  console.log(`✅ 建立了 ${products.length} 個商品`);

  // ========== 獎項 (ProductVariant) ==========
  const variantData = [
    // 原神璃月 (product 0)
    { productId: products[0].id, prize: 'A賞', name: '鍾離 岩王帝君公仔', rarity: 'SSR', value: 8000, stock: 1, imageUrl: '/uploads/1761125283225-287624572f856bd353a15b5a0fadfc1e.png' },
    { productId: products[0].id, prize: 'B賞', name: '凝光 天權公仔', rarity: 'SR', value: 5000, stock: 2, imageUrl: '/uploads/1761125288025-982711664a1bc8995415590a8a67eb97.png' },
    { productId: products[0].id, prize: 'C賞', name: '刻晴 亞克力立牌', rarity: 'SR', value: 3000, stock: 5, imageUrl: '/uploads/1761125288028-ab616b4870e5fb0fd320b89b5056a8e6.png' },
    { productId: products[0].id, prize: 'D賞', name: '璃月風景掛畫', rarity: 'R', value: 2000, stock: 10, imageUrl: '/uploads/1760961316913-LINE_ALBUM_產品細圖_250505_1.jpg' },
    { productId: products[0].id, prize: 'E賞', name: '角色徽章套組', rarity: 'R', value: 1500, stock: 20, imageUrl: '/uploads/1760961316926-LINE_ALBUM_產品細圖_250505_3.jpg' },
    { productId: products[0].id, prize: 'F賞', name: '角色透明卡', rarity: 'N', value: 800, stock: 42, imageUrl: '/uploads/1760961316927-LINE_ALBUM_產品細圖_250505_2.jpg' },
    { productId: products[0].id, prize: 'Last賞', name: '鍾離 限定特別版公仔', rarity: 'SSR', value: 10000, stock: 1, isLastPrize: true, imageUrl: '/uploads/1761125344375-287624572f856bd353a15b5a0fadfc1e.png' },

    // 原神稻妻 (product 1)
    { productId: products[1].id, prize: 'A賞', name: '雷電將軍 夢想一刀公仔', rarity: 'SSR', value: 9000, stock: 1, imageUrl: '/uploads/1761125288034-4928d2b15fcb21e4fba4cfde13c457b5.png' },
    { productId: products[1].id, prize: 'B賞', name: '神里綾華 舞蹈公仔', rarity: 'SR', value: 5500, stock: 2, imageUrl: '/uploads/1761125381128-4928d2b15fcb21e4fba4cfde13c457b5.png' },
    { productId: products[1].id, prize: 'C賞', name: '宵宮 煙火立牌', rarity: 'SR', value: 3000, stock: 5, imageUrl: '/uploads/1761125422787-982711664a1bc8995415590a8a67eb97.png' },
    { productId: products[1].id, prize: 'D賞', name: '稻妻風景畫', rarity: 'R', value: 2000, stock: 12, imageUrl: '/uploads/1760961316913-LINE_ALBUM_產品細圖_250505_1.jpg' },
    { productId: products[1].id, prize: 'E賞', name: '角色Q版吊飾', rarity: 'N', value: 1000, stock: 50, imageUrl: '/uploads/1760961316926-LINE_ALBUM_產品細圖_250505_3.jpg' },
    { productId: products[1].id, prize: 'Last賞', name: '雷電將軍 永恆特別版', rarity: 'SSR', value: 12000, stock: 1, isLastPrize: true, imageUrl: '/uploads/1761125288034-4928d2b15fcb21e4fba4cfde13c457b5.png' },

    // 海賊王 GEAR5 (product 2)
    { productId: products[2].id, prize: 'A賞', name: '魯夫 GEAR5 尼卡公仔', rarity: 'SSR', value: 8500, stock: 1, imageUrl: '/uploads/1760897192937-1553580211-30129be9d8e1b24e375e563448554807-696x391.jpg' },
    { productId: products[2].id, prize: 'B賞', name: '索隆 閻魔公仔', rarity: 'SR', value: 5000, stock: 2, imageUrl: '/uploads/1760961346183-03.jpg' },
    { productId: products[2].id, prize: 'C賞', name: '羅 ROOM 立牌', rarity: 'SR', value: 3000, stock: 5, imageUrl: '/uploads/1760961377529-04.jpg' },
    { productId: products[2].id, prize: 'D賞', name: '草帽團色紙', rarity: 'R', value: 2000, stock: 15, imageUrl: '/uploads/1760897321480-下載-(2).jpg' },
    { productId: products[2].id, prize: 'E賞', name: '角色橡膠吊飾', rarity: 'N', value: 800, stock: 77, imageUrl: '/uploads/1760896956953-下載-(1).jpg' },
    { productId: products[2].id, prize: 'Last賞', name: '魯夫 尼卡覺醒特別版', rarity: 'SSR', value: 11000, stock: 1, isLastPrize: true, imageUrl: '/uploads/1760897192937-1553580211-30129be9d8e1b24e375e563448554807-696x391.jpg' },

    // 海賊王四皇 (product 3 - sold out)
    { productId: products[3].id, prize: 'A賞', name: '紅髮傑克斯公仔', rarity: 'SSR', value: 8000, stock: 0, imageUrl: '/uploads/1760961346183-03.jpg' },
    { productId: products[3].id, prize: 'B賞', name: '黑鬍子公仔', rarity: 'SR', value: 5000, stock: 0, imageUrl: '/uploads/1760961377529-04.jpg' },
    { productId: products[3].id, prize: 'C賞', name: '大媽 立牌', rarity: 'SR', value: 3000, stock: 0, imageUrl: '/uploads/1760897321480-下載-(2).jpg' },
    { productId: products[3].id, prize: 'D賞', name: '凱多 色紙', rarity: 'R', value: 2000, stock: 0, imageUrl: '/uploads/1760896956953-下載-(1).jpg' },
    { productId: products[3].id, prize: 'E賞', name: '四皇小吊飾', rarity: 'N', value: 800, stock: 0, imageUrl: '/uploads/1760893013252-下載-(1).jpg' },

    // 鬼滅煉獄 (product 4)
    { productId: products[4].id, prize: 'A賞', name: '煉獄杏壽郎 炎虎公仔', rarity: 'SSR', value: 9000, stock: 1, imageUrl: '/uploads/1760961309234-S__32088081.jpg' },
    { productId: products[4].id, prize: 'B賞', name: '炭治郎 日之呼吸公仔', rarity: 'SR', value: 5000, stock: 2, imageUrl: '/uploads/1760961316913-LINE_ALBUM_產品細圖_250505_1.jpg' },
    { productId: products[4].id, prize: 'C賞', name: '禰豆子 血鬼術立牌', rarity: 'SR', value: 3500, stock: 5, imageUrl: '/uploads/1760961316926-LINE_ALBUM_產品細圖_250505_3.jpg' },
    { productId: products[4].id, prize: 'D賞', name: '柱合會議色紙', rarity: 'R', value: 2000, stock: 15, imageUrl: '/uploads/1760961316927-LINE_ALBUM_產品細圖_250505_2.jpg' },
    { productId: products[4].id, prize: 'E賞', name: '角色壓克力鑰匙圈', rarity: 'N', value: 1000, stock: 67, imageUrl: '/uploads/1760893013252-下載-(1).jpg' },
    { productId: products[4].id, prize: 'Last賞', name: '煉獄杏壽郎 煉獄家傳特別版', rarity: 'SSR', value: 12000, stock: 1, isLastPrize: true, imageUrl: '/uploads/1760961309234-S__32088081.jpg' },

    // 咒術迴戰 (product 5)
    { productId: products[5].id, prize: 'A賞', name: '五條悟 無量空處公仔', rarity: 'SSR', value: 10000, stock: 1, imageUrl: '/uploads/1761051292334-7e36e040661223f481f9a418841557e3.jpg' },
    { productId: products[5].id, prize: 'B賞', name: '虎杖悠仁 黑閃公仔', rarity: 'SR', value: 5000, stock: 2, imageUrl: '/uploads/1761051376386-bc16b851beb37884d9f3ac48abe191fd.jpg' },
    { productId: products[5].id, prize: 'C賞', name: '伏黑惠 十種影法術立牌', rarity: 'SR', value: 3500, stock: 4, imageUrl: '/uploads/1761051302681-7d398fb1848b4e8b72697e3c6f0a03ec.jpg' },
    { productId: products[5].id, prize: 'D賞', name: '戰鬥場景色紙', rarity: 'R', value: 2000, stock: 10, imageUrl: '/uploads/1761051397561-1e81f6802d9312b4b09b871ed420c093.jpg' },
    { productId: products[5].id, prize: 'E賞', name: '咒術師徽章', rarity: 'N', value: 800, stock: 43, imageUrl: '/uploads/1760893013252-下載-(1).jpg' },
    { productId: products[5].id, prize: 'Last賞', name: '五條悟 領域展開特別版', rarity: 'SSR', value: 15000, stock: 1, isLastPrize: true, imageUrl: '/uploads/1761051292334-7e36e040661223f481f9a418841557e3.jpg' },
  ];

  await prisma.productVariant.createMany({ data: variantData });
  console.log(`✅ 建立了 ${variantData.length} 個獎項`);

  // ========== 圖片 (Image) ==========
  const imageData = [
    // 原神璃月
    { productId: products[0].id, url: '/uploads/1761125283225-287624572f856bd353a15b5a0fadfc1e.png', type: 'cover', sortOrder: 0 },
    { productId: products[0].id, url: '/uploads/1761125288025-982711664a1bc8995415590a8a67eb97.png', type: 'gallery', sortOrder: 1 },
    { productId: products[0].id, url: '/uploads/1761125288028-ab616b4870e5fb0fd320b89b5056a8e6.png', type: 'gallery', sortOrder: 2 },
    // 原神稻妻
    { productId: products[1].id, url: '/uploads/1761125288034-4928d2b15fcb21e4fba4cfde13c457b5.png', type: 'cover', sortOrder: 0 },
    { productId: products[1].id, url: '/uploads/1761125381128-4928d2b15fcb21e4fba4cfde13c457b5.png', type: 'gallery', sortOrder: 1 },
    { productId: products[1].id, url: '/uploads/1761125422787-982711664a1bc8995415590a8a67eb97.png', type: 'gallery', sortOrder: 2 },
    // 海賊王 GEAR5
    { productId: products[2].id, url: '/uploads/1760897192937-1553580211-30129be9d8e1b24e375e563448554807-696x391.jpg', type: 'cover', sortOrder: 0 },
    { productId: products[2].id, url: '/uploads/1760961346183-03.jpg', type: 'gallery', sortOrder: 1 },
    { productId: products[2].id, url: '/uploads/1760961377529-04.jpg', type: 'gallery', sortOrder: 2 },
    // 海賊王四皇
    { productId: products[3].id, url: '/uploads/1760961346183-03.jpg', type: 'cover', sortOrder: 0 },
    { productId: products[3].id, url: '/uploads/1760961377529-04.jpg', type: 'gallery', sortOrder: 1 },
    // 鬼滅
    { productId: products[4].id, url: '/uploads/1760961309234-S__32088081.jpg', type: 'cover', sortOrder: 0 },
    { productId: products[4].id, url: '/uploads/1760961316913-LINE_ALBUM_產品細圖_250505_1.jpg', type: 'gallery', sortOrder: 1 },
    { productId: products[4].id, url: '/uploads/1760961316926-LINE_ALBUM_產品細圖_250505_3.jpg', type: 'gallery', sortOrder: 2 },
    { productId: products[4].id, url: '/uploads/1760961316927-LINE_ALBUM_產品細圖_250505_2.jpg', type: 'gallery', sortOrder: 3 },
    // 咒術迴戰
    { productId: products[5].id, url: '/uploads/1761051292334-7e36e040661223f481f9a418841557e3.jpg', type: 'cover', sortOrder: 0 },
    { productId: products[5].id, url: '/uploads/1761051376386-bc16b851beb37884d9f3ac48abe191fd.jpg', type: 'gallery', sortOrder: 1 },
    { productId: products[5].id, url: '/uploads/1761051397561-1e81f6802d9312b4b09b871ed420c093.jpg', type: 'gallery', sortOrder: 2 },
  ];

  await prisma.image.createMany({ data: imageData });
  console.log(`✅ 建立了 ${imageData.length} 張圖片`);

  // ========== 測試用戶 ==========
  const passwordHash = await bcrypt.hash('1234', 10);

  const testUser = await prisma.user.create({
    data: {
      email: 'test@example.com',
      passwordHash,
      nickname: '測試玩家',
      points: 5000,
      role: 'user',
      isEmailVerified: true,
    }
  });
  console.log(`✅ 建立測試用戶: test@example.com / 1234 (${testUser.points} 點)`);

  // 管理員
  const adminHash = await bcrypt.hash('admin1234', 10);
  const admin = await prisma.user.create({
    data: {
      email: 'admin@example.com',
      passwordHash: adminHash,
      nickname: '管理員',
      points: 0,
      role: 'admin',
      isEmailVerified: true,
    }
  });
  console.log(`✅ 建立管理員: admin@example.com / admin1234`);

  console.log('\n🎉 測試資料建立完成！');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`  品牌: ${brands.length} 個`);
  console.log(`  商品: ${products.length} 個`);
  console.log(`  獎項: ${variantData.length} 個`);
  console.log(`  圖片: ${imageData.length} 張`);
  console.log(`  用戶: 2 個`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

main()
  .catch((e) => {
    console.error('❌ 錯誤:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
