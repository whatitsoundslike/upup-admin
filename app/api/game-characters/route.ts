import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

type RankCharacter = {
    name: string;
    level: number;
    className: string | null;
    element: string | null;
    imageUrl: string | null;
    stats: {
        hp: number;
        attack: number;
        defense: number;
        speed: number;
    };
};

type GameSaveRaw = {
    id: bigint;
    memberId: bigint;
    rankScore: number;
    rankCharacterId: string | null;
    rankCharacter: RankCharacter | null;
    tester: boolean;
    updatedAt: Date;
    uid: string;
};

export async function GET() {
    try {
        const gameSaves = await prisma.$queryRaw<GameSaveRaw[]>`
            SELECT 
                gs.id,
                gs.memberId,
                gs.rankScore,
                gs.rankCharacterId,
                gs.rankCharacter,
                gs.tester,
                gs.updatedAt,
                m.uid
            FROM GameSave gs
            JOIN Member m ON gs.memberId = m.id
            ORDER BY gs.rankScore DESC
        `;

        // Convert BigInt to string for JSON serialization
        const serializedGameSaves = gameSaves.map((save) => ({
            id: save.id.toString(),
            memberId: save.memberId.toString(),
            uid: save.uid,
            rankScore: save.rankScore,
            rankCharacterId: save.rankCharacterId,
            rankCharacter: save.rankCharacter,
            tester: Boolean(save.tester),
            updatedAt: save.updatedAt.toISOString(),
        }));

        return NextResponse.json(serializedGameSaves);
    } catch (error) {
        console.error('Failed to fetch game characters:', error);
        return NextResponse.json({ error: 'Failed to fetch game characters' }, { status: 500 });
    }
}

