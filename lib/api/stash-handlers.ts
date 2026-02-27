import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export async function getStash(request: NextRequest) {
  try {
    const token = request.cookies.get('auth_token')?.value;
    const payload = await verifyToken(token || '');
    if (!payload || !payload.kitchenId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    const kitchenId = payload.kitchenId as string;

    const items = await prisma.pantryItem.findMany({
      where: { kitchenId },
      select: {
        id: true,
        name: true,
        inStock: true,
        replenishmentRule: true,
        quantity: true,
        unit: true,
        unitDetails: true,
        shoppingItemId: true,
      },
    });
    return NextResponse.json(items);
  } catch (error) {
    console.error('GET stash handler error:', error);
    return NextResponse.json({ message: 'Error fetching stash items', error: String(error) }, { status: 500 });
  }
}

export async function addStashItem(request: NextRequest) {
  try {
    const { name, replenishmentRule, inStock, quantity, unit, unitDetails } = await request.json();
    if (!name) {
      return NextResponse.json({ message: 'Name is required' }, { status: 400 });
    }

    const token = request.cookies.get('auth_token')?.value;
    const payload = await verifyToken(token || '');
    if (!payload || !payload.kitchenId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    const kitchenId = payload.kitchenId as string;

    const initialStock = inStock !== undefined ? inStock : true;
    const rule = replenishmentRule || 'NEVER';

    const item = await prisma.$transaction(async (tx) => {
      const created = await tx.pantryItem.upsert({
        where: {
          name_kitchenId: {
            name,
            kitchenId,
          },
        },
        update: {
          replenishmentRule: rule,
          inStock: initialStock,
          quantity: quantity || null,
          unit: unit || null,
          unitDetails: unitDetails || null,
        },
        create: {
          name,
          kitchenId,
          inStock: initialStock,
          quantity: quantity || null,
          unit: unit || null,
          unitDetails: unitDetails || null,
          replenishmentRule: rule,
        },
      });

      if (created.replenishmentRule === 'ALWAYS' && created.inStock === false) {
        const shoppingItem = await tx.shoppingItem.upsert({
          where: { name_kitchenId: { name: created.name, kitchenId } },
          create: {
            name: created.name,
            kitchenId,
            checked: false,
          },
          update: {
            checked: false,
          },
        });
        await tx.pantryItem.update({
          where: { id: created.id },
          data: { shoppingItemId: shoppingItem.id },
        });
      }
      return created;
    });

    return NextResponse.json(item);
  } catch (error) {
    console.error('POST stash handler error:', error);
    return NextResponse.json({ message: 'Error adding stash item', error: String(error) }, { status: 500 });
  }
}

export async function updateStashItemByName(
  request: NextRequest,
  context: { params: Promise<{ name: string }> },
) {
  try {
    const token = request.cookies.get('auth_token')?.value;
    const payload = await verifyToken(token || '');
    if (!payload || !payload.kitchenId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    const kitchenId = payload.kitchenId as string;

    const { name } = await context.params;
    const { name: newName, inStock, quantity, unit, unitDetails, replenishmentRule } = await request.json();

    const updateData: Record<string, unknown> = {};
    if (newName !== undefined) updateData.name = newName;
    if (inStock !== undefined) updateData.inStock = inStock;
    if (quantity !== undefined) updateData.quantity = quantity;
    if (unit !== undefined) updateData.unit = unit;
    if (unitDetails !== undefined) updateData.unitDetails = unitDetails;
    if (replenishmentRule !== undefined) updateData.replenishmentRule = replenishmentRule;

    const updated = await prisma.$transaction(async (tx) => {
      const item = await tx.pantryItem.update({
        where: {
          name_kitchenId: {
            name: decodeURIComponent(name),
            kitchenId,
          },
        },
        data: updateData,
      });

      if (item.replenishmentRule === 'ALWAYS' && item.inStock === false) {
        const shoppingItem = await tx.shoppingItem.upsert({
          where: { name_kitchenId: { name: item.name, kitchenId } },
          create: {
            name: item.name,
            kitchenId,
            checked: false,
          },
          update: {
            checked: false,
          },
        });

        await tx.pantryItem.update({
          where: { id: item.id },
          data: { shoppingItemId: shoppingItem.id },
        });
      }

      return item;
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('PUT stash handler error:', error);
    return NextResponse.json({ message: 'Error updating stash item', error: String(error) }, { status: 500 });
  }
}

export async function deleteStashItemByName(
  request: NextRequest,
  context: { params: Promise<{ name: string }> },
) {
  try {
    const token = request.cookies.get('auth_token')?.value;
    const payload = await verifyToken(token || '');
    if (!payload || !payload.kitchenId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    const kitchenId = payload.kitchenId as string;

    const { name } = await context.params;
    await prisma.pantryItem.delete({
      where: {
        name_kitchenId: {
          name: decodeURIComponent(name),
          kitchenId,
        },
      },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE stash handler error:', error);
    return NextResponse.json({ message: 'Error removing item from stash', error: String(error) }, { status: 500 });
  }
}
