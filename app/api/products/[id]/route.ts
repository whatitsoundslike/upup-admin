import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET single product
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const product = await prisma.product.findUnique({
            where: { id: BigInt(id) },
        });

        if (!product) {
            return NextResponse.json({ error: 'Product not found' }, { status: 404 });
        }

        return NextResponse.json({
            id: product.id.toString(),
            category: product.category,
            name: product.name,
            price: product.price,
            thumbnail: product.thumbnail,
            deliverType: product.deliverType || '',
            link: product.link,
            order: product.sortOrder.toString(),
            created_at: product.createdAt.toISOString(),
        });
    } catch (error) {
        console.error('Failed to fetch product:', error);
        return NextResponse.json({ error: 'Failed to fetch product' }, { status: 500 });
    }
}

// PUT update product
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();

        const product = await prisma.product.update({
            where: { id: BigInt(id) },
            data: {
                category: body.category,
                name: body.name,
                price: body.price,
                thumbnail: body.thumbnail,
                deliverType: body.deliverType || null,
                link: body.link,
                sortOrder: parseInt(body.order || '0', 10),
            },
        });

        return NextResponse.json({
            id: product.id.toString(),
            category: product.category,
            name: product.name,
            price: product.price,
            thumbnail: product.thumbnail,
            deliverType: product.deliverType || '',
            link: product.link,
            order: product.sortOrder.toString(),
            created_at: product.createdAt.toISOString(),
        });
    } catch (error) {
        console.error('Failed to update product:', error);
        return NextResponse.json({ error: 'Failed to update product' }, { status: 500 });
    }
}

// DELETE product
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        await prisma.product.delete({
            where: { id: BigInt(id) },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Failed to delete product:', error);
        return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 });
    }
}
