import { NextRequest } from 'next/server';
import { addStashItem, getStash } from '@/lib/api/stash-handlers';
import { withLegacyDeprecationHeaders } from '@/lib/api/deprecation';

const LEGACY_ROUTE = '/api/pantry';

export async function GET(request: NextRequest) {
  const response = await getStash(request);
  return withLegacyDeprecationHeaders(response, LEGACY_ROUTE, 'GET');
}

export async function POST(request: NextRequest) {
  const response = await addStashItem(request);
  return withLegacyDeprecationHeaders(response, LEGACY_ROUTE, 'POST');
}
