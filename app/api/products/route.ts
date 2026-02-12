import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET all products (optionally filtered by category)
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');

    try {
        const products = await prisma.product.findMany({
            where: category ? { category } : undefined,
            orderBy: [
                { category: 'asc' },
                { sortOrder: 'asc' },
                { createdAt: 'desc' },
            ],
        });

        const formattedProducts = products.map((p) => ({
            id: p.id.toString(),
            category: p.category,
            name: p.name,
            price: p.price,
            thumbnail: p.thumbnail,
            deliverType: p.deliverType || '',
            link: p.link,
            order: p.sortOrder.toString(),
            created_at: p.createdAt.toISOString(),
        }));

        return NextResponse.json(formattedProducts);
    } catch (error) {
        console.error('Failed to fetch products:', error);
        return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
    }
}

// POST new product
export async function POST(request: Request) {
    try {
        const body = await request.json();

        const product = await prisma.product.create({
            data: {
                category: body.category || 'tesla',
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
        }, { status: 201 });
    } catch (error) {
        console.error('Failed to create product:', error);
        return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
    }
}
