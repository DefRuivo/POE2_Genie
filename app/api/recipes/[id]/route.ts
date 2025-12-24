import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const recipe = await prisma.recipe.findUnique({
      where: { id },
      include: {
        ingredients: {
          include: {
            ingredient: true
          }
        },
        shoppingItems: {
          include: {
            shoppingItem: true
          }
        },
        favoritedBy: true
      }
    });

    if (!recipe) {
      return NextResponse.json({ message: 'Recipe not found' }, { status: 404 });
    }


    // Format recipe to match frontend expectations
    const formattedRecipe = {
      ...recipe,
      ingredients_from_pantry: recipe.ingredients.filter(i => i.inPantry).map(i => i.ingredient.name),
      shopping_list: recipe.shoppingItems.map(s => s.shoppingItem.name),
      step_by_step: typeof recipe.step_by_step === 'string' ? JSON.parse(recipe.step_by_step as string) : recipe.step_by_step,
      isFavorite: recipe.favoritedBy.length > 0
    };

    return NextResponse.json(formattedRecipe);
  } catch (error) {
    console.error('GET /api/recipes/[id] error:', error);
    return NextResponse.json({ message: 'Error fetching recipe', error: String(error) }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.recipe.delete({
      where: { id }
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/recipes/[id] error:', error);
    return NextResponse.json({ message: 'Error deleting recipe', error: String(error) }, { status: 500 });
  }
}
