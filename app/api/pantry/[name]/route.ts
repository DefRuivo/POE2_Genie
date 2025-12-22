import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function DELETE(
  request: Request,
  { params }: { params: { name: string } }
) {
  try {
    await prisma.pantryItem.delete({
      where: { name: decodeURIComponent(params.name) }
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ message: 'Error removing item' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { name: string } }
) {
  try {
    const { name: newName } = await request.json();
    const updated = await prisma.pantryItem.update({
      where: { name: decodeURIComponent(params.name) },
      data: { name: newName }
    });
    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ message: 'Error updating item' }, { status: 500 });
  }
}
