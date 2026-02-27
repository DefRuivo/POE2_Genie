import { NextRequest } from 'next/server';
import {
  deleteChecklistItemById,
  updateChecklistItemById,
} from '@/lib/api/checklist-handlers';
import { withLegacyDeprecationHeaders } from '@/lib/api/deprecation';

const LEGACY_ROUTE = '/api/build-items/[id]';

export async function PUT(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const response = await updateChecklistItemById(request, props);
  return withLegacyDeprecationHeaders(response, LEGACY_ROUTE, 'PUT');
}

export async function DELETE(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const response = await deleteChecklistItemById(request, props);
  return withLegacyDeprecationHeaders(response, LEGACY_ROUTE, 'DELETE');
}
