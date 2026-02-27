import { NextRequest } from 'next/server';
import {
  addChecklistItem,
  clearChecklist,
  getChecklist,
} from '@/lib/api/checklist-handlers';

export async function GET(request: NextRequest) {
  return getChecklist(request);
}

export async function POST(request: NextRequest) {
  return addChecklistItem(request);
}

export async function DELETE(request: NextRequest) {
  return clearChecklist(request);
}
