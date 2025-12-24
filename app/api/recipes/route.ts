import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { verifyToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth_token')?.value;
    const payload = await verifyToken(token || '');
    if (!payload || !payload.houseId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    const houseId = payload.houseId as string;

    const recipes = await prisma.recipe.findMany({
      where: { houseId },
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(recipes || []);
  } catch (error) {
    console.error('GET /api/recipes error:', error);
    return NextResponse.json({ message: 'Erro ao buscar receitas salvas', error: String(error) }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const token = request.cookies.get('auth_token')?.value;
    const payload = await verifyToken(token || '');
    if (!payload || !payload.houseId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    const houseId = payload.houseId as string;

    // Clean up ingredients/shopping list strings if they come as strings
    const parse = (val: any) => typeof val === 'string' ? JSON.parse(val) : val;

    const recipe = await prisma.recipe.create({
      data: {
        recipe_title: data.recipe_title,
        analysis_log: data.analysis_log,
        match_reasoning: data.match_reasoning,
        ingredients_from_pantry: data.ingredients_from_pantry,
        shopping_list: data.shopping_list,
        step_by_step: data.step_by_step,
        safety_badge: data.safety_badge,
        meal_type: data.meal_type,
        difficulty: data.difficulty,
        prep_time: data.prep_time,
        dishImage: data.dishImage,
        isFavorite: data.isFavorite || false,
        language: data.language || 'en',
        houseId: houseId,
        pantryItems: {
          connectOrCreate: (Array.isArray(parse(data.ingredients_from_pantry)) ? parse(data.ingredients_from_pantry) : []).map((name: string) => ({
            where: {
              name_houseId: {
                name,
                houseId
              }
            },
            create: { name, houseId }
          }))
        }
      }
    });
    return NextResponse.json(recipe);
  } catch (error) {
    console.error('POST /api/recipes error:', error);
    return NextResponse.json({ message: 'Erro ao salvar receita no banco', error: String(error) }, { status: 500 });
  }
}
