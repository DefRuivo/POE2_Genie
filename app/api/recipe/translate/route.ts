import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from "@google/genai";
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { recipe, targetLanguage } = body;

        if (!recipe || !targetLanguage) {
            return NextResponse.json({ error: 'Missing recipe or targetLanguage' }, { status: 400 });
        }

        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        const prompt = `Translate the following recipe JSON to ${targetLanguage === 'pt' ? 'Portuguese (Brazil)' : 'English'}. 
    Maintain the EXACT JSON structure. Only translate the values of: "recipe_title", "analysis_log", "match_reasoning", "ingredients_from_pantry", "shopping_list", "step_by_step", "meal_type", "difficulty", "prep_time".
    Do NOT translate "safety_badge" boolean.
    
    Recipe JSON:
    ${JSON.stringify(recipe)}`;


        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview',
            contents: prompt,
            config: {
                responseMimeType: "application/json"
            }
        });

        if (!response.text) throw new Error("Translation failed");

        // Log Usage
        try {
            const token = req.cookies.get('auth_token')?.value;
            let userId: string | undefined;
            let kitchenId: string | undefined;

            if (token) {
                const payload = await verifyToken(token);
                if (payload) {
                    userId = payload.userId;
                    kitchenId = payload.kitchenId;
                }
            }

            const inputTokens = response.usageMetadata?.promptTokenCount || 0;
            const outputTokens = response.usageMetadata?.candidatesTokenCount || 0;

            await prisma.geminiUsage.create({
                data: {
                    prompt: "Translation Request (Prompt hidden for brevity)", // Or log full prompt if needed
                    response: response.text,
                    inputTokens,
                    outputTokens,
                    userId,
                    kitchenId
                }
            });
        } catch (err) {
            console.error("Failed to log translation usage", err);
        }

        const translatedRecipe = JSON.parse(response.text);
        return NextResponse.json(translatedRecipe);

    } catch (error: any) {
        console.error('Translation error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to translate' },
            { status: 500 }
        );
    }
}
