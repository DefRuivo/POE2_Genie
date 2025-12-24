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
    const { name: newName } = await request.json();
    const updated = await prisma.pantryItem.update({
      where: {
        name_houseId: {
          name: decodeURIComponent(name),
          houseId
        }
      },
      data: { name: newName }
    });
    return NextResponse.json(updated);
  } catch (error) {
    console.error('PUT /api/pantry/[name] error:', error);
    return NextResponse.json({ message: 'Error updating pantry item', error: String(error) }, { status: 500 });
  }
}
