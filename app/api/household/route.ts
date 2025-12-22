import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const members = await prisma.householdMember.findMany();
    return NextResponse.json(members);
  } catch (error) {
    return NextResponse.json({ message: 'Error fetching household' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const member = await prisma.householdMember.upsert({
      where: { id: data.id || 'new' },
      update: {
        name: data.name,
        restrictions: data.restrictions,
        likes: data.likes,
        dislikes: data.dislikes,
        isGuest: data.isGuest
      },
      create: {
        name: data.name,
        restrictions: data.restrictions,
        likes: data.likes,
        dislikes: data.dislikes,
        isGuest: data.isGuest
      }
    });
    return NextResponse.json(member);
  } catch (error) {
    return NextResponse.json({ message: 'Error saving member' }, { status: 500 });
  }
}
