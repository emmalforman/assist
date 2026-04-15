import { prisma } from "@/lib/db";
import { parseEmail } from "@/lib/email-parser";
import { parseEventUrl } from "@/lib/url-parser";
import { getAdminEmails } from "@/lib/admin";
import { approveInboxItem } from "@/lib/actions";
import { NextRequest, NextResponse } from "next/server";

// URL-based ingest endpoint.
// Accepts { url: string } — parses known event-platform URLs (Resy, Luma,
// Eventbrite, Partiful, Posh, generic fallback) and creates an InboxItem.
// The sender is treated as the admin, so the item is auto-approved.

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();
    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "Missing required field: url" }, { status: 400 });
    }

    const urlEvent = parseEventUrl(url);
    if (!urlEvent) {
      return NextResponse.json({ error: "Could not parse URL" }, { status: 400 });
    }

    // Build a synthetic email payload with the admin as sender so it triggers
    // the auto-approval path.
    const adminEmail = getAdminEmails()[0] || "emma@mycacollective.com";
    const payload = {
      from: adminEmail,
      subject: `Event: ${urlEvent.name}`,
      body: url,
    };

    const { intent, data } = parseEmail(payload);

    const item = await prisma.inboxItem.create({
      data: {
        fromEmail: adminEmail,
        fromName: "Admin (URL paste)",
        subject: payload.subject,
        body: url,
        intent,
        status: "pending",
        parsedData: data ? JSON.stringify(data) : null,
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
