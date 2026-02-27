import { NextRequest } from 'next/server';
import { toggleBuildFavorite } from '@/lib/api/builds-handlers';

export async function PATCH(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  return toggleBuildFavorite(request, props);
}
