import LandingPage from '@/components/pages/LandingPage';
import { getOptionalSession } from '@/lib/dal';
import {
  DEFAULT_CALLBACK_URL,
  NEXT_PARAM,
  safeNextPath,
} from '@/utils/redirectHelper';
import { redirect } from 'next/navigation';

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  // The protected page the proxy sent the visitor here from, if any.
  const callbackURL =
    safeNextPath((await searchParams)[NEXT_PARAM]) ?? DEFAULT_CALLBACK_URL;

  // Checked against the backend rather than by cookie in the proxy: an
  // expired cookie would bounce between here and /dashboard.
  if (await getOptionalSession()) redirect(callbackURL);

  return <LandingPage callbackURL={callbackURL} />;
}
