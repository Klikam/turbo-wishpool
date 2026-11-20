import { LegalPage } from '@/components/sections/LegalPage';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Terms of service',
  alternates: { canonical: '/terms' },
};

export default function TermsPage() {
  return (
    <LegalPage title="Terms of service" updated="20 November 2026">
      <section>
        <h2>Using Wishpool</h2>
        <p>
          Wishpool lets you create wishlists and share them, so friends and
          family can see what you&apos;d like and reserve a gift without anyone
          buying the same thing twice. By using it you agree to these terms.
        </p>
        <ul>
          <li>
            You must be at least 16 years old to create an account. Reserving
            a gift also needs an account.
          </li>
          <li>
            Keep your password safe. You are responsible for what happens under
            your account, so tell us if you think it has been compromised.
          </li>
          <li>Give accurate details, such as a working email address.</li>
          <li>
            Don&apos;t misuse the service: don&apos;t try to break, overload or
            scrape it, get around its limits, access other people&apos;s data,
            or use it to harass or deceive anyone.
          </li>
        </ul>
      </section>

      <section>
        <h2>Your content</h2>
        <p>
          You keep ownership of what you add: wishlists, gift names,
          descriptions, links and notes. You allow us to store and display it
          only to run Wishpool, including showing it to people you share a list
          with.
        </p>
        <p className="mt-2">Don&apos;t add content that:</p>
        <ul>
          <li>
            is illegal, hateful, harassing, sexually explicit, or infringes
            someone else&apos;s rights;
          </li>
          <li>
            contains other people&apos;s personal data without their consent;
          </li>
          <li>links to malware, phishing or fraudulent sites.</li>
        </ul>
        <p className="mt-2">
          Anyone with the link to your wishlist can see it, so share it only
          with people you want to see it. Only add links and images you are
          allowed to use. We are not responsible for the sites they point to.
          We may remove content that breaks these terms.
        </p>
      </section>

      <section>
        <h2>Reservations</h2>
        <p>
          Reserving a gift is a promise between friends. It is not a purchase or
          a contract with Wishpool or with the list owner.
        </p>
        <ul>
          <li>
            Wishpool doesn&apos;t sell, ship or deliver anything and isn&apos;t
            a party to any purchase. Links to shops are provided for
            convenience; we are not responsible for those shops, their prices,
            stock or delivery.
          </li>
          <li>
            A reservation only marks a gift as taken. We can&apos;t guarantee
            it will be bought or given.
          </li>
          <li>
            Only the person who reserved a gift can cancel their reservation.
            List owners can&apos;t see which gifts are reserved or by whom.
          </li>
          <li>
            Several people can reserve the same gift, for example when they
            chip in together. Wishpool doesn&apos;t handle money or split
            costs; that is arranged between the people involved.
          </li>
          <li>
            You can ask someone who reserved a gift to release it or to let you
            chip in. We send that request by email on your behalf, and the
            person may decline. Don&apos;t use requests to spam or pressure
            anyone.
          </li>
          <li>
            By reserving a gift you agree to receive service emails about it,
            for example when the owner changes or removes it.
          </li>
          <li>
            To protect the service from abuse, we limit how often reservations
            and requests can be made.
          </li>
        </ul>
      </section>

      <section>
        <h2>Ending your account</h2>
        <p>
          You can delete your account at any time from{' '}
          <Link href="/account" className="underline underline-offset-4">
            Your account
          </Link>
          . This removes your account, wishlists and gifts for good and frees
          any gifts you reserved. See our{' '}
          <Link href="/privacy" className="underline underline-offset-4">
            privacy policy
          </Link>{' '}
          for how we handle your data.
        </p>
        <p className="mt-2">
          We may suspend or close an account that breaks these terms or puts the
          service or other people at risk. Where reasonable, we will tell you
          why. If you sign in with Google or Facebook, their own terms also
          apply to that sign-in.
        </p>
      </section>

      <section>
        <h2>Liability and changes</h2>
        <ul>
          <li>
            <strong>As is.</strong> Wishpool is free and provided &quot;as
            is&quot; and &quot;as available&quot;. We don&apos;t promise it will
            be uninterrupted or error-free, and we may change or stop features.
          </li>
          <li>
            <strong>Limit of liability.</strong> As far as the law allows, we
            aren&apos;t liable for indirect or consequential losses, or for
            losses connected to gifts, purchases or third-party sites. Our total
            liability to you is limited to €100. Nothing in these terms limits
            liability that can&apos;t be limited by law, or your rights as a
            consumer.
          </li>
          <li>
            <strong>Changes.</strong> We may update these terms. For material
            changes we will give notice, for example by email or a notice on the
            site, before they apply. If you keep using Wishpool afterwards, you
            accept the updated terms.
          </li>
          <li>
            <strong>Governing law.</strong> These terms are governed by Polish
            law, without affecting any mandatory consumer protection that
            applies where you live.
          </li>
        </ul>
      </section>

      <section>
        <h2>Contact</h2>
        <p>
          Wishpool is run by an individual who goes by Klikam. Questions about
          these terms:{' '}
          <a
            href="mailto:contact@klikam.org"
            className="underline underline-offset-4"
          >
            contact@klikam.org
          </a>
          .
        </p>
      </section>
    </LegalPage>
  );
}
