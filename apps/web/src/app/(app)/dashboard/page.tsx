import { getMyWishlists } from '@/actions/wishlists';
import Dashboard from '@/components/pages/Dashboard';
import { verifySession } from '@/lib/dal';

export default async function DashboardPage() {
  const { user } = await verifySession();
  const wishlists = await getMyWishlists();

  return <Dashboard user={{ id: user.id, name: user.name }} wishlists={wishlists} />;
}
