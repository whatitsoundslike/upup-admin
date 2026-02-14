import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET single inquiry
export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    try {
        const inquiry = await prisma.inquiry.findUnique({
            where: { id: BigInt(id) },
            include: { Member: { select: { name: true, email: true } } },
        });

        if (!inquiry) {
            return NextResponse.json({ error: 'Inquiry not found' }, { status: 404 });
        }

        return NextResponse.json({
            id: inquiry.id.toString(),
            memberId: inquiry.memberId.toString(),
            memberName: inquiry.Member?.name || '-',
            memberEmail: inquiry.Member?.email || '-',
            title: inquiry.title,
            content: inquiry.content,
            answer: inquiry.answer,
            status: inquiry.status,
            createdAt: inquiry.createdAt.toISOString(),
            updatedAt: inquiry.updatedAt.toISOString(),
        });
    } catch (error) {
        console.error('Failed to fetch inquiry:', error);
        return NextResponse.json({ error: 'Failed to fetch inquiry' }, { status: 500 });
    }
}

// PUT - update inquiry (answer)
export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const body = await request.json();

    try {
        const inquiry = await prisma.inquiry.update({
            where: { id: BigInt(id) },
            data: {
                answer: body.answer ?? undefined,
                status: body.status ?? undefined,
                updatedAt: new Date(),
            },
            include: { Member: { select: { name: true, email: true } } },
        });

        return NextResponse.json({
            id: inquiry.id.toString(),
            memberId: inquiry.memberId.toString(),
            memberName: inquiry.Member?.name || '-',
            memberEmail: inquiry.Member?.email || '-',
            title: inquiry.title,
            content: inquiry.content,
            answer: inquiry.answer,
            status: inquiry.status,
            createdAt: inquiry.createdAt.toISOString(),
            updatedAt: inquiry.updatedAt.toISOString(),
        });
    } catch (error) {
        console.error('Failed to update inquiry:', error);
        return NextResponse.json({ error: 'Failed to update inquiry' }, { status: 500 });
    }
}

// DELETE inquiry
export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    try {
        await prisma.inquiry.delete({
            where: { id: BigInt(id) },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Failed to delete inquiry:', error);
        return NextResponse.json({ error: 'Failed to delete inquiry' }, { status: 500 });
    }
}
