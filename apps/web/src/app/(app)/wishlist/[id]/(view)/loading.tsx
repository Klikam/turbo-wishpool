// Shown at once while the wishlist is fetched on the server (the session
// check and the list are two sequential backend calls). Mirrors the layout of
// the real page so nothing jumps when it arrives.
//
// Lives in the (view) group so it doesn't cover the edit page, and so the
// layout next to it can answer 404 for a missing list before this streams.
// The one thing that can no longer be a 404 here is a failed sign-in check.
export default function Loading() {
  return (
    <div className="flex-1 bg-background" role="status">
      <span className="sr-only">Loading wishlist…</span>

      <div className="border-b border-border bg-card/80">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="h-8 w-20 rounded-lg bg-secondary animate-pulse" />
          <div className="h-8 w-28 rounded-lg bg-secondary animate-pulse" />
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8" aria-hidden>
        <div className="mb-8">
          <div className="h-3 w-24 rounded bg-secondary animate-pulse mb-3" />
          <div className="h-9 w-2/3 max-w-md rounded bg-secondary animate-pulse mb-3" />
          <div className="h-4 w-1/2 max-w-xl rounded bg-secondary animate-pulse" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="bg-card rounded-2xl border border-border overflow-hidden"
            >
              <div className="h-40 bg-secondary animate-pulse" />
              <div className="p-4">
                <div className="h-4 w-3/4 rounded bg-secondary animate-pulse mb-3" />
                <div className="h-3 w-1/2 rounded bg-secondary animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
