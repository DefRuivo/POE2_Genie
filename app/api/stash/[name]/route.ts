import { NextRequest } from 'next/server';
import {
  deleteStashItemByName,
  updateStashItemByName,
} from '@/lib/api/stash-handlers';

export async function PUT(
  request: NextRequest,
  props: { params: Promise<{ name: string }> }
) {
  return updateStashItemByName(request, props);
}

export async function DELETE(
  request: NextRequest,
  props: { params: Promise<{ name: string }> }
) {
  return deleteStashItemByName(request, props);
}
