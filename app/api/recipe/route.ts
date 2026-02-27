import { NextRequest } from 'next/server';
import { craftBuild } from '@/lib/api/build-craft-handlers';
import { withLegacyDeprecationHeaders } from '@/lib/api/deprecation';

const LEGACY_ROUTE = '/api/recipe';

export async function POST(req: NextRequest) {
  const response = await craftBuild(req, 'legacy');
  return withLegacyDeprecationHeaders(response, LEGACY_ROUTE, 'POST');
}
