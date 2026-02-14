import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET all inquiries
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    try {
        const where = status ? { status } : {};
        const inquiries = await prisma.inquiry.findMany({
            where,
            include: { Member: { select: { name: true, email: true } } },
            orderBy: { createdAt: 'desc' },
        });

        const formatted = inquiries.map((inq) => ({
            id: inq.id.toString(),
            memberId: inq.memberId.toString(),
            memberName: inq.Member?.name || '-',
            memberEmail: inq.Member?.email || '-',
            title: inq.title,
            content: inq.content,
            answer: inq.answer,
            status: inq.status,
            createdAt: inq.createdAt.toISOString(),
            updatedAt: inq.updatedAt.toISOString(),
        }));

        return NextResponse.json(formatted);
    } catch (error) {
        console.error('Failed to fetch inquiries:', error);
        return NextResponse.json({ error: 'Failed to fetch inquiries' }, { status: 500 });
    }
}
