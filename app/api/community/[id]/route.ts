import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// DELETE a community post
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.communityPost.delete({
      where: { id: BigInt(id) },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete community post:', error);
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
  }
}

// PATCH - toggle aiVerified or isActive
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const data: Record<string, unknown> = {};
    if (typeof body.aiVerified === 'boolean') data.aiVerified = body.aiVerified;
    if (typeof body.isActive === 'boolean') data.isActive = body.isActive;

    const post = await prisma.communityPost.update({
      where: { id: BigInt(id) },
      data,
    });

    return NextResponse.json({
      id: post.id.toString(),
      aiVerified: post.aiVerified,
      isActive: post.isActive,
    });
  } catch (error) {
    console.error('Failed to update community post:', error);
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
  }
}
