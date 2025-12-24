import { NextRequest, NextResponse } from 'next/server';
import { generateRecipe } from '../../../services/geminiService';
import { prisma } from '../../../lib/prisma';
import { verifyToken } from '@/lib/auth';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { household, ...restOfContext } = body;

        // Securely get userId from token
        const token = req.cookies.get('auth_token')?.value;
        const payload = await verifyToken(token || '');
        const userId = payload?.userId as string | undefined;

        let measurementSystem = 'METRIC';

        if (userId) {
            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: { measurementSystem: true }
            });
            if (user?.measurementSystem) {
                measurementSystem = user.measurementSystem;
            }
        }

        const context = {
            ...restOfContext,
            household,
            measurement_system: measurementSystem
        };

        const result = await generateRecipe(household, context);

        return NextResponse.json(result);
    } catch (error: any) {
        console.error('Error generating recipe:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to generate recipe' },
            { status: 500 }
        );
    }
}
