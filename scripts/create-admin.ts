import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createAdmin() {
    const username = process.argv[2];
    const password = process.argv[3];
    const name = process.argv[4] || null;
    const isSuper = process.argv[5] === 'true' || process.argv[5] === '1';
    const permissions = process.argv[6] ? process.argv[6].split(',') : [];

    if (!username || !password) {
        console.error('사용법: npx ts-node scripts/create-admin.ts <username> <password> [name] [isSuper] [permissions]');
        console.error('');
        console.error('예시:');
        console.error('  - 슈퍼 관리자: npx ts-node scripts/create-admin.ts admin 1234 관리자 true');
        console.error('  - 일반 관리자: npx ts-node scripts/create-admin.ts editor 1234 에디터 false tesla,baby');
        console.error('');
        console.error('permissions: 쉼표로 구분된 카테고리 목록 (예: tesla,baby)');
        process.exit(1);
    }

    try {
        const existingUser = await prisma.adminUser.findUnique({
            where: { username },
        });

        if (existingUser) {
            console.error(`오류: '${username}' 아이디는 이미 존재합니다.`);
            process.exit(1);
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const adminUser = await prisma.adminUser.create({
            data: {
                username,
                password: hashedPassword,
                name,
                isSuper,
                permissions: isSuper ? [] : permissions,
            },
        });

        console.log('관리자 계정이 생성되었습니다:');
        console.log(`  - ID: ${adminUser.id}`);
        console.log(`  - 아이디: ${adminUser.username}`);
        console.log(`  - 이름: ${adminUser.name || '(없음)'}`);
        console.log(`  - 슈퍼 관리자: ${adminUser.isSuper ? '예' : '아니오'}`);
        if (!adminUser.isSuper) {
            const perms = adminUser.permissions as string[] | null;
            console.log(`  - 권한: ${perms && perms.length > 0 ? perms.join(', ') : '(없음)'}`);
        }
    } catch (error) {
        console.error('오류 발생:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

createAdmin();
