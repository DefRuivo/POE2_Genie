import { NextRequest } from 'next/server';
import { translateBuildById } from '@/lib/api/builds-handlers';
import { withLegacyDeprecationHeaders } from '@/lib/api/deprecation';

const LEGACY_ROUTE = '/api/recipes/[id]/translate';

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const response = await translateBuildById(req, context, 'legacy');
  return withLegacyDeprecationHeaders(response, LEGACY_ROUTE, 'POST');
}
