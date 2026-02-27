import { NextRequest } from 'next/server';
import { joinHideout } from '@/lib/api/hideouts-handlers';

export async function POST(request: NextRequest) {
  return joinHideout(request);
}
