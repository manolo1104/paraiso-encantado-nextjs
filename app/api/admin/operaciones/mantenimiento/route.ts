import { NextRequest, NextResponse } from 'next/server';
import { getMaintenanceTasks, markMaintenanceDone, addMaintenanceTask } from '@/lib/admin/operations';

export const dynamic = 'force-dynamic';

export async function GET() {
  const tasks = await getMaintenanceTasks();
  return NextResponse.json(tasks);
}

export async function PATCH(req: NextRequest) {
  try {
    const { suite, tarea, completadoPor } = await req.json();
    await markMaintenanceDone(suite, tarea, completadoPor || '');
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    await addMaintenanceTask(data);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
