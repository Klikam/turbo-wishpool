import { LegalPage } from '@/components/sections/LegalPage';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacy policy',
  alternates: { canonical: '/privacy' },
};

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy policy" updated="20 November 2026">
      <section>
        <h2>Who is responsible for your data</h2>
        <p>
          Wishpool is run by an individual who goes by Klikam, who decides how
          and why your data is used (the &quot;controller&quot; under the GDPR).
          Contact for anything in this policy:{' '}
          <a
            href="mailto:contact@klikam.org"
            className="underline underline-offset-4"
          >
            contact@klikam.org
          </a>
          .
        </p>
      </section>

      <section>
        <h2>What we store</h2>
        <ul>
          <li>
            <strong>Your account:</strong> name, email address and, if you sign
            up with email, a hashed password. With Google or Facebook sign-in
            we receive your name and email from them.
          </li>
          <li>
            <strong>Your sign-ins:</strong> for each active session, the IP
            address and browser details it was started from, and when it
            expires.
          </li>
          <li>
            <strong>Your wishlists:</strong> titles, occasions, dates, notes,
            currency, and each gift&apos;s name, description, price, link and
            image link.
          </li>
          <li>
            <strong>Reservations:</strong> which gifts are taken, and by which
            account, so only that person can undo it. Wishlist owners can&apos;t
            see which gifts are taken or by whom. If an owner changes or deletes
            a gift you reserved, we email you about it.
          </li>
          <li>
            <strong>Requests:</strong> when you ask someone to release a gift
            or let you chip in, we keep the request and email it to them with
            your name. Their answer is emailed back to you.
          </li>
        </ul>
      </section>

      <section>
        <h2>Why we use it, and on what basis</h2>
        <ul>
          <li>
            <strong>To run the service you asked for</strong> (account, lists,
            reservations, requests, and the emails that go with them). Basis:
            performing our agreement with you, GDPR Art. 6(1)(b).
          </li>
          <li>
            <strong>To keep the service secure</strong> (signing you in,
            spotting abuse, limiting how often reservations can be made, which
            uses your IP address). Basis: our legitimate interest in a safe
            service, Art. 6(1)(f).
          </li>
        </ul>
        <p className="mt-2">
          We don&apos;t sell your data, use it for advertising, or make
          automated decisions about you.
        </p>
      </section>

      <section>
        <h2>Cookies</h2>
        <ul>
          <li>
            <strong>Session cookie:</strong> keeps you signed in.
          </li>
        </ul>
        <p className="mt-2">
          It is needed for the site to work. We don&apos;t use analytics or
          advertising cookies.
        </p>
      </section>

      <section>
        <h2>Who else is involved</h2>
        <ul>
          <li>Our hosting and database providers, who store the data above.</li>
          <li>
            Our email provider, which sends verification emails, requests and
            notices that a gift you reserved was changed or removed.
          </li>
          <li>Google or Facebook, if you sign in with them.</li>
          <li>
            Link-preview services (chat apps) that fetch a shared wishlist
            link see only its title, occasion, date and owner&apos;s name,
            never the gifts.
          </li>
          <li>
            Shops whose links you add: we fetch the linked page once to find a
            picture of the gift.
          </li>
        </ul>
        <p className="mt-2">
          These providers process data only on our behalf to deliver the
          service. We may also disclose data if the law requires it.
        </p>
      </section>

      <section>
        <h2>How long we keep it</h2>
        <ul>
          <li>
            Your account, wishlists, gifts, reservations and requests: until
            you delete your account.
          </li>
          <li>
            Sign-in sessions: until they expire, you sign out, or you reset
            your password, which signs out all of them.
          </li>
        </ul>
      </section>

      <section>
        <h2>Where your data is stored</h2>
        <p>
          Our database is provided by Supabase and hosted in Ireland, within
          the European Economic Area.
        </p>
        {/* TODO(owner): add where the backend host and email provider process
            data, and any transfer safeguards if that is outside the EEA. */}
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
        <h2>Your rights</h2>
        <p>
          Under the GDPR you can ask us for access to your data, to correct it,
          to delete it, to restrict or object to how we use it, and to receive
          a copy you can move elsewhere. Most of this you can do yourself in
          your account; for anything else, email us and we will answer within
          one month.
        </p>
        <p className="mt-2">
          If you think we handle your data unlawfully, you can complain to a
          supervisory authority. In Poland that is the President of the Office
          for Personal Data Protection (UODO),{' '}
          <a
            href="https://uodo.gov.pl"
            className="underline underline-offset-4"
          >
            uodo.gov.pl
          </a>
          .
        </p>
      </section>

      <section>
        <h2>Children</h2>
        <p>
          Wishpool is for people aged 16 and over. If you believe a younger
          child has an account, tell us and we will delete it.
        </p>
      </section>

      <section>
        <h2>Changes</h2>
        <p>
          If we change this policy in a material way, we will tell you, for
          example by email or a notice on the site. The date at the top shows
          when it was last updated. See also our{' '}
          <Link href="/terms" className="underline underline-offset-4">
            terms of service
          </Link>
          .
        </p>
      </section>
    </LegalPage>
  );
}
