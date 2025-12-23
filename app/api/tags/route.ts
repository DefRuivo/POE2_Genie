import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category');
  const q = searchParams.get('q') || '';

  if (!q) return NextResponse.json([]);

  try {
    let results: { name: string }[] = [];

    if (category === 'restriction') {
      results = await prisma.restriction.findMany({
        where: { name: { contains: q, } }, // Removing mode: insensitive for MySQL if strict, but usually default collation handles it. Prisma supports mode: 'insensitive' on Postgres/Mongo usually. MySQL depends on collation. I'll omit mode if unsure or assume default.
        distinct: ['name'],
        take: 5,
        select: { name: true }
      });
    } else if (category === 'like') {
      results = await prisma.like.findMany({
        where: { name: { contains: q } },
        distinct: ['name'],
        take: 5,
        select: { name: true }
      });
    } else if (category === 'dislike') {
      results = await prisma.dislike.findMany({
        where: { name: { contains: q } },
        distinct: ['name'],
        take: 5,
        select: { name: true }
      });
    }

    return NextResponse.json(results.map(r => r.name));
  } catch (error) {
    console.error('GET /api/tags error:', error);
    return NextResponse.json({ message: 'Error fetching tag suggestions', error: String(error) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { category, tag } = await request.json();
    if (!category || !tag) return NextResponse.json({ message: 'Category and tag are required' }, { status: 400 });

    const suggestion = await prisma.tagSuggestion.upsert({
      where: { category_tag: { category, tag } },
      update: {},
      create: { category, tag }
    });
    return NextResponse.json(suggestion);
  } catch (error) {
    console.error('POST /api/tags error:', error);
    return NextResponse.json({ message: 'Error saving tag suggestion', error: String(error) }, { status: 500 });
  }
}
