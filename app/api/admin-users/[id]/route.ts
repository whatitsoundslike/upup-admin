import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

// 관리자 수정
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { username, password, name, permissions, isSuper } = body;

        const existingUser = await prisma.adminUser.findUnique({
            where: { id: BigInt(id) },
        });

        if (!existingUser) {
            return NextResponse.json(
                { error: '관리자를 찾을 수 없습니다.' },
                { status: 404 }
            );
        }

        // 아이디 중복 체크 (자기 자신 제외)
        if (username && username !== existingUser.username) {
            const duplicateUser = await prisma.adminUser.findUnique({
                where: { username },
            });
            if (duplicateUser) {
                return NextResponse.json(
                    { error: '이미 존재하는 아이디입니다.' },
                    { status: 400 }
                );
            }
        }

        const updateData: {
            username?: string;
            password?: string;
            name?: string | null;
            permissions?: string[];
            isSuper?: boolean;
        } = {};

        if (username) updateData.username = username;
        if (password) updateData.password = await bcrypt.hash(password, 10);
        if (name !== undefined) updateData.name = name || null;
        if (permissions !== undefined) updateData.permissions = permissions;
        if (isSuper !== undefined) updateData.isSuper = isSuper;

        const adminUser = await prisma.adminUser.update({
            where: { id: BigInt(id) },
            data: updateData,
            select: {
                id: true,
                username: true,
                name: true,
                permissions: true,
                isSuper: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        return NextResponse.json({
            ...adminUser,
            id: adminUser.id.toString(),
        });
    } catch (error) {
        console.error('Failed to update admin user:', error);
        return NextResponse.json(
            { error: '관리자 수정에 실패했습니다.' },
            { status: 500 }
        );
    }
}

// 관리자 삭제
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const existingUser = await prisma.adminUser.findUnique({
            where: { id: BigInt(id) },
        });

        if (!existingUser) {
            return NextResponse.json(
                { error: '관리자를 찾을 수 없습니다.' },
                { status: 404 }
            );
        }

        await prisma.adminUser.delete({
            where: { id: BigInt(id) },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Failed to delete admin user:', error);
        return NextResponse.json(
            { error: '관리자 삭제에 실패했습니다.' },
            { status: 500 }
        );
    }
}
