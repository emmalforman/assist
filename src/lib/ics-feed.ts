// Fetch and parse iCal (.ics) feeds into structured event objects.
// Works with Google Calendar, Luma, Partiful, and any standard iCal feed.

export type IcsEvent = {
  uid: string;
  summary: string;
  dtstart?: Date;
  dtend?: Date;
  location?: string;
  description?: string;
  url?: string;
};

function unescapeIcs(s: string): string {
  return s.replace(/\\n/g, "\n").replace(/\\,/g, ",").replace(/\\;/g, ";").replace(/\\\\/g, "\\");
}

function parseIcsDate(raw: string): Date | undefined {
  // Handle formats: 20260415T180000Z, 20260415T180000, 20260415
  const cleaned = raw.replace(/[^0-9TZ]/g, "");
  if (cleaned.length >= 8) {
    const y = parseInt(cleaned.slice(0, 4));
    const m = parseInt(cleaned.slice(4, 6)) - 1;
    const d = parseInt(cleaned.slice(6, 8));
    let h = 0, min = 0, s = 0;
    if (cleaned.length >= 15) {
      h = parseInt(cleaned.slice(9, 11));
      min = parseInt(cleaned.slice(11, 13));
      s = parseInt(cleaned.slice(13, 15));
    }
    if (cleaned.endsWith("Z")) {
      return new Date(Date.UTC(y, m, d, h, min, s));
    }
    return new Date(y, m, d, h, min, s);
  }
  return undefined;
}

export function parseIcsFeed(icsText: string): IcsEvent[] {
  const events: IcsEvent[] = [];
  // Unfold lines (RFC 5545: continuation lines start with space or tab)
  const unfolded = icsText.replace(/\r\n[ \t]/g, "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const blocks = unfolded.split("BEGIN:VEVENT");

  for (let i = 1; i < blocks.length; i++) {
    const block = blocks[i].split("END:VEVENT")[0];
    if (!block) continue;

    const lines = block.split("\n").filter(Boolean);
    const props: Record<string, string> = {};

    for (const line of lines) {
      // Property can have params: "DTSTART;TZID=America/New_York:20260415T180000"
      const colonIdx = line.indexOf(":");
      if (colonIdx === -1) continue;
      const key = line.slice(0, colonIdx).split(";")[0].toUpperCase().trim();
      const value = line.slice(colonIdx + 1).trim();
      props[key] = value;
    }

    const uid = props["UID"];
    const summary = props["SUMMARY"];
    if (!uid || !summary) continue;

    events.push({
      uid,
      summary: unescapeIcs(summary),
      dtstart: props["DTSTART"] ? parseIcsDate(props["DTSTART"]) : undefined,
      dtend: props["DTEND"] ? parseIcsDate(props["DTEND"]) : undefined,
      location: props["LOCATION"] ? unescapeIcs(props["LOCATION"]) : undefined,
      description: props["DESCRIPTION"] ? unescapeIcs(props["DESCRIPTION"]) : undefined,
      url: props["URL"] || undefined,
    });
  }

  return events;
}

export async function fetchIcsFeed(url: string, timeoutMs = 10000): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  const res = await fetch(url, {
    headers: {
      "User-Agent": "Myca/1.0 (Calendar Sync)",
      Accept: "text/calendar, text/plain, */*",
    },
    signal: controller.signal,
    redirect: "follow",
  });
  clearTimeout(timer);

  if (!res.ok) {
    throw new Error(`Feed returned ${res.status}: ${res.statusText}`);
  }

  return await res.text();
}

// Detect platform from the feed URL.
export function detectPlatform(url: string): string {
  try {
    const host = new URL(url).hostname.toLowerCase().replace(/^www\./, "");
    if (host.includes("lu.ma") || host.includes("luma")) return "luma";
    if (host.includes("partiful")) return "partiful";
    if (host.includes("google") || host.includes("calendar.google")) return "gcal";
    if (host.includes("outlook") || host.includes("office365")) return "outlook";
    return "ical";
  } catch {
    return "ical";
  }
}
