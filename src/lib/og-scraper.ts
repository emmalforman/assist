// Fetch a URL and extract OpenGraph / Twitter / standard metadata.
// Used as a fallback for URLs that don't have rich structured data in
// the URL itself (Instagram, TikTok, blog posts, etc.).
//
// This runs on the server only.

export type OgTags = {
  title?: string;
  description?: string;
  image?: string;
  siteName?: string;
  url?: string;
};

const UA =
  "Mozilla/5.0 (compatible; Mycabot/1.0; +https://mycacollective.com)";

function decodeEntities(text: string): string {
  return text
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(parseInt(dec, 10)));
}

function extractMeta(html: string, property: string): string | undefined {
  // Try both property= and name= forms; tolerate attribute order.
  const patterns = [
    new RegExp(
      `<meta[^>]+(?:property|name)\\s*=\\s*["']${property}["'][^>]+content\\s*=\\s*["']([^"']*)["']`,
      "i"
    ),
    new RegExp(
      `<meta[^>]+content\\s*=\\s*["']([^"']*)["'][^>]+(?:property|name)\\s*=\\s*["']${property}["']`,
      "i"
    ),
  ];
  for (const re of patterns) {
    const m = html.match(re);
    if (m) return decodeEntities(m[1]);
  }
  return undefined;
}

function extractTitle(html: string): string | undefined {
  const m = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  return m ? decodeEntities(m[1]).trim() : undefined;
}

export async function fetchOgTags(url: string, timeoutMs = 5000): Promise<OgTags | null> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    const res = await fetch(url, {
      headers: {
        "User-Agent": UA,
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
      signal: controller.signal,
      redirect: "follow",
    });
    clearTimeout(timer);

    if (!res.ok) return null;
    const contentType = res.headers.get("content-type") || "";
    if (!contentType.includes("text/html")) return null;

    // Cap at 500KB — OG tags always live in <head>.
    const reader = res.body?.getReader();
    if (!reader) {
      const text = await res.text();
      return parseOgFromHtml(text);
    }

    let html = "";
    const decoder = new TextDecoder();
    let read = 0;
    const MAX = 500_000;
    while (read < MAX) {
      const { done, value } = await reader.read();
      if (done) break;
      html += decoder.decode(value, { stream: true });
      read += value.byteLength;
      if (html.includes("</head>")) break;
    }
    try {
      await reader.cancel();
    } catch {}

    return parseOgFromHtml(html);
  } catch {
    return null;
  }
}

function parseOgFromHtml(html: string): OgTags {
  return {
    title:
      extractMeta(html, "og:title") ||
      extractMeta(html, "twitter:title") ||
      extractTitle(html),
    description:
      extractMeta(html, "og:description") ||
      extractMeta(html, "twitter:description") ||
      extractMeta(html, "description"),
    image:
      extractMeta(html, "og:image") ||
      extractMeta(html, "twitter:image"),
    siteName: extractMeta(html, "og:site_name"),
    url: extractMeta(html, "og:url"),
  };
}

// Extract a YYYY-MM-DD ISO date from free-form text.
export function extractDateFromText(text: string): string | undefined {
  if (!text) return undefined;

  // ISO format
  const iso = text.match(/\b(\d{4}-\d{2}-\d{2})\b/);
  if (iso) return iso[1];

  // "May 15" or "May 15, 2026" or "May 15 2026"
  const longMonth = text.match(
    /\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2})(?:(?:,|\s+)\s*(\d{4}))?/i
  );
  const shortMonth = text.match(
    /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)\.?\s+(\d{1,2})(?:(?:,|\s+)\s*(\d{4}))?/i
  );

  const match = longMonth || shortMonth;
  if (match) {
    const currentYear = new Date().getFullYear();
    const dateStr = `${match[1]} ${match[2]} ${match[3] || currentYear}`;
    const parsed = new Date(dateStr);
    if (!isNaN(parsed.getTime())) {
      return parsed.toISOString().split("T")[0];
    }
  }

  // MM/DD/YYYY
  const slash = text.match(/\b(\d{1,2})\/(\d{1,2})\/(\d{2,4})\b/);
  if (slash) {
    const [_, m, d, y] = slash;
    const year = y.length === 2 ? 2000 + parseInt(y) : parseInt(y);
    const date = new Date(year, parseInt(m) - 1, parseInt(d));
    if (!isNaN(date.getTime())) return date.toISOString().split("T")[0];
  }

  return undefined;
}
