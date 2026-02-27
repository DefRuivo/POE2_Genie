import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { sendInvitationEmail } from '@/lib/email-service';

const withMemberAliases = (member: any) => ({
  ...member,
  hideoutId: member.kitchenId,
  kitchenId: member.kitchenId,
});

export async function getHideoutMembers(request: NextRequest) {
  try {
    const token = request.cookies.get('auth_token')?.value;
    const payload = await verifyToken(token || '');
    if (!payload || !payload.kitchenId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    const kitchenId = payload.kitchenId as string;

    const members = await prisma.kitchenMember.findMany({
      where: {
        kitchenId,
        kitchen: { deletedAt: null },
      },
      include: {
        restrictions: true,
        likes: true,
        dislikes: true,
      },
    });

    const formattedMembers = members.map((m) =>
      withMemberAliases({
        ...m,
        restrictions: m.restrictions.map((r) => r.name),
        likes: m.likes.map((l) => l.name),
        dislikes: m.dislikes.map((d) => d.name),
      }),
    );

    return NextResponse.json(formattedMembers || []);
  } catch (error) {
    console.error('GET /api/hideout-members error:', error);
    return NextResponse.json({ message: 'Error fetching hideout members', error: String(error) }, { status: 500 });
  }
}

export async function saveHideoutMember(request: NextRequest) {
  try {
    const token = request.cookies.get('auth_token')?.value;
    const payload = await verifyToken(token || '');
    if (!payload || !payload.kitchenId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    const kitchenId = payload.kitchenId as string;

    const data = await request.json();

    if (!data.name || data.name.length > 50) {
      return NextResponse.json({ message: 'Name is required and must be under 50 characters.' }, { status: 400 });
    }
    if (data.email && data.email.length > 100) {
      return NextResponse.json({ message: 'Email must be under 100 characters.' }, { status: 400 });
    }

    const processTags = (tags: string[]) => {
      if (!Array.isArray(tags)) return undefined;
      return {
        deleteMany: {},
        create: tags.map((t) => ({ name: t })),
      };
    };

    let member;
    let userIdToLink: string | undefined;

    const kitchen = await prisma.kitchen.findUnique({
      where: { id: kitchenId },
    });

    const handleSendInvite = async (toEmail: string, isExisting: boolean) => {
      try {
        if (kitchen) {
          const inviterName = (payload.name as string) || 'A Hideout Member';
          await sendInvitationEmail(toEmail, inviterName, kitchen.name, kitchen.inviteCode || '', isExisting);
        }
      } catch (e) {
        console.error('Failed to send invite email', e);
      }
    };

    if (data.email) {
      const linkedUser = await prisma.user.findUnique({
        where: { email: data.email },
      });

      if (linkedUser) {
        userIdToLink = linkedUser.id;
        if (!data.id) {
          await handleSendInvite(data.email, true);
        }
      } else if (!data.id) {
        await handleSendInvite(data.email, false);
      }
    }

    if (data.id && !data.id.startsWith('h-') && !data.id.startsWith('g-') && !data.id.startsWith('temp-')) {
      const existingRecord = await prisma.kitchenMember.findUnique({
        where: { id: data.id },
        select: { kitchenId: true },
      });

      if (!existingRecord) {
        return NextResponse.json({ message: 'Member not found' }, { status: 404 });
      }

      if (existingRecord.kitchenId !== kitchenId) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
      }

      if (userIdToLink) {
        const collision = await prisma.kitchenMember.findFirst({
          where: {
            kitchenId,
            userId: userIdToLink,
            id: { not: data.id },
          },
        });
        if (collision) {
          return NextResponse.json({ message: 'A member with this email address already exists in this hideout.' }, { status: 409 });
        }
      }

      member = await prisma.kitchenMember.update({
        where: { id: data.id },
        data: {
          name: data.name,
          email: data.email || null,
          restrictions: processTags(data.restrictions),
          likes: processTags(data.likes),
          dislikes: processTags(data.dislikes),
          isGuest: data.isGuest !== undefined ? data.isGuest : undefined,
        },
        include: {
          restrictions: true,
          likes: true,
          dislikes: true,
        },
      });

      if (userIdToLink) {
        await prisma.kitchenMember.update({ where: { id: data.id }, data: { userId: userIdToLink } });
      }
    } else {
      if (userIdToLink) {
        const collision = await prisma.kitchenMember.findFirst({
          where: {
            kitchenId,
            userId: userIdToLink,
          },
        });
        if (collision) {
          return NextResponse.json({ message: 'A member with this email address already exists in this hideout.' }, { status: 409 });
        }
      }

      member = await prisma.kitchenMember.create({
        data: {
          name: data.name,
          email: data.email || null,
          userId: userIdToLink,
          restrictions: { create: (data.restrictions || []).map((n: string) => ({ name: n })) },
          likes: { create: (data.likes || []).map((n: string) => ({ name: n })) },
          dislikes: { create: (data.dislikes || []).map((n: string) => ({ name: n })) },
          isGuest: data.isGuest !== undefined ? data.isGuest : !userIdToLink,
          kitchenId,
        },
        include: {
          restrictions: true,
          likes: true,
          dislikes: true,
        },
      });
    }

    const formattedMember = withMemberAliases({
      ...member,
      restrictions: member.restrictions.map((r) => r.name),
      likes: member.likes.map((l) => l.name),
      dislikes: member.dislikes.map((d) => d.name),
    });

    return NextResponse.json(formattedMember);
  } catch (error) {
    console.error('POST /api/hideout-members error:', error);
    return NextResponse.json({ message: 'Error saving hideout member', error: String(error) }, { status: 500 });
  }
}

export async function deleteHideoutMember(request: NextRequest, id: string) {
  try {
    const token = request.cookies.get('auth_token')?.value;
    const payload = await verifyToken(token || '');
    if (!payload || !payload.kitchenId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const memberToDelete = await prisma.kitchenMember.findUnique({
      where: { id },
    });

    if (!memberToDelete) {
      return NextResponse.json({ message: 'Member not found' }, { status: 404 });
    }

    let isAuthorized = false;

    if (memberToDelete.userId === payload.userId) {
      isAuthorized = true;
    } else {
      const requesterMember = await prisma.kitchenMember.findUnique({
        where: {
          userId_kitchenId: {
            userId: payload.userId as string,
            kitchenId: memberToDelete.kitchenId,
          },
        },
      });
      if (requesterMember && requesterMember.role === 'ADMIN') {
        isAuthorized = true;
      }
    }

    if (!isAuthorized) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
    }

    await prisma.kitchenMember.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/hideout-members/[id] error:', error);
    return NextResponse.json({ message: 'Error deleting hideout member', error: String(error) }, { status: 500 });
  }
}
