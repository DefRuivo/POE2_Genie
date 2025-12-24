import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { verifyToken } from '@/lib/auth';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.cookies.get('auth_token')?.value;
    const payload = await verifyToken(token || '');
    if (!payload || !payload.houseId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    await prisma.householdMember.delete({
      where: { id }
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/household/[id] error:', error);
    return NextResponse.json({ message: 'Error deleting member', error: String(error) }, { status: 500 });
  }
}
