import { NextRequest } from 'next/server';
import {
  addChecklistItem,
  clearChecklist,
  getChecklist,
} from '@/lib/api/checklist-handlers';
import { withLegacyDeprecationHeaders } from '@/lib/api/deprecation';

const LEGACY_ROUTE = '/api/build-items';

export async function GET(request: NextRequest) {
  const response = await getChecklist(request);
  return withLegacyDeprecationHeaders(response, LEGACY_ROUTE, 'GET');
}

export async function POST(request: NextRequest) {
  const response = await addChecklistItem(request);
  return withLegacyDeprecationHeaders(response, LEGACY_ROUTE, 'POST');
}

export async function DELETE(request: NextRequest) {
  const response = await clearChecklist(request);
  return withLegacyDeprecationHeaders(response, LEGACY_ROUTE, 'DELETE');
}
