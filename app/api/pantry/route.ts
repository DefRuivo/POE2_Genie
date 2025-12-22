import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const items = await prisma.pantryItem.findMany();
    return NextResponse.json(items.map(i => i.name));
  } catch (error) {
    return NextResponse.json({ message: 'Error fetching pantry' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { name } = await request.json();
    const item = await prisma.pantryItem.create({
      data: { name }
    });
    return NextResponse.json(item);
  } catch (error) {
    return NextResponse.json({ message: 'Item already exists or error occurred' }, { status: 400 });
  }
}
