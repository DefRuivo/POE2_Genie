import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export async function getChecklist(request: NextRequest) {
  try {
    const token = request.cookies.get('auth_token')?.value;
    const payload = await verifyToken(token || '');
    if (!payload || !payload.kitchenId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    const kitchenId = payload.kitchenId as string;
    const requestedStatus = request.nextUrl.searchParams.get('status');
    const status = requestedStatus === 'completed' || requestedStatus === 'all'
      ? requestedStatus
      : 'pending';
    const whereClause: { kitchenId: string; checked?: boolean } = { kitchenId };
    if (status !== 'all') {
      whereClause.checked = status === 'completed';
    }

    const items = await prisma.shoppingItem.findMany({
      where: whereClause,
      include: {
        recipeItems: {
          include: {
            recipe: {
              select: {
                id: true,
                recipe_title: true,
              },
            },
          },
        },
        pantryItem: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    return NextResponse.json(items);
  } catch (error) {
    console.error('GET checklist handler error:', error);
    return NextResponse.json({ message: 'Error fetching checklist', error: String(error) }, { status: 500 });
  }
}

export async function addChecklistItem(request: NextRequest) {
  try {
    const data = await request.json();
    const token = request.cookies.get('auth_token')?.value;
    const payload = await verifyToken(token || '');
    if (!payload || !payload.kitchenId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    const kitchenId = payload.kitchenId as string;

    let item = await prisma.shoppingItem.findFirst({
      where: {
        kitchenId,
        name: data.name,
      },
    });

    if (item) {
      if (item.checked) {
        item = await prisma.shoppingItem.update({
          where: { id: item.id },
          data: { checked: false },
        });
      }
    } else {
      item = await prisma.shoppingItem.create({
        data: {
          name: data.name,
          kitchenId,
          checked: false,
        },
      });
    }

    return NextResponse.json(item);
  } catch (error) {
    console.error('POST checklist handler error:', error);
    return NextResponse.json({ message: 'Error adding checklist item', error: String(error) }, { status: 500 });
  }
}

export async function clearChecklist(request: NextRequest) {
  try {
    const token = request.cookies.get('auth_token')?.value;
    const payload = await verifyToken(token || '');
    if (!payload || !payload.kitchenId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    const kitchenId = payload.kitchenId as string;

    const allItems = await prisma.shoppingItem.findMany({
      where: { kitchenId },
      include: { _count: { select: { recipeItems: true } } },
    });

    const idsToDelete: string[] = [];
    const idsToArchive: string[] = [];

    allItems.forEach((item) => {
      if (item._count.recipeItems === 0) {
        idsToDelete.push(item.id);
      } else if (!item.checked) {
        idsToArchive.push(item.id);
      }
    });

    await prisma.$transaction([
      prisma.shoppingItem.deleteMany({
        where: { id: { in: idsToDelete } },
      }),
      prisma.shoppingItem.updateMany({
        where: { id: { in: idsToArchive } },
        data: { checked: true },
      }),
    ]);

    return NextResponse.json({
      message: 'Checklist cleared',
      deleted: idsToDelete.length,
      archived: idsToArchive.length,
    });
  } catch (error) {
    console.error('DELETE checklist handler error:', error);
    return NextResponse.json({ message: 'Error clearing checklist', error: String(error) }, { status: 500 });
  }
}

export async function updateChecklistItemById(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const { checked } = body;

    const token = request.cookies.get('auth_token')?.value;
    const payload = await verifyToken(token || '');
    if (!payload || !payload.kitchenId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    const kitchenId = payload.kitchenId as string;

    const existingItem = await prisma.shoppingItem.findUnique({
      where: { id },
      select: { kitchenId: true, name: true },
    });

    if (!existingItem || existingItem.kitchenId !== kitchenId) {
      return NextResponse.json({ message: 'Item not found or access denied' }, { status: 404 });
    }

    const updatedItem = await prisma.shoppingItem.update({
      where: { id },
      data: {
        checked: checked !== undefined ? checked : undefined,
      },
    });

    if (checked === true) {
      await prisma.pantryItem.upsert({
        where: {
          name_kitchenId: {
            name: existingItem.name,
            kitchenId,
          },
        },
        update: { inStock: true },
        create: {
          name: existingItem.name,
          kitchenId,
          inStock: true,
          replenishmentRule: 'NEVER',
        },
      });
    }
    // Reopening an item (`checked: false`) intentionally does not modify stash stock.
    // Stash remains the source of truth for inventory state and is managed separately.

    return NextResponse.json(updatedItem);
  } catch (error) {
    console.error('PUT checklist item handler error:', error);
    return NextResponse.json({ message: 'Error updating checklist item', error: String(error) }, { status: 500 });
  }
}

export async function deleteChecklistItemById(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const token = request.cookies.get('auth_token')?.value;
    const payload = await verifyToken(token || '');
    if (!payload || !payload.kitchenId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    const kitchenId = payload.kitchenId as string;

    const existingItem = await prisma.shoppingItem.findUnique({
      where: { id },
      select: { kitchenId: true },
    });

    if (!existingItem || existingItem.kitchenId !== kitchenId) {
      return NextResponse.json({ message: 'Item not found or access denied' }, { status: 404 });
    }

    await prisma.shoppingItem.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Checklist item deleted' });
  } catch (error) {
    console.error('DELETE checklist item handler error:', error);
    return NextResponse.json({ message: 'Error deleting checklist item', error: String(error) }, { status: 500 });
  }
}
