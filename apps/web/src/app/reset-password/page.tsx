import ResetPassword from '@/components/pages/ResetPassword';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Choose a new password',
  robots: { index: false },
};

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { token, error } = await searchParams;

  return (
    <ResetPassword
      token={typeof token === 'string' ? token : undefined}
      linkError={error !== undefined}
    />
  );
}
