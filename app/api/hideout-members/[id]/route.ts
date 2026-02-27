import { NextRequest } from 'next/server';
import { deletePartyMember } from '@/lib/api/party-members-handlers';
import { withLegacyDeprecationHeaders } from '@/lib/api/deprecation';

// Legacy alias: /api/hideout-members/[id] -> /api/party-members/[id]
const LEGACY_ROUTE = '/api/hideout-members/[id]';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolved = await params;
  const response = await deletePartyMember(request, resolved.id);
  return withLegacyDeprecationHeaders(response, LEGACY_ROUTE, 'DELETE');
}
