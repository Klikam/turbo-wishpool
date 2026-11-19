import Link from "next/link";

function PolishFlag() {
  return (
    <svg
      viewBox="0 0 16 10"
      className="inline-block w-4 h-2.5 rounded-[1px] ring-1 ring-border align-[-1px]"
      role="img"
      aria-label="Polish flag"
    >
      <rect width="16" height="5" fill="#ffffff" />
      <rect y="5" width="16" height="5" fill="#dc143c" />
    </svg>
  );
}

const linkClassName =
  "font-medium text-foreground/80 underline-offset-4 hover:text-foreground hover:underline transition-colors";

export function Footer() {
  return (
    <footer className="px-4 sm:px-6 py-6 text-center text-xs text-muted-foreground">
      Made in Poland <PolishFlag /> by{" "}
      <a href="mailto:contact@klikam.org" className={linkClassName}>
        Klikam
      </a>
      <span aria-hidden="true" className="mx-2">
        ·
      </span>
      <a
        href="mailto:contact@klikam.org?subject=Wishpool%20bug%20report"
        className={linkClassName}
      >
        Report a bug
      </a>
      <span aria-hidden="true" className="mx-2">
        ·
      </span>
      <Link href="/terms" className={linkClassName}>
        Terms
      </Link>
      <span aria-hidden="true" className="mx-2">
        ·
      </span>
      <Link href="/privacy" className={linkClassName}>
        Privacy
      </Link>
    </footer>
  );
}
