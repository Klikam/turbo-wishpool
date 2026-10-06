import Dashboard from '@/components/pages/Dashboard';
import { verifySession } from '@/lib/dal';

export default async function DashboardPage() {
  const { user } = await verifySession();

  return <Dashboard user={{ id: user.id, name: user.name }} />;
}
