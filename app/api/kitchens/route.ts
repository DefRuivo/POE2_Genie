import { NextRequest } from 'next/server';
import { createHideout, getCurrentHideout } from '@/lib/api/hideouts-handlers';
import { withLegacyDeprecationHeaders } from '@/lib/api/deprecation';

// Legacy alias: /api/kitchens -> /api/hideouts
const LEGACY_ROUTE = '/api/kitchens';

export async function POST(request: NextRequest) {
  const response = await createHideout(request);
  return withLegacyDeprecationHeaders(response, LEGACY_ROUTE, 'POST');
}

export async function GET(request: NextRequest) {
  const response = await getCurrentHideout(request);
  return withLegacyDeprecationHeaders(response, LEGACY_ROUTE, 'GET');
}
