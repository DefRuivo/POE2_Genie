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

    const items = await prisma.pantryItem.findMany({
      where: { houseId },
      select: { id: true, name: true, inStock: true }
    });
    return NextResponse.json(items);
  } catch (error) {
    console.error('GET /api/pantry error:', error);
    return NextResponse.json({ message: 'Error fetching pantry items', error: String(error) }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name } = await request.json();
    if (!name) return NextResponse.json({ message: 'Name is required' }, { status: 400 });

    const token = request.cookies.get('auth_token')?.value;
    const payload = await verifyToken(token || '');
    if (!payload || !payload.houseId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    const houseId = payload.houseId as string;

    const item = await prisma.pantryItem.upsert({
      where: {
        name_houseId: {
          name,
          houseId
        }
      },
      update: {},
      create: { name, houseId, inStock: true }
    });
    return NextResponse.json(item);
  } catch (error) {
    console.error('POST /api/pantry error:', error);
    return NextResponse.json({ message: 'Error adding pantry item', error: String(error) }, { status: 500 });
  }
}
