// Generate a minimal .ics file for an event so members can add it to
// Apple Calendar, Google Calendar, Outlook, etc.

type IcsEventInput = {
  id: string;
  name: string;
  date: Date;
  durationHours?: number;
  venue?: string;
  city?: string;
  description?: string;
  url?: string;
};

function pad(n: number): string {
  return n.toString().padStart(2, "0");
}

// Format as UTC YYYYMMDDTHHmmssZ
function toIcsDate(d: Date): string {
  return (
    d.getUTCFullYear().toString() +
    pad(d.getUTCMonth() + 1) +
    pad(d.getUTCDate()) +
    "T" +
    pad(d.getUTCHours()) +
    pad(d.getUTCMinutes()) +
    pad(d.getUTCSeconds()) +
    "Z"
  );
}

function escape(text: string): string {
  return text.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");
}

export function buildIcs(event: IcsEventInput): string {
  const start = event.date;
  const end = new Date(start.getTime() + (event.durationHours ?? 2) * 60 * 60 * 1000);
  const location = [event.venue, event.city].filter(Boolean).join(", ");

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Myca//Event Growth Engine//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${event.id}@myca`,
    `DTSTAMP:${toIcsDate(new Date())}`,
    `DTSTART:${toIcsDate(start)}`,
    `DTEND:${toIcsDate(end)}`,
    `SUMMARY:${escape(event.name)}`,
    location ? `LOCATION:${escape(location)}` : "",
    event.description ? `DESCRIPTION:${escape(event.description)}` : "",
    event.url ? `URL:${event.url}` : "",
    "END:VEVENT",
    "END:VCALENDAR",
  ]
    .filter(Boolean)
    .join("\r\n");
}
