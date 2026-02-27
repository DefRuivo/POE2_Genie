import { NextRequest } from 'next/server';
import { getPartyMembers, savePartyMember } from '@/lib/api/party-members-handlers';
import { withLegacyDeprecationHeaders } from '@/lib/api/deprecation';

// Legacy alias: /api/kitchen-members -> /api/party-members
const LEGACY_ROUTE = '/api/kitchen-members';

export async function GET(request: NextRequest) {
  const response = await getPartyMembers(request);
  return withLegacyDeprecationHeaders(response, LEGACY_ROUTE, 'GET');
}

export async function POST(request: NextRequest) {
  const response = await savePartyMember(request);
  return withLegacyDeprecationHeaders(response, LEGACY_ROUTE, 'POST');
}
