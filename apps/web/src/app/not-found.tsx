import {
  primaryActionClassName,
  StatusMessage,
} from "@/components/sections/StatusMessage";
import Link from "next/link";

export default function NotFound() {
  return (
    <StatusMessage
      title="Nothing here"
      message="The link may be mistyped, or the wishlist was deleted by its owner."
    >
      <Link href="/" className={primaryActionClassName}>
        Go to Wishpool
      </Link>
    </StatusMessage>
  );
}
