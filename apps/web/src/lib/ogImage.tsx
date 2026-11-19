import { ImageResponse } from "next/og";

// Shared by the opengraph-image routes: the card shown when a link is
// shared in WhatsApp, Messenger, Slack…
export const ogImageSize = { width: 1200, height: 630 };

/**
 * Open Graph fields every page shares. A page that sets `openGraph` replaces
 * the layout's whole object, so it spreads these in again.
 */
export const siteOpenGraph = { siteName: "Wishpool", type: "website" } as const;
export const ogImageContentType = "image/png";

interface OgCardProps {
  /** Small line above the title, e.g. the occasion. */
  eyebrow?: string;
  title: string;
  subtitle?: string;
}

/**
 * One of the site's Google fonts, cut down to `text`. Without a browser-like
 * user agent Google Fonts serves TTF, which the image renderer needs (not
 * WOFF2). Null if it can't be loaded, so the card falls back to the default
 * font.
 */
async function loadFont(
  family: string,
  weight: number,
  text: string,
): Promise<ArrayBuffer | null> {
  try {
    const css = await fetch(
      `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:wght@${weight.toString()}&text=${encodeURIComponent(text)}`,
    ).then((response) => response.text());
    const fontUrl = /src: url\((.+?)\) format\('(?:truetype|opentype)'\)/.exec(
      css,
    )?.[1];
    if (!fontUrl) return null;
    const font = await fetch(fontUrl);
    return font.ok ? await font.arrayBuffer() : null;
  } catch {
    return null;
  }
}

export async function ogCard({ eyebrow, title, subtitle }: OgCardProps) {
  const [headingFont, bodyFont] = await Promise.all([
    loadFont("Playfair Display", 600, `Wishpool${title}`),
    // The eyebrow is drawn in capitals.
    loadFont("Figtree", 400, `${eyebrow?.toUpperCase() ?? ""}${subtitle ?? ""}`),
  ]);
  const headingFamily = headingFont ? "Playfair Display" : undefined;
  const fonts = [
    ...(headingFont
      ? [{ name: "Playfair Display", data: headingFont, weight: 600 as const }]
      : []),
    ...(bodyFont
      ? [{ name: "Figtree", data: bodyFont, weight: 400 as const }]
      : []),
  ];

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          background: "#4a1942",
          color: "#faf7f2",
          fontFamily: bodyFont ? "Figtree" : undefined,
          position: "relative",
        }}
      >
        {/* Decorative rings, as on the landing page */}
        <div
          style={{
            position: "absolute",
            top: -140,
            right: -140,
            width: 520,
            height: 520,
            borderRadius: 9999,
            border: "2px solid rgba(255,255,255,0.1)",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: -60,
            right: -60,
            width: 360,
            height: 360,
            borderRadius: 9999,
            border: "2px solid rgba(255,255,255,0.1)",
          }}
        />

        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <svg
            width="56"
            height="56"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#faf7f2"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="8" width="18" height="4" rx="1" />
            <path d="M12 8v13" />
            <path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7" />
            <path
              d="M7.5 8a2.5 2.5 0 0 1 0-5A4.8 8 0 0 1 12 8a4.8 8 0 0 1 4.5-5 2.5 2.5 0 0 1 0 5"
              stroke="#e7a9a6"
            />
          </svg>
          <span style={{ fontSize: 40, fontFamily: headingFamily }}>
            Wishpool
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {eyebrow && (
            <span
              style={{
                fontSize: 30,
                color: "#e8b89a",
                textTransform: "uppercase",
                letterSpacing: 4,
              }}
            >
              {eyebrow}
            </span>
          )}
          <span
            style={{
              fontSize: title.length > 40 ? 64 : 84,
              fontFamily: headingFamily,
              lineHeight: 1.1,
              maxWidth: 1000,
            }}
          >
            {title}
          </span>
          {subtitle && (
            <span style={{ fontSize: 34, color: "rgba(250,247,242,0.7)" }}>
              {subtitle}
            </span>
          )}
        </div>
      </div>
    ),
    { ...ogImageSize, fonts: fonts.length > 0 ? fonts : undefined },
  );
}
