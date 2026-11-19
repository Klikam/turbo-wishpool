import { DraftNotice, LegalPage } from '@/components/sections/LegalPage';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacy policy',
  alternates: { canonical: '/privacy' },
};

// A factual starting point: what the app stores and why. The legal wording
// (controller, legal bases, retention, rights, contact) is the owner's to add.
export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy policy" updated="19 November 2026">
      <DraftNotice />

      <section>
        <h2>What we store</h2>
        <ul>
          <li>
            <strong>Your account:</strong> name, email address and, if you sign
            up with email, a hashed password. With Google or Facebook sign-in
            we receive your name and email from them.
          </li>
          <li>
            <strong>Your wishlists:</strong> titles, occasions, dates, notes,
            currency, and each gift&apos;s name, description, price, link and
            image link.
          </li>
          <li>
            <strong>Reservations:</strong> which gifts are taken, and by which
            account or browser, so only that person can undo it. We don&apos;t
            store who reserved a gift by name, and nobody, including the
            wishlist owner, can see it.
          </li>
        </ul>
      </section>

      <section>
        <h2>Cookies</h2>
        <ul>
          <li>
            <strong>Session cookie:</strong> keeps you signed in.
          </li>
          <li>
            <strong>Guest cookie</strong> (<code>wishpool_guest_token</code>):
            set when you open a wishlist, so you can undo reservations you made
            without an account. It lasts a year.
          </li>
        </ul>
        <p className="mt-2">
          Both are needed for the site to work. We don&apos;t use analytics or
          advertising cookies.
        </p>
      </section>

      <section>
        <h2>Who else is involved</h2>
        <ul>
          <li>Our hosting and database providers, who store the data above.</li>
          <li>Our email provider, which sends verification emails.</li>
          <li>Google or Facebook, if you sign in with them.</li>
          <li>
            Shops whose links you add: we fetch the linked page once to find a
            picture of the gift.
          </li>
        </ul>
      </section>

      <section>
        <h2>Deleting your data</h2>
        <p>
          You can delete your account at any time from{' '}
          <Link href="/account" className="underline underline-offset-4">
            Your account
          </Link>
          . It removes your account, wishlists and gifts for good, and frees
          any gifts you reserved.
        </p>
      </section>

      <section>
        <h2>To be written</h2>
        <p>
          Who is responsible for your data and how to contact them, the legal
          basis for processing, how long data is kept, your rights (access,
          correction, deletion, complaint to a supervisory authority) and
          where data is stored.
        </p>
      </section>
    </LegalPage>
  );
}
