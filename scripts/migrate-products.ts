import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

interface JsonProduct {
    id: string;
    name: string;
    price: string;
    thumbnail: string;
    deliverType?: string;
    link: string;
    order?: string;
    category: string;
}

async function migrateProducts() {
    const dataDir = path.join(process.cwd(), 'data');

    // 기존 상품 데이터 삭제 (선택사항 - 필요시 주석 해제)
    // await prisma.product.deleteMany();
    // console.log('기존 상품 데이터 삭제 완료');

    // JSON 파일 목록 가져오기
    const files = fs.readdirSync(dataDir).filter(f => f.endsWith('_shop.json'));
    console.log(`발견된 JSON 파일: ${files.join(', ')}`);

    let totalCount = 0;

    for (const file of files) {
        const filePath = path.join(dataDir, file);
        const category = file.replace('_shop.json', '');

        try {
            const data = fs.readFileSync(filePath, 'utf-8');
            const products: JsonProduct[] = JSON.parse(data);

            console.log(`\n[${category}] ${products.length}개 상품 마이그레이션 중...`);

            for (const product of products) {
                try {
                    await prisma.product.create({
                        data: {
                            category: product.category || category,
                            name: product.name,
                            price: product.price,
                            thumbnail: product.thumbnail,
                            deliverType: product.deliverType || null,
                            link: product.link,
                            sortOrder: parseInt(product.order || '0', 10),
                        },
                    });
                    totalCount++;
                } catch (err) {
                    console.error(`  - 상품 추가 실패: ${product.name}`, err);
                }
            }

            console.log(`[${category}] 완료`);
        } catch (err) {
            console.error(`파일 처리 실패: ${file}`, err);
        }
    }

    console.log(`\n총 ${totalCount}개 상품 마이그레이션 완료!`);
}

migrateProducts()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
