import { prisma } from "@/lib/db";
import { parseEmail } from "@/lib/email-parser";
import { parseEventUrlEnriched } from "@/lib/url-parser";
import { getAdminEmails } from "@/lib/admin";
import { approveInboxItem } from "@/lib/actions";
import { NextRequest, NextResponse } from "next/server";

// URL-based ingest endpoint.
// Accepts { url: string, description?: string }.
//
// 1. URL-based parsing for known platforms (Resy, Luma, Eventbrite, Partiful,
//    Posh — extracts dates/venues/cities directly from the URL).
// 2. OpenGraph scraping for sites that allow bots (blog posts, some CMSes).
// 3. User-provided description (e.g. pasted Instagram caption) — parsed
//    with the same date/venue extractors as email bodies. This is the
//    escape hatch for platforms that block automated fetching.

export async function POST(request: NextRequest) {
  try {
    const { url, description } = await request.json();
    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "Missing required field: url" }, { status: 400 });
    }

    const urlEvent = await parseEventUrlEnriched(url);
    if (!urlEvent) {
      return NextResponse.json({ error: "Could not parse URL" }, { status: 400 });
    }

    // Combine: pasted description > OG description > just the URL.
    const bodyText = [url, description, urlEvent.description]
      .filter(Boolean)
      .filter((v, i, arr) => arr.indexOf(v) === i) // dedup
      .join("\n\n");

    // For platforms without useful URL-based names (Instagram, TikTok,
    // generic), prefer the first line of the pasted description as the
    // event name.
    const weakNamePlatforms = new Set(["instagram", "tiktok", "generic"]);
    let subjectName = urlEvent.name;
    if (weakNamePlatforms.has(urlEvent.platform) && description) {
      const firstLine = description.split(/[.\n]/)[0].trim();
      if (firstLine && firstLine.length > 3 && firstLine.length < 120) {
        subjectName = firstLine;
      }
    }

    const adminEmail = getAdminEmails()[0] || "emma@mycacollective.com";
    const payload = {
      from: adminEmail,
      subject: `Event: ${subjectName}`,
      body: bodyText,
    };

    const { intent, data } = parseEmail(payload);

    // Merge URL-parser fields into email-parsed data
    let finalData = data;
    if (data && intent === "event") {
      finalData = {
        ...data,
        name: (data as { name?: string }).name || urlEvent.name,
        date: (data as { date?: string }).date || urlEvent.date,
        venue: (data as { venue?: string }).venue || urlEvent.venue,
        city: (data as { city?: string }).city || urlEvent.city,
        url: (data as { url?: string }).url || urlEvent.url,
        platform: (data as { platform?: string }).platform || urlEvent.platform,
        description:
          (data as { description?: string }).description ||
          description ||
          urlEvent.description,
      } as typeof data;
    }

    const item = await prisma.inboxItem.create({
      data: {
        fromEmail: adminEmail,
        fromName: "Admin (URL paste)",
        subject: payload.subject,
        body: bodyText,
        intent,
        status: "pending",
        parsedData: finalData ? JSON.stringify(finalData) : null,
      },
    });

    if (intent !== "unknown") {
      const result = await approveInboxItem(item.id);
      return NextResponse.json(
        { status: "auto_approved", id: item.id, intent, ...result },
        { status: 201 }
      );
    }

    return NextResponse.json({ status: "received", id: item.id, intent }, { status: 201 });
  } catch (error) {
    console.error("URL ingest error:", error);
    return NextResponse.json({ error: "Failed to process URL" }, { status: 500 });
  }
}
