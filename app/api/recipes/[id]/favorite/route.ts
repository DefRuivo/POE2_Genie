import { NextRequest } from 'next/server';
import { toggleBuildFavorite } from '@/lib/api/builds-handlers';
import { withLegacyDeprecationHeaders } from '@/lib/api/deprecation';

const LEGACY_ROUTE = '/api/recipes/[id]/favorite';

export async function PATCH(
  request: NextRequest,
  props: { params: Promise<{ id: string }> },
) {
  const response = await toggleBuildFavorite(request, props);
  return withLegacyDeprecationHeaders(response, LEGACY_ROUTE, 'PATCH');
}
