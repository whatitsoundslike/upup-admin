import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

type TipRaw = {
  id: bigint;
  category: string;
  title: string;
  summary: string | null;
  keyword: string[] | null;
  content: string;
  thumbnail: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');

    let tips: TipRaw[];

    if (category) {
      tips = await prisma.$queryRaw<TipRaw[]>`
                SELECT id, category, title, summary, keyword, content, thumbnail, createdAt, updatedAt
                FROM Tip
                WHERE category = ${category}
                ORDER BY createdAt DESC
            `;
    } else {
      tips = await prisma.$queryRaw<TipRaw[]>`
                SELECT id, category, title, summary, keyword, content, thumbnail, createdAt, updatedAt
                FROM Tip
                ORDER BY createdAt DESC
            `;
    }

    // Convert BigInt to string for JSON serialization
    const serializedTips = tips.map((tip) => ({
      id: tip.id.toString(),
      category: tip.category,
      title: tip.title,
      summary: tip.summary,
      keyword: tip.keyword,
      content: tip.content,
      thumbnail: tip.thumbnail,
      createdAt: tip.createdAt.toISOString(),
      updatedAt: tip.updatedAt.toISOString(),
    }));

    return NextResponse.json(serializedTips);
  } catch (error) {
    console.error('Failed to fetch tips:', error);
    return NextResponse.json({ error: 'Failed to fetch tips' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { category, title, summary, keyword, content, thumbnail } = body;

    if (!category || !title || !content) {
      return NextResponse.json(
        { error: 'category, title, and content are required' },
        { status: 400 }
      );
    }

    const tip = await prisma.tip.create({
      data: {
        category,
        title,
        summary: summary || null,
        keyword: keyword || null,
        content,
        thumbnail: thumbnail || null,
      },
    });

    const serializedTip = {
      id: tip.id.toString(),
      category: tip.category,
      title: tip.title,
      summary: tip.summary,
      keyword: tip.keyword,
      content: tip.content,
      thumbnail: tip.thumbnail,
      createdAt: tip.createdAt.toISOString(),
      updatedAt: tip.updatedAt.toISOString(),
    };

    return NextResponse.json(serializedTip, { status: 201 });
  } catch (error) {
    console.error('Failed to create tip:', error);
    return NextResponse.json({ error: 'Failed to create tip' }, { status: 500 });
  }
}
