import { NextRequest } from 'next/server';
import {
  addStashItem,
  getStash,
} from '@/lib/api/stash-handlers';

export async function GET(request: NextRequest) {
  return getStash(request);
}

export async function POST(request: NextRequest) {
  return addStashItem(request);
}
