"use client";

import {
  primaryActionClassName,
  secondaryActionClassName,
  StatusMessage,
} from "@/components/sections/StatusMessage";
import Link from "next/link";
import { useEffect } from "react";

export default function Error({
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
    <StatusMessage
      title="Something went wrong"
      message="We couldn't load this page. It's probably temporary, so try again in a moment."
    >
      <button onClick={retry} className={primaryActionClassName}>
        Try again
      </button>
      <Link href="/" className={secondaryActionClassName}>
        Go to Wishpool
      </Link>
    </StatusMessage>
  );
}
