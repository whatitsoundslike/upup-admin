import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const search = searchParams.get('search');

        let whereClause: any = {};

        // Search by memberId or uid
        if (search) {
            // Check if search is a number (memberId) or string (uid)
            const isNumeric = /^\d+$/.test(search);

            if (isNumeric) {
                // Search by memberId
                whereClause = {
                    memberId: BigInt(search),
                };
            } else {
                // Search by uid - need to join with Member table
                whereClause = {
                    member: {
                        uid: {
                            contains: search,
                        },
                    },
                };
            }
        }

        const transactions = await prisma.gemTransaction.findMany({
            where: whereClause,
            include: {
                member: {
                    select: {
                        uid: true,
                        name: true,
                        email: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
            take: 100, // Limit to 100 results
        });

        // Convert BigInt to string for JSON serialization
        const serializedTransactions = transactions.map((transaction: any) => ({
            ...transaction,
            id: transaction.id.toString(),
            memberId: transaction.memberId.toString(),
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
            include: {
                member: {
                    select: {
                        uid: true,
                        name: true,
                        email: true,
                    },
                },
            },
        });

        const serializedTransaction = {
            ...transaction,
            id: transaction.id.toString(),
            memberId: transaction.memberId.toString(),
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
