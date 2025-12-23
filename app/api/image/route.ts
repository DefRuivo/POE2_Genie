import { NextRequest, NextResponse } from 'next/server';
import { generateDishImage } from '../../../services/geminiService';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { recipeName, size, ratio } = body;

        const result = await generateDishImage(recipeName, size, ratio);

        return NextResponse.json({ imageUrl: result });
    } catch (error: any) {
        console.error('Error generating image:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to generate image' },
            { status: 500 }
        );
    }
}
