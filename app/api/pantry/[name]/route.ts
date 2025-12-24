import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { verifyToken } from '@/lib/auth';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  try {
    const token = request.cookies.get('auth_token')?.value;
    const payload = await verifyToken(token || '');
    if (!payload || !payload.houseId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    const houseId = payload.houseId as string;

    const { name } = await params;
    await prisma.pantryItem.delete({
      where: {
        name_houseId: {
          name: decodeURIComponent(name),
          houseId
        }
      }
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/pantry/[name] error:', error);
    return NextResponse.json({ message: 'Error removing item from pantry', error: String(error) }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  try {
    const token = request.cookies.get('auth_token')?.value;
    const payload = await verifyToken(token || '');
    if (!payload || !payload.houseId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    const houseId = payload.houseId as string;

    const { name } = await params;
    const { name: newName, inStock } = await request.json();

    // Construct dynamic update object
    const updateData: any = {};
    if (newName !== undefined) updateData.name = newName;
    if (inStock !== undefined) updateData.inStock = inStock;

    // Use transaction to handle side effects (auto-shopping list)
    const updated = await prisma.$transaction(async (tx) => {
      const item = await tx.pantryItem.update({
        where: {
          name_houseId: {
            name: decodeURIComponent(name),
            houseId
          }
        },
        data: updateData
      });

      // Loop replenishment logic
      if (item.replenishmentRule === 'ALWAYS' && item.inStock === false) {
        const shoppingItem = await tx.shoppingItem.upsert({
          where: { name_houseId: { name: item.name, houseId } },
          create: {
            name: item.name,
            houseId,
            checked: false,
            pantryItemId: item.id
          },
          update: {
            checked: false, // Re-activate if it was checked
            pantryItemId: item.id
          }
        });
        // We could link back? item already has shoppingItemId via unique pantryItemId on ShoppingItem model?
        // Actually PantryItem defines shoppingItemId as FK? No, look at schema.
        // PantryItem: shoppingItemId String? @unique, shoppingItem ShoppingItem? ...
        // ShoppingItem: pantryItemId String? @unique, pantryItem PantryItem?
        // Wait, usually one side has the FK.
        // Schema:
        // PantryItem: shoppingItemId String? @unique ... shoppingItem @relation...
        // ShoppingItem: pantryItemId ... (back relation if PantryItem holds FK)

        // In my schema I wrote:
        // PantryItem { shoppingItemId String? @unique ... }
        // ShoppingItem { pantryItem PantryItem? }
        // Validation: The relation is 1-1 optional.

        // So I should update PantryItem with shoppingItemId if I created one.
        await tx.pantryItem.update({
          where: { id: item.id },
          data: { shoppingItemId: shoppingItem.id }
        });
      }

      return item;
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('PUT /api/pantry/[name] error:', error);
    return NextResponse.json({ message: 'Error updating pantry item', error: String(error) }, { status: 500 });
  }
}
