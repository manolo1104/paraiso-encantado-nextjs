import { getCleaningToday } from '@/lib/admin/operations';
import { getMaintenanceTasks } from '@/lib/admin/operations';
import { ALL_SUITES } from '@/lib/admin/cleaning-config';
import OperacionesClient from './OperacionesClient';

export const dynamic = 'force-dynamic';

export default async function OperacionesPage() {
  const [cleaningToday, maintenanceTasks] = await Promise.all([
    getCleaningToday(),
    getMaintenanceTasks(),
  ]);

  const overdueTasks = maintenanceTasks.filter(t => t.overdue).length;
  const soonTasks = maintenanceTasks.filter(t => !t.overdue && t.daysOverdue <= 0 && t.proximaVez && (() => {
    const days = Math.round((new Date(t.proximaVez + 'T12:00:00').getTime() - Date.now()) / 86400000);
    return days >= 0 && days <= 3;
  })()).length;

  return (
    <OperacionesClient
      initialCleaning={cleaningToday}
      initialMaintenance={maintenanceTasks}
      suites={ALL_SUITES}
      overdueTasks={overdueTasks}
      soonTasks={soonTasks}
    />
  );
}
