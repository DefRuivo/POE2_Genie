import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { generateKitchenCode } from '@/lib/kitchen-code';

type HideoutRecord = {
  id: string;
};

const withHideoutAliases = <T extends HideoutRecord>(record: T) => ({
  ...record,
  hideoutId: record.id,
  kitchenId: record.id,
});

export async function createHideout(request: NextRequest) {
  try {
    const { name } = await request.json();
    if (!name) {
      return NextResponse.json({ message: 'Hideout name is required' }, { status: 400 });
    }

    const token = request.cookies.get('auth_token')?.value;
    const payload = await verifyToken(token || '');

    if (!payload || !payload.userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    const userId = payload.userId as string;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    const kitchen = await prisma.kitchen.create({
      data: {
        name,
        inviteCode: generateKitchenCode(),
        members: {
          create: {
            name: user.name || 'Admin',
            userId,
            isGuest: false,
            role: 'ADMIN',
          },
        },
      },
      include: { members: true },
    });

    return NextResponse.json(withHideoutAliases(kitchen));
  } catch (error) {
    console.error('POST /api/hideouts error:', error);
    return NextResponse.json({ message: 'Error creating hideout', error: String(error) }, { status: 500 });
  }
}

export async function getCurrentHideout(request: NextRequest) {
  try {
    const token = request.cookies.get('auth_token')?.value;
    const payload = await verifyToken(token || '');

    if (!payload || !payload.kitchenId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    const kitchenId = payload.kitchenId as string;

    const kitchen = await prisma.kitchen.findUnique({
      where: { id: kitchenId },
    });

    if (!kitchen) {
      return NextResponse.json({ message: 'Hideout not found' }, { status: 404 });
    }

    return NextResponse.json(withHideoutAliases(kitchen));
  } catch (error) {
    console.error('GET /api/hideouts error:', error);
    return NextResponse.json({ message: 'Error fetching hideout', error: String(error) }, { status: 500 });
  }
}

export async function joinHideout(request: NextRequest) {
  try {
    const { code } = await request.json();

    if (!code) {
      return NextResponse.json({ message: 'api.inviteRequired' }, { status: 400 });
    }

    const token = request.cookies.get('auth_token')?.value;
    if (!token) {
      return NextResponse.json({ message: 'api.unauthorized' }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload || !payload.userId) {
      return NextResponse.json({ message: 'api.unauthorized' }, { status: 401 });
    }
    const userId = payload.userId as string;

    const kitchen = await prisma.kitchen.findUnique({
      where: { inviteCode: code },
    });

    if (!kitchen) {
      return NextResponse.json({ message: 'api.kitchenNotFound' }, { status: 404 });
    }

    if (kitchen.deletedAt) {
      return NextResponse.json({ message: 'api.kitchenDeleted' }, { status: 410 });
    }

    const existingMember = await prisma.kitchenMember.findUnique({
      where: {
        userId_kitchenId: {
          userId,
          kitchenId: kitchen.id,
        },
      },
    });

    if (existingMember) {
      return NextResponse.json({
        message: 'api.alreadyMember',
        hideoutId: kitchen.id,
        kitchenId: kitchen.id,
        name: kitchen.name,
      });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });

    await prisma.kitchenMember.create({
      data: {
        kitchenId: kitchen.id,
        userId,
        name: user?.name || 'New Member',
        email: user?.email,
        isGuest: true,
        role: 'MEMBER',
      },
    });

    return NextResponse.json({
      message: 'api.joinSuccess',
      hideoutId: kitchen.id,
      kitchenId: kitchen.id,
      name: kitchen.name,
    });
  } catch (error) {
    console.error('POST /api/hideouts/join error:', error);
    return NextResponse.json({ message: 'api.joinError', error: String(error) }, { status: 500 });
  }
}

export async function updateHideout(request: NextRequest, hideoutId: string) {
  try {
    const { name } = await request.json();

    if (!name) {
      return NextResponse.json({ message: 'Name is required' }, { status: 400 });
    }

    const token = request.cookies.get('auth_token')?.value;
    const payload = await verifyToken(token || '');

    if (!payload || !payload.userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const membership = await prisma.kitchenMember.findUnique({
      where: {
        userId_kitchenId: {
          userId: payload.userId as string,
          kitchenId: hideoutId,
        },
      },
    });

    if (!membership || membership.role !== 'ADMIN') {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const kitchen = await prisma.kitchen.update({
      where: { id: hideoutId },
      data: { name },
    });

    return NextResponse.json(withHideoutAliases(kitchen));
  } catch (error) {
    console.error('PUT /api/hideouts/[id] error:', error);
    return NextResponse.json({ message: 'Error updating hideout', error: String(error) }, { status: 500 });
  }
}

export async function deleteHideout(request: NextRequest, hideoutId: string) {
  try {
    const token = request.cookies.get('auth_token')?.value;
    const payload = await verifyToken(token || '');

    if (!payload || !payload.userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const membership = await prisma.kitchenMember.findUnique({
      where: {
        userId_kitchenId: {
          userId: payload.userId as string,
          kitchenId: hideoutId,
        },
      },
    });

    if (!membership || membership.role !== 'ADMIN') {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const kitchen = await prisma.kitchen.update({
      where: { id: hideoutId },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json(withHideoutAliases(kitchen));
  } catch (error) {
    console.error('DELETE /api/hideouts/[id] error:', error);
    return NextResponse.json({ message: 'Error deleting hideout', error: String(error) }, { status: 500 });
  }
}
