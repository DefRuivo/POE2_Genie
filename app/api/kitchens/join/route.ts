import { NextRequest } from 'next/server';
import { joinHideout } from '@/lib/api/hideouts-handlers';
import { withLegacyDeprecationHeaders } from '@/lib/api/deprecation';

// Legacy alias: /api/kitchens/join -> /api/hideouts/join
const LEGACY_ROUTE = '/api/kitchens/join';

export async function POST(request: NextRequest) {
  const response = await joinHideout(request);
  return withLegacyDeprecationHeaders(response, LEGACY_ROUTE, 'POST');
}
