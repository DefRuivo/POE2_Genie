import { NextRequest } from 'next/server';
import { getBuilds as getBuildsHandler, saveBuild as saveBuildHandler } from '@/lib/api/builds-handlers';
import { withLegacyDeprecationHeaders } from '@/lib/api/deprecation';
import { type BuildResponseShape } from '@/lib/build-contract';

const LEGACY_ROUTE = '/api/recipes';

export async function getBuilds(
  request: NextRequest,
  shape: BuildResponseShape = 'legacy',
  applyDeprecationHeader: boolean = shape === 'legacy',
) {
  const response = await getBuildsHandler(request, shape);
  if (!applyDeprecationHeader) {
    return response;
  }
  return withLegacyDeprecationHeaders(response, LEGACY_ROUTE, 'GET');
}

export async function saveBuild(
  request: NextRequest,
  shape: BuildResponseShape = 'legacy',
  applyDeprecationHeader: boolean = shape === 'legacy',
) {
  const response = await saveBuildHandler(request, shape);
  if (!applyDeprecationHeader) {
    return response;
  }
  return withLegacyDeprecationHeaders(response, LEGACY_ROUTE, 'POST');
}

export async function GET(request: NextRequest) {
  return getBuilds(request, 'legacy', true);
}

export async function POST(request: NextRequest) {
  return saveBuild(request, 'legacy', true);
}
