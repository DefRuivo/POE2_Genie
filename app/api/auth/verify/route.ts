import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { signToken } from '@/lib/auth';

export async function POST(req: NextRequest) {
    try {
        const { token } = await req.json();

        if (!token) {
            return NextResponse.json({ error: 'Missing token' }, { status: 400 });
        }

        const user = await prisma.user.findFirst({
            where: { verificationToken: token },
            include: {
                kitchenMemberships: {
                    include: { kitchen: true }
                }
            }
        });

        if (!user) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 400 });
        }

        // Verify user and clear token
        await prisma.user.update({
            where: { id: user.id },
            data: {
                emailVerified: new Date(),
                verificationToken: null
            }
        });

        // Generate auth token for auto-login
        const kitchenId = user.kitchenMemberships[0]?.kitchenId;

        // If strangely no kitchen, we might have an issue, but let's handle gracefully or fail
        if (!kitchenId) {
            console.error('Verified user has no kitchen membershiip', user.id);
        }

        const authToken = await signToken({
            userId: user.id,
            email: user.email,
            name: user.name,
            kitchenId: kitchenId || '',
            houseId: kitchenId || ''
        });

        const response = NextResponse.json({ success: true, user: { id: user.id, name: user.name, email: user.email } }, { status: 200 });

        response.cookies.set('auth_token', authToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 60 * 60 * 24, // 1 day
            path: '/',
        });

        return response;

    } catch (error) {
        console.error('Verification error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
