import { NextRequest } from 'next/server';
import {
  deleteBuildById,
  getBuildById,
  updateBuildById,
} from '@/lib/api/builds-handlers';
import { withLegacyDeprecationHeaders } from '@/lib/api/deprecation';

const LEGACY_ROUTE = '/api/recipes/[id]';

export async function GET(
  request: Request,
  props: { params: Promise<{ id: string }> },
) {
  const response = await getBuildById(request, props, 'legacy');
  return withLegacyDeprecationHeaders(response, LEGACY_ROUTE, 'GET');
}

export async function PUT(
  request: NextRequest,
  props: { params: Promise<{ id: string }> },
) {
  const response = await updateBuildById(request, props, 'legacy');
  return withLegacyDeprecationHeaders(response, LEGACY_ROUTE, 'PUT');
}

export async function DELETE(
  request: Request,
  props: { params: Promise<{ id: string }> },
) {
  const response = await deleteBuildById(request, props);
  return withLegacyDeprecationHeaders(response, LEGACY_ROUTE, 'DELETE');
}
