import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// 카테고리 목록 조회
export async function GET() {
    try {
        const categories = await prisma.category.findMany({
            where: { isActive: true },
            orderBy: { sortOrder: 'asc' },
        });

        const formattedCategories = categories.map((cat) => ({
            id: cat.id.toString(),
            value: cat.value,
            label: cat.label,
            sortOrder: cat.sortOrder,
            isActive: cat.isActive,
            createdAt: cat.createdAt.toISOString(),
            updatedAt: cat.updatedAt.toISOString(),
        }));

        return NextResponse.json(formattedCategories);
    } catch (error) {
        console.error('Failed to fetch categories:', error);
        return NextResponse.json(
            { error: '카테고리 목록을 불러오는데 실패했습니다.' },
            { status: 500 }
        );
    }
}

// 카테고리 생성
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { value, label, sortOrder } = body;

        if (!value || !label) {
            return NextResponse.json(
                { error: '값과 이름은 필수입니다.' },
                { status: 400 }
            );
        }

        // 중복 체크
        const existingCategory = await prisma.category.findUnique({
            where: { value },
        });

        if (existingCategory) {
            return NextResponse.json(
                { error: '이미 존재하는 카테고리 값입니다.' },
                { status: 400 }
            );
        }

        const category = await prisma.category.create({
            data: {
                value,
                label,
                sortOrder: sortOrder || 0,
            },
        });

        return NextResponse.json({
            id: category.id.toString(),
            value: category.value,
            label: category.label,
            sortOrder: category.sortOrder,
            isActive: category.isActive,
            createdAt: category.createdAt.toISOString(),
        });
    } catch (error) {
        console.error('Failed to create category:', error);
        return NextResponse.json(
            { error: '카테고리 생성에 실패했습니다.' },
            { status: 500 }
        );
    }
}
