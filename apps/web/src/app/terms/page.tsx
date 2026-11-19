import { DraftNotice, LegalPage } from '@/components/sections/LegalPage';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of service',
  alternates: { canonical: '/terms' },
};

// Placeholder headings for the owner's own terms.
export default function TermsPage() {
  return (
    <LegalPage title="Terms of service" updated="19 November 2026">
      <DraftNotice />

      <section>
        <h2>Using Wishpool</h2>
        <p>[To be written: who may use the service and how.]</p>
      </section>

      <section>
        <h2>Your content</h2>
        <p>
          [To be written: wishlists and gifts you add, and what may not be
          posted.]
        </p>
      </section>

      <section>
        <h2>Reservations</h2>
        <p>
          [To be written: reserving a gift is a promise between friends;
          Wishpool doesn&apos;t sell or deliver anything.]
        </p>
      </section>

      <section>
        <h2>Ending your account</h2>
        <p>[To be written: deleting your account, and suspension.]</p>
      </section>

      <section>
        <h2>Liability and changes</h2>
        <p>[To be written.]</p>
      </section>

      <section>
        <h2>Contact</h2>
        <p>[To be written.]</p>
      </section>
    </LegalPage>
  );
}
