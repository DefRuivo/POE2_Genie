import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category');
  
  try {
    const tags = await prisma.tagSuggestion.findMany({
      where: category ? { category } : {}
    });
    return NextResponse.json(tags.map(t => t.tag));
  } catch (error) {
    return NextResponse.json({ message: 'Error fetching tags' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { category, tag } = await request.json();
    const suggestion = await prisma.tagSuggestion.upsert({
      where: { category_tag: { category, tag } },
      update: {},
      create: { category, tag }
    });
    return NextResponse.json(suggestion);
  } catch (error) {
    return NextResponse.json({ message: 'Error saving tag' }, { status: 500 });
  }
}
