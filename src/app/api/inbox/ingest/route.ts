import { prisma } from "@/lib/db";
import { parseEmail, EmailPayload } from "@/lib/email-parser";
import { isAdminEmail } from "@/lib/admin";
import { approveInboxItem } from "@/lib/actions";
import { NextRequest, NextResponse } from "next/server";

// Email webhook endpoint.
// Wire this up to an email forwarding service (SendGrid Inbound Parse,
// Mailgun Routes, Cloudflare Email Workers, etc.) and point it at
// emma@mycacollective.com.
//
// Expected JSON payload:
// {
//   "messageId": "abc123",     // optional - Gmail or provider message ID for dedup
//   "from": "Sender <sender@example.com>",
//   "subject": "Event: Member Meetup at Moonrise",
//   "body": "Let's do a meetup on May 3rd..."
// }
//
// If the sender's email matches an admin (configured via ADMIN_EMAILS env var,
// defaults to emma@mycacollective.com) the item is auto-approved and the
// event/job is created immediately.

export async function POST(request: NextRequest) {
  try {
    const payload = (await request.json()) as EmailPayload;

    if (!payload.from || !payload.subject || !payload.body) {
      return NextResponse.json({ error: "Missing required fields: from, subject, body" }, { status: 400 });
    }

    // Dedup by messageId if provided
    if (payload.messageId) {
      const existing = await prisma.inboxItem.findUnique({
        where: { messageId: payload.messageId },
      });
      if (existing) {
        return NextResponse.json({ status: "duplicate", id: existing.id });
      }
    }

    const { intent, data } = parseEmail(payload);

    // Extract email address from "Name <email>" format
    const fromMatch = payload.from.match(/^(.*?)\s*<([^>]+)>$/);
    const fromEmail = fromMatch ? fromMatch[2].trim() : payload.from.trim();
    const fromName = fromMatch ? fromMatch[1].trim().replace(/^"|"$/g, "") : null;

    const item = await prisma.inboxItem.create({
      data: {
        messageId: payload.messageId || null,
        fromEmail,
        fromName,
        subject: payload.subject,
        body: payload.body,
        intent,
        status: "pending",
        parsedData: data ? JSON.stringify(data) : null,
      },
    });

    // Auto-approve if sender is admin AND we successfully parsed intent
    if (intent !== "unknown" && isAdminEmail(fromEmail)) {
      const result = await approveInboxItem(item.id);
      return NextResponse.json(
        {
          status: "auto_approved",
          id: item.id,
          intent,
          ...result,
        },
        { status: 201 }
      );
    }

    return NextResponse.json({ status: "received", id: item.id, intent }, { status: 201 });
  } catch (error) {
    console.error("Inbox ingest error:", error);
    return NextResponse.json({ error: "Failed to process email" }, { status: 500 });
  }
}
