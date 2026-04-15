// URL parser that extracts structured event data from known event platforms.
// Handles Resy, Luma, Eventbrite, Partiful, Posh, plus a generic fallback.

export type ParsedUrlEvent = {
  name: string;
  date?: string;       // ISO date (YYYY-MM-DD)
  venue?: string;
  city?: string;
  url: string;
  platform: string;    // "resy" | "luma" | "eventbrite" | "partiful" | "posh" | "generic"
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

// Turn a slug like "make-food-not-waste-dining-series" into Title Case.
function slugToTitle(slug: string): string {
  return slug
    .split(/[-_]/)
    .filter(Boolean)
    .map((word) => {
      if (word.length <= 2 && /^[a-z]+$/i.test(word)) return word.toUpperCase();
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
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
// https://resy.com/cities/{city-slug}/venues/{venue-slug}?date=YYYY-MM-DD
function parseResy(url: URL): ParsedUrlEvent | null {
  const parts = url.pathname.split("/").filter(Boolean);
  const citiesIdx = parts.indexOf("cities");
  const venuesIdx = parts.indexOf("venues");

  let city: string | undefined;
  let venue: string | undefined;

  if (citiesIdx !== -1 && parts[citiesIdx + 1]) {
    city = normalizeCity(parts[citiesIdx + 1]);
  }
  if (venuesIdx !== -1 && parts[venuesIdx + 1]) {
    venue = slugToTitle(parts[venuesIdx + 1]);
  }

  const dateParam = url.searchParams.get("date");
  const date = dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam) ? dateParam : undefined;

  if (!venue) return null;

  return {
    name: venue,
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

  // Generic fallback — pull last path segment as a guess at the event name.
  const parts = url.pathname.split("/").filter(Boolean);
  if (parts.length === 0) return null;
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
