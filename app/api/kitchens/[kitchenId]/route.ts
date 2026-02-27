import { NextRequest } from 'next/server';
import { deleteHideout, updateHideout } from '@/lib/api/hideouts-handlers';
import { withLegacyDeprecationHeaders } from '@/lib/api/deprecation';

// Legacy alias: /api/kitchens/[kitchenId] -> /api/hideouts/[hideoutId]
const LEGACY_ROUTE = '/api/kitchens/[kitchenId]';

export async function PUT(
  request: NextRequest,
  props: { params: Promise<{ kitchenId: string }> }
) {
  const params = await props.params;
  const response = await updateHideout(request, params.kitchenId);
  return withLegacyDeprecationHeaders(response, LEGACY_ROUTE, 'PUT');
}

export async function DELETE(
  request: NextRequest,
  props: { params: Promise<{ kitchenId: string }> }
) {
  const params = await props.params;
  const response = await deleteHideout(request, params.kitchenId);
  return withLegacyDeprecationHeaders(response, LEGACY_ROUTE, 'DELETE');
}
