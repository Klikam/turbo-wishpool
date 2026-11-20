"use client";

import {
  primaryActionClassName,
  secondaryActionClassName,
  StatusMessage,
} from "@/components/sections/StatusMessage";
import { useEffect } from "react";

import "./globals.css";

/**
 * Last resort for errors the page-level `error.tsx` can't catch, i.e. in the
 * root layout itself (such as a missing setting). It replaces the layout, so
 * it brings its own <html> and <body>. Plain links instead of next/link: the
 * router may be what is broken.
 */
export default function GlobalError({
  error,
  retry,
}: {
  error: unknown;
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-background">
        <StatusMessage
          title="Something went wrong"
          message="Wishpool couldn't load. It's probably temporary, so try again in a moment."
        >
          <button onClick={retry} className={primaryActionClassName}>
            Try again
          </button>
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a href="/" className={secondaryActionClassName}>
            Go to Wishpool
          </a>
        </StatusMessage>
      </body>
    </html>
  );
}
