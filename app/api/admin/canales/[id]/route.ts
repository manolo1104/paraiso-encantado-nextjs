import { NextRequest, NextResponse } from 'next/server';
import { deleteOTACalendar } from '@/lib/admin/sheets-admin';

export const dynamic = 'force-dynamic';

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  await deleteOTACalendar(id);
  return NextResponse.json({ ok: true });
}
