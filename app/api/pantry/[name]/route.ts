import { NextRequest } from 'next/server';
import {
  deleteStashItemByName,
  updateStashItemByName,
} from '@/lib/api/stash-handlers';
import { withLegacyDeprecationHeaders } from '@/lib/api/deprecation';

const LEGACY_ROUTE = '/api/pantry/[name]';

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ name: string }> },
) {
  const response = await updateStashItemByName(request, context);
  return withLegacyDeprecationHeaders(response, LEGACY_ROUTE, 'PUT');
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ name: string }> },
) {
  const response = await deleteStashItemByName(request, context);
  return withLegacyDeprecationHeaders(response, LEGACY_ROUTE, 'DELETE');
}
