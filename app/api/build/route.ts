import { NextRequest } from 'next/server';
import { craftBuild } from '@/lib/api/build-craft-handlers';

export async function POST(request: NextRequest) {
  return craftBuild(request, 'canonical');
}
