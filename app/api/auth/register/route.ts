import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/password';

export async function POST(req: NextRequest) {
    try {
        const { name, surname, email, password } = await req.json();

        if (!name || !surname || !email || !password) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            return NextResponse.json({ error: 'User already exists' }, { status: 400 });
        }

        const hashedPassword = await hashPassword(password);

        // Create User, House, and link them transactional
        const user = await prisma.user.create({
            data: {
                name,
                surname,
                email,
                password: hashedPassword,
                house: {
                    create: {
                        name: `${name}'s Kitchen`
                    }
                }
            },
            include: {
                house: true
            }
        });

        // Auto-create Household Member profile for the new user
        await prisma.householdMember.create({
            data: {
                name: user.name,
                userId: user.id,
                houseId: user.houseId,
                isGuest: false
            }
        });

        // Don't return the password
        const { password: _, ...userWithoutPassword } = user;

        return NextResponse.json({ user: userWithoutPassword }, { status: 201 });
    } catch (error) {
        console.error('Registration error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
