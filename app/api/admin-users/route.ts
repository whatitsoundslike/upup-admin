import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

// 관리자 목록 조회
export async function GET() {
    try {
        const adminUsers = await prisma.adminUser.findMany({
            select: {
                id: true,
                username: true,
                name: true,
                permissions: true,
                isSuper: true,
                createdAt: true,
                updatedAt: true,
            },
            orderBy: { createdAt: 'desc' },
        });

        const formattedUsers = adminUsers.map((user) => ({
            ...user,
            id: user.id.toString(),
        }));

        return NextResponse.json(formattedUsers);
    } catch (error) {
        console.error('Failed to fetch admin users:', error);
        return NextResponse.json(
            { error: '관리자 목록을 불러오는데 실패했습니다.' },
            { status: 500 }
        );
    }
}

// 관리자 생성
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { username, password, name, permissions, isSuper } = body;

        if (!username || !password) {
            return NextResponse.json(
                { error: '아이디와 비밀번호는 필수입니다.' },
                { status: 400 }
            );
        }

        const existingUser = await prisma.adminUser.findUnique({
            where: { username },
        });

        if (existingUser) {
            return NextResponse.json(
                { error: '이미 존재하는 아이디입니다.' },
                { status: 400 }
            );
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const adminUser = await prisma.adminUser.create({
            data: {
                username,
                password: hashedPassword,
                name: name || null,
                permissions: permissions || [],
                isSuper: isSuper || false,
            },
            select: {
                id: true,
                username: true,
                name: true,
                permissions: true,
                isSuper: true,
                createdAt: true,
            },
        });

        return NextResponse.json({
            ...adminUser,
            id: adminUser.id.toString(),
        });
    } catch (error) {
        console.error('Failed to create admin user:', error);
        return NextResponse.json(
            { error: '관리자 생성에 실패했습니다.' },
            { status: 500 }
        );
    }
}
