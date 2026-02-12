import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET all news
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');

    try {
        const where = category ? { category } : {};
        const news = await prisma.news.findMany({
            where,
            orderBy: { publishedAt: 'desc' },
        });

        const formattedNews = news.map((n) => ({
            id: n.id.toString(),
            category: n.category,
            source: n.source,
            title: n.title,
            link: n.link,
            thumbnail: n.thumbnail || '',
            description: n.description || '',
            published_at: n.publishedAt?.toISOString() || '',
            likeCount: n.likeCount,
            dislikeCount: n.dislikeCount,
        }));

        return NextResponse.json(formattedNews);
    } catch (error) {
        console.error('Failed to fetch news:', error);
        return NextResponse.json({ error: 'Failed to fetch news' }, { status: 500 });
    }
}

// POST - create new news
export async function POST(request: Request) {
    try {
        const body = await request.json();

        // 제목으로 중복 체크
        const existing = await prisma.news.findUnique({
            where: { title: body.title },
        });

        if (existing) {
            return NextResponse.json(
                { error: '이미 동일한 제목의 뉴스가 존재합니다.' },
                { status: 400 }
            );
        }

        const news = await prisma.news.create({
            data: {
                category: body.category || 'tesla',
                source: body.source || '',
                title: body.title,
                link: body.link || '',
                thumbnail: body.thumbnail || null,
                description: body.description || null,
                publishedAt: body.published_at ? new Date(body.published_at) : new Date(),
            },
        });

        return NextResponse.json({
            id: news.id.toString(),
            category: news.category,
            source: news.source,
            title: news.title,
            link: news.link,
            thumbnail: news.thumbnail || '',
            description: news.description || '',
            published_at: news.publishedAt?.toISOString() || '',
            likeCount: news.likeCount,
            dislikeCount: news.dislikeCount,
        }, { status: 201 });
    } catch (error) {
        console.error('Failed to create news:', error);
        return NextResponse.json({ error: 'Failed to create news' }, { status: 500 });
    }
}
