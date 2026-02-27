import { NextRequest } from 'next/server';
import { translateBuildById } from '@/lib/api/builds-handlers';

export async function POST(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  return translateBuildById(request, props, 'canonical');
}
