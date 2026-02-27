import { NextRequest } from 'next/server';
import { createHideout, getCurrentHideout } from '@/lib/api/hideouts-handlers';

export async function POST(request: NextRequest) {
  return createHideout(request);
}

export async function GET(request: NextRequest) {
  return getCurrentHideout(request);
}
