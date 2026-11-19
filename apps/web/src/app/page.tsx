import LandingPage from '@/components/pages/LandingPage';
import { getOptionalSession } from '@/lib/dal';
import { redirect } from 'next/navigation';

export default async function Page() {
  // Checked against the backend rather than by cookie in the proxy: an
  // expired cookie would bounce between here and /dashboard.
  if (await getOptionalSession()) redirect('/dashboard');

  return <LandingPage />;
}
