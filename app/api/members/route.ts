import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function GET() {
    try {
        const members = await prisma.member.findMany({
            orderBy: {
                createdAt: 'desc',
            },
        });

        // Convert BigInt to string for JSON serialization
        const serializedMembers = members.map((member) => ({
            ...member,
            id: member.id.toString(),
            password: '********', // Don't send password to frontend
        }));

        return NextResponse.json(serializedMembers);
    } catch (error) {
        console.error('Failed to fetch members:', error);
        return NextResponse.json({ error: 'Failed to fetch members' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { uid, name, email, password } = body;

        if (!uid || !password) {
            return NextResponse.json(
                { error: 'uid and password are required' },
                { status: 400 }
            );
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        const member = await prisma.member.create({
            data: {
                uid,
                name: name || null,
                email: email || null,
                password: hashedPassword,
            },
        });

        // Convert BigInt to string for JSON serialization
        const serializedMember = {
            ...member,
            id: member.id.toString(),
            password: '********',
        };

        return NextResponse.json(serializedMember, { status: 201 });
    } catch (error) {
        console.error('Failed to create member:', error);
        return NextResponse.json({ error: 'Failed to create member' }, { status: 500 });
    }
}
