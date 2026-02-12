import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const tip = await prisma.tip.findUnique({
      where: { id: BigInt(id) },
    });

    if (!tip) {
      return NextResponse.json({ error: 'Tip not found' }, { status: 404 });
    }

    const serializedTip = {
      id: tip.id.toString(),
      category: tip.category,
      title: tip.title,
      summary: tip.summary,
      keyword: tip.keyword,
      content: tip.content,
      thumbnail: tip.thumbnail,
      likeCount: (tip as { likeCount?: number }).likeCount || 0,
      dislikeCount: (tip as { dislikeCount?: number }).dislikeCount || 0,
      createdAt: tip.createdAt.toISOString(),
      updatedAt: tip.updatedAt.toISOString(),
    };

    return NextResponse.json(serializedTip);
  } catch (error) {
    console.error('Failed to fetch tip:', error);
    return NextResponse.json({ error: 'Failed to fetch tip' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { category, title, summary, keyword, content, thumbnail } = body;

    const tip = await prisma.tip.update({
      where: { id: BigInt(id) },
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
      likeCount: (tip as { likeCount?: number }).likeCount || 0,
      dislikeCount: (tip as { dislikeCount?: number }).dislikeCount || 0,
      createdAt: tip.createdAt.toISOString(),
      updatedAt: tip.updatedAt.toISOString(),
    };

    return NextResponse.json(serializedTip);
  } catch (error) {
    console.error('Failed to update tip:', error);
    return NextResponse.json({ error: 'Failed to update tip' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await prisma.tip.delete({
      where: { id: BigInt(id) },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete tip:', error);
    return NextResponse.json({ error: 'Failed to delete tip' }, { status: 500 });
  }
}
