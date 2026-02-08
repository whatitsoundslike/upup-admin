import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface GameSaveWithMember {
    id: bigint;
    memberId: bigint;
    data: unknown;
    updatedAt: Date;
    rankScore: number;
    rankCharacterId: string | null;
    rankCharacter: unknown;
    tester: boolean;
    member: {
        uid: string;
    };
}

export async function GET() {
    try {
        const gameSaves = await prisma.gameSave.findMany({
            include: {
                member: {
                    select: {
                        uid: true,
                    },
                },
            },
            orderBy: {
                rankScore: 'desc',
            },
        }) as unknown as GameSaveWithMember[];

        // Convert BigInt to string for JSON serialization
        const serializedGameSaves = gameSaves.map((save) => ({
            id: save.id.toString(),
            memberId: save.memberId.toString(),
            uid: save.member.uid,
            rankScore: save.rankScore,
            rankCharacterId: save.rankCharacterId,
            rankCharacter: save.rankCharacter,
            tester: save.tester,
            updatedAt: save.updatedAt.toISOString(),
        }));

        return NextResponse.json(serializedGameSaves);
    } catch (error) {
        console.error('Failed to fetch game characters:', error);
        return NextResponse.json({ error: 'Failed to fetch game characters' }, { status: 500 });
    }
}
