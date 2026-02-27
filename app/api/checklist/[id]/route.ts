import { NextRequest } from 'next/server';
import {
  deleteChecklistItemById,
  updateChecklistItemById,
} from '@/lib/api/checklist-handlers';

export async function PUT(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  return updateChecklistItemById(request, props);
}

export async function DELETE(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  return deleteChecklistItemById(request, props);
}
