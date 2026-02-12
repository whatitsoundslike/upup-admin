import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { username, password } = body;

        if (!username || !password) {
            return NextResponse.json(
                { error: '아이디와 비밀번호를 입력해주세요.' },
                { status: 400 }
            );
        }

        const adminUser = await prisma.adminUser.findUnique({
            where: { username },
        });

        if (!adminUser) {
            return NextResponse.json(
                { error: '아이디 또는 비밀번호가 올바르지 않습니다.' },
                { status: 401 }
            );
        }

        const isValidPassword = await bcrypt.compare(password, adminUser.password);

        if (!isValidPassword) {
            return NextResponse.json(
                { error: '아이디 또는 비밀번호가 올바르지 않습니다.' },
                { status: 401 }
            );
        }

        return NextResponse.json({
            success: true,
            user: {
                id: adminUser.id.toString(),
                username: adminUser.username,
                name: adminUser.name,
                permissions: adminUser.permissions as string[] || [],
                isSuper: adminUser.isSuper,
            },
        });
    } catch (error) {
        console.error('Login error:', error);
        return NextResponse.json(
            { error: '로그인 처리 중 오류가 발생했습니다.' },
            { status: 500 }
        );
    }
}
