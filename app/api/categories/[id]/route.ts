import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// 카테고리 수정
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { value, label, sortOrder, isActive } = body;

        if (!value || !label) {
            return NextResponse.json(
                { error: '값과 이름은 필수입니다.' },
                { status: 400 }
            );
        }

        // 중복 체크 (자기 자신 제외)
        const existingCategory = await prisma.category.findFirst({
            where: {
                value,
                NOT: { id: BigInt(id) },
            },
        });

        if (existingCategory) {
            return NextResponse.json(
                { error: '이미 존재하는 카테고리 값입니다.' },
                { status: 400 }
            );
        }

        const category = await prisma.category.update({
            where: { id: BigInt(id) },
            data: {
                value,
                label,
                sortOrder: sortOrder ?? 0,
                isActive: isActive ?? true,
            },
        });

        return NextResponse.json({
            id: category.id.toString(),
            value: category.value,
            label: category.label,
            sortOrder: category.sortOrder,
            isActive: category.isActive,
            updatedAt: category.updatedAt.toISOString(),
        });
    } catch (error) {
        console.error('Failed to update category:', error);
        return NextResponse.json(
            { error: '카테고리 수정에 실패했습니다.' },
            { status: 500 }
        );
    }
}

// 카테고리 삭제 (비활성화)
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        // 실제 삭제 대신 비활성화
        const category = await prisma.category.update({
            where: { id: BigInt(id) },
            data: { isActive: false },
        });

        return NextResponse.json({
            success: true,
            id: category.id.toString(),
        });
    } catch (error) {
        console.error('Failed to delete category:', error);
        return NextResponse.json(
            { error: '카테고리 삭제에 실패했습니다.' },
            { status: 500 }
        );
    }
}
