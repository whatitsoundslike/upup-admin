import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    try {
        const news = await prisma.news.findUnique({
            where: { id: BigInt(id) },
        });

        if (!news) {
            return NextResponse.json({ error: 'News not found' }, { status: 404 });
        }

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
        });
    } catch (error) {
        console.error('Failed to fetch news:', error);
        return NextResponse.json({ error: 'Failed to fetch news' }, { status: 500 });
    }
}

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const body = await request.json();

    try {
        // 제목 중복 체크 (자기 자신 제외)
        if (body.title) {
            const existing = await prisma.news.findFirst({
                where: {
                    title: body.title,
                    NOT: { id: BigInt(id) },
                },
            });

            if (existing) {
                return NextResponse.json(
                    { error: '이미 동일한 제목의 뉴스가 존재합니다.' },
                    { status: 400 }
                );
            }
        }

        const news = await prisma.news.update({
            where: { id: BigInt(id) },
            data: {
                category: body.category,
                source: body.source,
                title: body.title,
                link: body.link || '',
                thumbnail: body.thumbnail || null,
                description: body.description || null,
                publishedAt: body.published_at ? new Date(body.published_at) : undefined,
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
        });
    } catch (error) {
        console.error('Failed to update news:', error);
        return NextResponse.json({ error: 'Failed to update news' }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    try {
        await prisma.news.delete({
            where: { id: BigInt(id) },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Failed to delete news:', error);
        return NextResponse.json({ error: 'Failed to delete news' }, { status: 500 });
    }
}
