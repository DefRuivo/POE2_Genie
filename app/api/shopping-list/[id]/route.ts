import { NextRequest } from 'next/server';
import {
  deleteChecklistItemById,
  updateChecklistItemById,
} from '@/lib/api/checklist-handlers';
import { withLegacyDeprecationHeaders } from '@/lib/api/deprecation';

const LEGACY_ROUTE = '/api/shopping-list/[id]';

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const response = await updateChecklistItemById(request, context);
  return withLegacyDeprecationHeaders(response, LEGACY_ROUTE, 'PUT');
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const response = await deleteChecklistItemById(request, context);
  return withLegacyDeprecationHeaders(response, LEGACY_ROUTE, 'DELETE');
}
