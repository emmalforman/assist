// Parse incoming emails to extract event or job details.
// Triggered by subject line keywords: "event" or "job".

export type EmailPayload = {
  messageId?: string;
  from: string;          // "Sender Name <sender@example.com>" or just email
  subject: string;
  body: string;          // plain text body
};

export type ParsedIntent = "event" | "job" | "unknown";

export type ParsedEvent = {
  name: string;
  date?: string;         // ISO date if extractable
  venue?: string;
  description?: string;
  sourceContact: { name?: string; email?: string };
};

export type ParsedJob = {
  title: string;
  company?: string;
  description?: string;
  location?: string;
  salary?: string;
  applyUrl?: string;
  sourceContact: { name?: string; email?: string };
};

export function detectIntent(subject: string): ParsedIntent {
  const s = subject.toLowerCase();
  // Check for job first (more specific), then event
  if (/\b(job|hiring|role|position|opening|opportunity)\b/.test(s)) return "job";
  if (/\b(event|dinner|meetup|pitch|popup|pop-up|workshop|panel|summit)\b/.test(s)) return "event";
  return "unknown";
}

// Extract "Name <email@...>" format
function parseFrom(from: string): { name?: string; email?: string } {
  const match = from.match(/^(.*?)\s*<([^>]+)>$/);
  if (match) {
    return { name: match[1].trim().replace(/^"|"$/g, ""), email: match[2].trim() };
  }
  const emailMatch = from.match(/[\w.+-]+@[\w-]+\.[\w.-]+/);
  if (emailMatch) return { email: emailMatch[0] };
  return { name: from.trim() };
}

// Extract date from text (simple patterns)
function extractDate(text: string): string | undefined {
  // Match patterns like "May 15", "May 15, 2026", "5/15/2026", "2026-05-15"
  const patterns = [
    /\b(\d{4}-\d{2}-\d{2})\b/,
    /\b(\d{1,2}\/\d{1,2}\/\d{2,4})\b/,
    /\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2})(?:,?\s+(\d{4}))?\b/i,
    /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{1,2})(?:,?\s+(\d{4}))?\b/i,
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      try {
        const d = new Date(match[0]);
        if (!isNaN(d.getTime())) return d.toISOString().split("T")[0];
      } catch {}
    }
  }
  return undefined;
}

// Extract simple "key: value" style fields from body
function extractField(body: string, keys: string[]): string | undefined {
  for (const key of keys) {
    const regex = new RegExp(`^\\s*${key}\\s*[:：]\\s*(.+)$`, "im");
    const match = body.match(regex);
    if (match) return match[1].trim();
  }
  return undefined;
}

// Extract URL
function extractUrl(text: string): string | undefined {
  const match = text.match(/https?:\/\/[^\s<>"]+/);
  return match ? match[0] : undefined;
}

export function parseEventEmail(payload: EmailPayload): ParsedEvent {
  const { subject, body } = payload;
  const sourceContact = parseFrom(payload.from);

  // Remove the word "event" from the subject to get a cleaner name
  let name = subject.replace(/\b(event|invite|invitation)\b/gi, "").replace(/[:\-–—]+/g, " ").trim();
  if (!name) name = "Untitled Event";

  const date = extractDate(subject) || extractDate(body);
  const venue = extractField(body, ["venue", "location", "where", "place"]);
  const description = body.length > 500 ? body.slice(0, 500) + "..." : body;

  return { name, date, venue, description, sourceContact };
}

export function parseJobEmail(payload: EmailPayload): ParsedJob {
  const { subject, body } = payload;
  const sourceContact = parseFrom(payload.from);

  // Strip "job" or "hiring" from subject to get title
  let title = subject.replace(/\b(job|hiring|role|position|opening)\b/gi, "").replace(/[:\-–—]+/g, " ").trim();
  if (!title) title = "Untitled Role";

  // Try to extract "Title at Company" pattern
  const atMatch = title.match(/^(.+?)\s+(?:at|@)\s+(.+)$/i);
  let company: string | undefined;
  if (atMatch) {
    title = atMatch[1].trim();
    company = atMatch[2].trim();
  } else {
    company = extractField(body, ["company", "org", "organization", "employer"]);
  }

  const location = extractField(body, ["location", "where", "based"]);
  const salary = extractField(body, ["salary", "comp", "compensation", "pay"]);
  const applyUrl = extractUrl(body);
  const description = body.length > 500 ? body.slice(0, 500) + "..." : body;

  return { title, company, description, location, salary, applyUrl, sourceContact };
}

// Main entry point
export function parseEmail(payload: EmailPayload): {
  intent: ParsedIntent;
  data: ParsedEvent | ParsedJob | null;
} {
  const intent = detectIntent(payload.subject);
  if (intent === "event") return { intent, data: parseEventEmail(payload) };
  if (intent === "job") return { intent, data: parseJobEmail(payload) };
  return { intent, data: null };
}
