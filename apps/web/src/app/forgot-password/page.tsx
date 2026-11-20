import ForgotPassword from '@/components/pages/ForgotPassword';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Forgot your password?',
  robots: { index: false },
};

export default function ForgotPasswordPage() {
  return <ForgotPassword />;
}
