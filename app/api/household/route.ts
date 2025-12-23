import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';

export async function GET() {
  try {
    const members = await prisma.householdMember.findMany({
      include: {
        restrictions: true,
        likes: true,
        dislikes: true
      }
    });

    // Map relations back to string arrays for frontend compatibility
    const formattedMembers = members.map(m => ({
      ...m,
      restrictions: m.restrictions.map(r => r.name),
      likes: m.likes.map(l => l.name),
      dislikes: m.dislikes.map(d => d.name)
    }));

    return NextResponse.json(formattedMembers || []);
  } catch (error) {
    console.error('GET /api/household error:', error);
    return NextResponse.json({ message: 'Error fetching household members', error: String(error) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();

    const processTags = (tags: string[]) => {
      return {
        deleteMany: {},
        create: Array.isArray(tags) ? tags.map(t => ({ name: t })) : []
      };
    };

    let member;
    // Check if it's an existing member or a new one
    if (data.id && !data.id.startsWith('h-') && !data.id.startsWith('g-') && !data.id.startsWith('temp-')) {
      member = await prisma.householdMember.update({
        where: { id: data.id },
        data: {
          name: data.name,
          restrictions: processTags(data.restrictions),
          likes: processTags(data.likes),
          dislikes: processTags(data.dislikes),
          isGuest: data.isGuest || false
        },
        include: {
          restrictions: true,
          likes: true,
          dislikes: true
        }
      });
    } else {
      member = await prisma.householdMember.create({
        data: {
          name: data.name,
          restrictions: { create: (data.restrictions || []).map((n: string) => ({ name: n })) },
          likes: { create: (data.likes || []).map((n: string) => ({ name: n })) },
          dislikes: { create: (data.dislikes || []).map((n: string) => ({ name: n })) },
          isGuest: data.isGuest || false
        },
        include: {
          restrictions: true,
          likes: true,
          dislikes: true
        }
      });
    }

    // Format response
    const formattedMember = {
      ...member,
      restrictions: member.restrictions.map(r => r.name),
      likes: member.likes.map(l => l.name),
      dislikes: member.dislikes.map(d => d.name)
    };

    return NextResponse.json(formattedMember);
  } catch (error) {
    console.error('POST /api/household error:', error);
    return NextResponse.json({ message: 'Error saving household member', error: String(error) }, { status: 500 });
  }
}
