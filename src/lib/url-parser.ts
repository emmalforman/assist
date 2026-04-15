// URL parser that extracts structured event data from known event platforms.
// Handles Resy, Luma, Eventbrite, Partiful, Posh, plus a generic fallback.

export type ParsedUrlEvent = {
  name: string;
  date?: string;       // ISO date (YYYY-MM-DD)
  venue?: string;
  city?: string;
  url: string;
  platform: string;    // "resy" | "luma" | "eventbrite" | "partiful" | "posh" | "instagram" | "tiktok" | "generic"
  description?: string;
  image?: string;
};

// Common city-slug → display name mapping.
const CITY_SLUGS: Record<string, string> = {
  "los-angeles-ca": "Los Angeles",
  "los-angeles": "Los Angeles",
  "new-york-ny": "New York",
  "new-york": "New York",
  "nyc": "New York",
  "san-francisco-ca": "San Francisco",
  "san-francisco": "San Francisco",
  "sf": "San Francisco",
  "chicago-il": "Chicago",
  "chicago": "Chicago",
  "boston-ma": "Boston",
  "boston": "Boston",
  "miami-fl": "Miami",
  "miami": "Miami",
  "austin-tx": "Austin",
  "austin": "Austin",
  "seattle-wa": "Seattle",
  "seattle": "Seattle",
  "washington-dc": "Washington",
  "london": "London",
};

const STOP_WORDS = new Set(["a", "an", "and", "at", "by", "for", "in", "of", "on", "or", "the", "to", "vs", "x"]);
const ACRONYMS = new Set(["ai", "ml", "cpg", "dc", "la", "ny", "nyc", "sf", "uk", "us", "vip"]);

// Turn a slug like "make-food-not-waste-dining-series" into Title Case.
function slugToTitle(slug: string): string {
  const words = slug.split(/[-_]/).filter(Boolean);
  return words
    .map((word, i) => {
      const lower = word.toLowerCase();
      if (ACRONYMS.has(lower)) return lower.toUpperCase();
      if (i > 0 && STOP_WORDS.has(lower)) return lower;
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join(" ");
}

function normalizeCity(slug: string): string | undefined {
  const key = slug.toLowerCase();
  if (CITY_SLUGS[key]) return CITY_SLUGS[key];
  // Strip trailing "-xx" state code if present (e.g., "portland-or" → "portland")
  const stripped = key.replace(/-[a-z]{2}$/, "");
  if (CITY_SLUGS[stripped]) return CITY_SLUGS[stripped];
  // Fall back to title-casing the slug.
  return slugToTitle(stripped);
}

// ─── Resy ─────────────────────────────────────────────────
// Two URL shapes:
//   a) https://resy.com/cities/{city}/venues/{venue}?date=YYYY-MM-DD
//   b) https://resy.com/cities/{city}/venues/{venue}/events/{event-slug}-YYYY-MM-DD?date=YYYY-MM-DD
function parseResy(url: URL): ParsedUrlEvent | null {
  const parts = url.pathname.split("/").filter(Boolean);
  const citiesIdx = parts.indexOf("cities");
  const venuesIdx = parts.indexOf("venues");
  const eventsIdx = parts.indexOf("events");

  let city: string | undefined;
  let venue: string | undefined;
  let name: string | undefined;
  let date: string | undefined;

  if (citiesIdx !== -1 && parts[citiesIdx + 1]) {
    city = normalizeCity(parts[citiesIdx + 1]);
  }
  if (venuesIdx !== -1 && parts[venuesIdx + 1]) {
    venue = slugToTitle(parts[venuesIdx + 1]);
  }

  if (eventsIdx !== -1 && parts[eventsIdx + 1]) {
    const eventSlug = parts[eventsIdx + 1];
    // Date is typically appended as "-YYYY-MM-DD" at the end of the slug.
    const trailingDate = eventSlug.match(/-(\d{4}-\d{2}-\d{2})$/);
    if (trailingDate) {
      date = trailingDate[1];
      name = slugToTitle(eventSlug.replace(/-\d{4}-\d{2}-\d{2}$/, ""));
    } else {
      name = slugToTitle(eventSlug);
    }
  } else {
    name = venue;
  }

  // Query-string date wins only if we didn't extract one from the slug.
  if (!date) {
    const dateParam = url.searchParams.get("date");
    if (dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam)) date = dateParam;
  }

  if (!venue && !name) return null;

  return {
    name: name || venue || "Resy Event",
    date,
    venue,
    city,
    url: url.toString(),
    platform: "resy",
  };
}

// ─── Luma ─────────────────────────────────────────────────
// https://lu.ma/xyz123 or https://luma.com/xyz123
// URL alone doesn't carry rich data, so we can only record the URL + fallback name.
function parseLuma(url: URL): ParsedUrlEvent | null {
  const parts = url.pathname.split("/").filter(Boolean);
  const slug = parts[parts.length - 1];
  if (!slug) return null;

  return {
    name: `Luma Event (${slug})`,
    url: url.toString(),
    platform: "luma",
  };
}

// ─── Eventbrite ───────────────────────────────────────────
// https://www.eventbrite.com/e/event-name-slug-123456
function parseEventbrite(url: URL): ParsedUrlEvent | null {
  const parts = url.pathname.split("/").filter(Boolean);
  const eIdx = parts.indexOf("e");
  if (eIdx === -1 || !parts[eIdx + 1]) return null;

  const slug = parts[eIdx + 1];
  // Strip trailing numeric event ID (e.g., "-123456789")
  const nameSlug = slug.replace(/-\d+$/, "");
  const name = slugToTitle(nameSlug);

  return {
    name,
    url: url.toString(),
    platform: "eventbrite",
  };
}

// ─── Partiful ─────────────────────────────────────────────
function parsePartiful(url: URL): ParsedUrlEvent | null {
  const parts = url.pathname.split("/").filter(Boolean);
  const slug = parts[parts.length - 1];
  if (!slug) return null;

  return {
    name: `Partiful Event`,
    url: url.toString(),
    platform: "partiful",
  };
}

// ─── Posh ─────────────────────────────────────────────────
function parsePosh(url: URL): ParsedUrlEvent | null {
  const parts = url.pathname.split("/").filter(Boolean);
  const eIdx = parts.indexOf("e");
  const slug = eIdx !== -1 ? parts[eIdx + 1] : parts[parts.length - 1];
  if (!slug) return null;

  return {
    name: slugToTitle(slug.replace(/-\d+$/, "")),
    url: url.toString(),
    platform: "posh",
  };
}

// ─── Instagram ────────────────────────────────────────────
// https://www.instagram.com/p/{shortcode}/
// https://www.instagram.com/reel/{shortcode}/
// URL alone only gives us the shortcode — we rely on OG scraping for content.
function parseInstagram(url: URL): ParsedUrlEvent | null {
  const parts = url.pathname.split("/").filter(Boolean);
  const kind = parts[0]; // "p" (post), "reel", "tv"
  const shortcode = parts[1];
  if (!shortcode) return null;

  const label = kind === "reel" ? "Reel" : kind === "tv" ? "IGTV" : "Post";
  return {
    name: `Instagram ${label}`,
    url: url.toString(),
    platform: "instagram",
  };
}

// ─── TikTok ──────────────────────────────────────────────
function parseTikTok(url: URL): ParsedUrlEvent | null {
  return {
    name: "TikTok Post",
    url: url.toString(),
    platform: "tiktok",
  };
}

// ─── Main entry point ─────────────────────────────────────
export function parseEventUrl(rawUrl: string): ParsedUrlEvent | null {
  let url: URL;
  try {
    url = new URL(rawUrl.trim());
  } catch {
    return null;
  }

  const host = url.hostname.toLowerCase().replace(/^www\./, "");

  if (host === "resy.com") return parseResy(url);
  if (host === "luma.com" || host === "lu.ma") return parseLuma(url);
  if (host.endsWith("eventbrite.com")) return parseEventbrite(url);
  if (host === "partiful.com") return parsePartiful(url);
  if (host === "posh.vip") return parsePosh(url);
  if (host === "instagram.com") return parseInstagram(url);
  if (host === "tiktok.com") return parseTikTok(url);

  // Generic fallback — pull last path segment as a guess at the event name.
  const parts = url.pathname.split("/").filter(Boolean);
  if (parts.length === 0) {
    // Bare host — still return something so OG enrichment can take over.
    return {
      name: host,
      url: url.toString(),
      platform: "generic",
    };
  }
  const lastSlug = parts[parts.length - 1];
  return {
    name: slugToTitle(lastSlug),
    url: url.toString(),
    platform: "generic",
  };
}

// Extract all URLs from a text body.
export function extractUrls(text: string): string[] {
  const matches = text.match(/https?:\/\/[^\s<>"]+/g);
  return matches ? Array.from(new Set(matches)) : [];
}

// Async, server-side enrichment. Combines URL-based parsing (for known
// platforms like Resy) with fetched OpenGraph / meta tags (for platforms
// where structured data lives on the page, like Instagram, blog posts).
//
// Always prefer URL-parsed data when present (it's more reliable than
// HTML scraping), and fall back to OG tags for anything missing.
export async function parseEventUrlEnriched(
  rawUrl: string
): Promise<(ParsedUrlEvent & { image?: string }) | null> {
  const base = parseEventUrl(rawUrl);
  if (!base) return null;

  // Platforms where URL alone provides enough data — skip scraping.
  const skipScrape = new Set(["resy", "eventbrite"]);
  if (skipScrape.has(base.platform)) return base;

  // Dynamic import so the heavier dependency stays out of client bundles.
  const { fetchOgTags, extractDateFromText } = await import("@/lib/og-scraper");
  const og = await fetchOgTags(rawUrl);
  if (!og) return base;

  // Clean up titles like "Sarah Chen on Instagram: "Join us on May 15…""
  let enrichedName = base.name;
  let description = og.description;

  if (og.title) {
    const m = og.title.match(/^(.+?)\s+on\s+(Instagram|TikTok):\s*["""](.+?)["""]/i);
    if (m) {
      enrichedName = m[3].length > 80 ? m[3].slice(0, 80) + "..." : m[3];
      if (!description) description = m[3];
    } else if (base.platform !== "luma" || enrichedName.startsWith("Luma Event")) {
      enrichedName = og.title.length > 100 ? og.title.slice(0, 100) + "..." : og.title;
    }
  }

  // Try to extract a date from description if URL didn't give us one.
  const date =
    base.date ||
    (description ? extractDateFromText(description) : undefined) ||
    (og.title ? extractDateFromText(og.title) : undefined);

  return {
    ...base,
    name: enrichedName || base.name,
    date,
    description,
    image: og.image,
  } as ParsedUrlEvent & { image?: string; description?: string };
}
