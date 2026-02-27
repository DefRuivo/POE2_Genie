import { NextRequest } from 'next/server';
import { deletePartyMember } from '@/lib/api/party-members-handlers';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolved = await params;
  return deletePartyMember(request, resolved.id);
}
