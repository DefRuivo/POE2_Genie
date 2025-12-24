import { NextRequest, NextResponse } from 'next/server';
import { generateRecipe } from '../../../services/geminiService';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { household, context } = body;

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
