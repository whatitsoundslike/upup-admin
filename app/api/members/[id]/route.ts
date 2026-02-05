import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function PUT(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const body = await request.json();
        const { uid, name, email, password } = body;
        const id = params.id;

        const updateData: any = {
            uid,
            name: name || null,
            email: email || null,
        };

        // Only hash and update password if provided
        if (password && password !== '********') {
            updateData.password = await bcrypt.hash(password, 10);
        }

        const member = await prisma.member.update({
            where: { id: BigInt(id) },
            data: updateData,
        });

        const serializedMember = {
            ...member,
            id: member.id.toString(),
            password: '********',
        };

        return NextResponse.json(serializedMember);
    } catch (error) {
        console.error('Failed to update member:', error);
        return NextResponse.json({ error: 'Failed to update member' }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const id = params.id;

        await prisma.member.delete({
            where: { id: BigInt(id) },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Failed to delete member:', error);
        return NextResponse.json({ error: 'Failed to delete member' }, { status: 500 });
    }
}
