import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '../../../../../lib/prisma';
import { verifyToken } from '@/lib/auth';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const token = request.cookies.get('auth_token')?.value;
    const payload = await verifyToken(token || '');
    if (!payload || !payload.kitchenId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    const userId = payload.userId as string;
    const kitchenId = payload.kitchenId as string;

    // 1. Find the member record for this user in this kitchen
    const member = await prisma.kitchenMember.findUnique({
      where: {
        userId_kitchenId: {
          userId,
          kitchenId
        }
      }
    });

    if (!member) {
      return NextResponse.json({ message: 'Member not found' }, { status: 404 });
    }

    // 2. Check if already favorite
    const existing = await prisma.favoriteRecipe.findUnique({
      where: {
        memberId_recipeId: {
          memberId: member.id,
          recipeId: id
        }
      }
    });

    if (existing) {
      // Unfavorite
      await prisma.favoriteRecipe.delete({
        where: { id: existing.id }
      });
      return NextResponse.json({ isFavorite: false });
    } else {
      // Favorite
      await prisma.favoriteRecipe.create({
        data: {
          memberId: member.id,
          recipeId: id
        }
      });
      return NextResponse.json({ isFavorite: true });
    }

  } catch (error) {
    console.error('PATCH /api/recipes/[id]/favorite error:', error);
    return NextResponse.json({ message: 'Error toggling favorite status', error: String(error) }, { status: 500 });
  }
}
