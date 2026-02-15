import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET all community posts
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category');
  const source = searchParams.get('source');

  try {
    const where: Record<string, unknown> = {};
    if (category) where.category = category;
    if (source) where.source = source;

    const posts = await prisma.communityPost.findMany({
      where,
      orderBy: { crawledAt: 'desc' },
      take: 200,
    });

    const formatted = posts.map((p) => ({
      id: p.id.toString(),
      category: p.category,
      source: p.source,
      title: p.title,
      content: p.content || '',
      url: p.url,
      views: p.views,
      likes: p.likes,
      comments: p.comments,
      hotScore: p.hotScore,
      imageUrl: p.imageUrl || '',
      publishedAt: p.publishedAt?.toISOString() || '',
      crawledAt: p.crawledAt.toISOString(),
      aiVerified: p.aiVerified,
      isActive: p.isActive,
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    console.error('Failed to fetch community posts:', error);
    return NextResponse.json({ error: 'Failed to fetch community posts' }, { status: 500 });
  }
}
