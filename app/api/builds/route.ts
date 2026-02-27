import { NextRequest } from 'next/server';
import { getBuilds, saveBuild } from '@/lib/api/builds-handlers';

export async function GET(request: NextRequest) {
  return getBuilds(request, 'canonical');
}

export async function POST(request: NextRequest) {
  return saveBuild(request, 'canonical');
}
