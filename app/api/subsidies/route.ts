import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET all subsidies
export async function GET() {
    try {
        const subsidies = await prisma.subsidy.findMany({
            orderBy: { id: 'asc' }, // DB 삽입 순서 (원본 데이터 순서 유지)
        });

        const formattedSubsidies = subsidies.map((s) => ({
            id: s.id.toString(),
            locationName1: s.locationName1,
            locationName2: s.locationName2,
            totalCount: s.totalCount,
            recievedCount: s.recievedCount,
            releaseCount: s.releaseCount,
            remainCount: s.remainCount,
            etc: s.etc || '',
            updatedAt: s.updatedAt.toISOString(),
        }));

        return NextResponse.json(formattedSubsidies);
    } catch (error) {
        console.error('Failed to fetch subsidies:', error);
        return NextResponse.json({ error: 'Failed to fetch subsidies' }, { status: 500 });
    }
}

// POST - refresh subsidies from external source
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { subsidies } = body;

        if (!Array.isArray(subsidies)) {
            return NextResponse.json({ error: 'subsidies array is required' }, { status: 400 });
        }

        // Upsert each subsidy
        let updatedCount = 0;
        for (const subsidy of subsidies) {
            await prisma.subsidy.upsert({
                where: {
                    locationName1_locationName2: {
                        locationName1: subsidy.locationName1,
                        locationName2: subsidy.locationName2,
                    },
                },
                update: {
                    totalCount: subsidy.totalCount || 0,
                    recievedCount: subsidy.recievedCount || 0,
                    releaseCount: subsidy.releaseCount || 0,
                    remainCount: subsidy.remainCount || 0,
                    etc: subsidy.etc || null,
                },
                create: {
                    locationName1: subsidy.locationName1,
                    locationName2: subsidy.locationName2,
                    totalCount: subsidy.totalCount || 0,
                    recievedCount: subsidy.recievedCount || 0,
                    releaseCount: subsidy.releaseCount || 0,
                    remainCount: subsidy.remainCount || 0,
                    etc: subsidy.etc || null,
                },
            });
            updatedCount++;
        }

        return NextResponse.json({
            success: true,
            message: `${updatedCount}개 보조금 데이터가 업데이트되었습니다.`,
        });
    } catch (error) {
        console.error('Failed to update subsidies:', error);
        return NextResponse.json({ error: 'Failed to update subsidies' }, { status: 500 });
    }
}
