import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

type GemTransactionRaw = {
    id: bigint;
    memberId: bigint;
    type: string;
    amount: number;
    source: string;
    memo: string | null;
    createdAt: Date;
    uid: string;
    name: string | null;
    email: string | null;
};

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const search = searchParams.get('search');

        let transactions: GemTransactionRaw[];

        if (search) {
            const isNumeric = /^\d+$/.test(search);

            if (isNumeric) {
                transactions = await prisma.$queryRaw<GemTransactionRaw[]>`
                    SELECT 
                        gt.id,
                        gt.memberId,
                        gt.type,
                        gt.amount,
                        gt.source,
                        gt.memo,
                        gt.createdAt,
                        m.uid,
                        m.name,
                        m.email
                    FROM GemTransaction gt
                    JOIN Member m ON gt.memberId = m.id
                    WHERE gt.memberId = ${BigInt(search)}
                    ORDER BY gt.createdAt DESC
                    LIMIT 100
                `;
            } else {
                transactions = await prisma.$queryRaw<GemTransactionRaw[]>`
                    SELECT 
                        gt.id,
                        gt.memberId,
                        gt.type,
                        gt.amount,
                        gt.source,
                        gt.memo,
                        gt.createdAt,
                        m.uid,
                        m.name,
                        m.email
                    FROM GemTransaction gt
                    JOIN Member m ON gt.memberId = m.id
                    WHERE m.uid LIKE ${`%${search}%`}
                    ORDER BY gt.createdAt DESC
                    LIMIT 100
                `;
            }
        } else {
            transactions = await prisma.$queryRaw<GemTransactionRaw[]>`
                SELECT 
                    gt.id,
                    gt.memberId,
                    gt.type,
                    gt.amount,
                    gt.source,
                    gt.memo,
                    gt.createdAt,
                    m.uid,
                    m.name,
                    m.email
                FROM GemTransaction gt
                JOIN Member m ON gt.memberId = m.id
                ORDER BY gt.createdAt DESC
                LIMIT 100
            `;
        }

        // Convert BigInt to string for JSON serialization
        const serializedTransactions = transactions.map((transaction) => ({
            id: transaction.id.toString(),
            memberId: transaction.memberId.toString(),
            type: transaction.type,
            amount: transaction.amount,
            source: transaction.source,
            memo: transaction.memo,
            createdAt: transaction.createdAt.toISOString(),
            member: {
                uid: transaction.uid,
                name: transaction.name,
                email: transaction.email,
            },
        }));

        return NextResponse.json(serializedTransactions);
    } catch (error) {
        console.error('Failed to fetch gem transactions:', error);
        return NextResponse.json(
            { error: 'Failed to fetch gem transactions' },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { memberId, type, amount, source, memo } = body;

        if (!memberId || !type || amount === undefined || !source) {
            return NextResponse.json(
                { error: 'memberId, type, amount, and source are required' },
                { status: 400 }
            );
        }

        // Validate type
        const validTypes = ['issue', 'use'];
        if (!validTypes.includes(type)) {
            return NextResponse.json(
                { error: 'Invalid type. Must be one of: issue, use' },
                { status: 400 }
            );
        }

        // Check if member exists
        const member = await prisma.member.findUnique({
            where: { id: BigInt(memberId) },
        });

        if (!member) {
            return NextResponse.json(
                { error: 'Member not found' },
                { status: 404 }
            );
        }

        // Convert amount to negative for 'use' type
        let finalAmount = parseInt(amount);
        if (type === 'use' && finalAmount > 0) {
            finalAmount = -finalAmount;
        }

        const transaction = await prisma.gemTransaction.create({
            data: {
                memberId: BigInt(memberId),
                type,
                amount: finalAmount,
                source,
                memo: memo || null,
            },
        });

        const serializedTransaction = {
            id: transaction.id.toString(),
            memberId: transaction.memberId.toString(),
            type: transaction.type,
            amount: transaction.amount,
            source: transaction.source,
            memo: transaction.memo,
            createdAt: transaction.createdAt.toISOString(),
            member: {
                uid: member.uid,
                name: member.name,
                email: member.email,
            },
        };

        return NextResponse.json(serializedTransaction, { status: 201 });
    } catch (error) {
        console.error('Failed to create gem transaction:', error);
        return NextResponse.json(
            { error: 'Failed to create gem transaction' },
            { status: 500 }
        );
    }
}
