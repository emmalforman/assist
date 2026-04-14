// Server actions for event automation
// These handle the pipeline: status change → auto-create campaigns → queue emails

"use server";

import { prisma } from "@/lib/db";
import { EVENT_TEMPLATES, fillTemplate } from "@/lib/templates";
import { revalidatePath } from "next/cache";

// ─── Create event from template ────────────────────────
export async function createEventFromTemplate(formData: FormData) {
  const templateKey = formData.get("template") as string;
  const date = formData.get("date") as string;
  const venueId = formData.get("venueId") as string;
  const customName = formData.get("name") as string;

  const template = EVENT_TEMPLATES[templateKey];
  if (!template) throw new Error("Invalid template");

  const event = await prisma.event.create({
    data: {
      name: customName || template.name,
      status: "planning",
      audience: template.audience,
      date: date ? new Date(date) : null,
      venueId: venueId || null,
      nextSteps: template.defaultNotes,
    },
  });

  // Auto-create outreach campaign with pre-filled templates
  await prisma.outreachCampaign.create({
    data: {
      name: `${event.name} — Invite Campaign`,
      type: "invite",
      status: "draft",
      eventId: event.id,
      templates: {
        create: [
          {
            subject: template.emailSubject,
            body: template.emailBody,
            stepOrder: 1,
            delayDays: 0,
          },
          {
            subject: `Reminder: ${template.emailSubject}`,
            body: template.reminderBody,
            stepOrder: 2,
            delayDays: 3,
          },
          {
            subject: `Thank you — ${template.emailSubject}`,
            body: template.thankYouBody,
            stepOrder: 3,
            delayDays: 0,
          },
        ],
      },
    },
  });

  revalidatePath("/events");
  revalidatePath("/outreach");
  return event;
}

// ─── Advance event status with auto-actions ─────────────
export async function advanceEventStatus(eventId: string, newStatus: string) {
  const event = await prisma.event.update({
    where: { id: eventId },
    data: { status: newStatus },
    include: { venue: true, guests: { include: { contact: true } } },
  });

  // Auto-actions based on new status
  if (newStatus === "inviting") {
    // Activate any draft campaigns for this event
    await prisma.outreachCampaign.updateMany({
      where: { eventId, status: "draft" },
      data: { status: "active" },
    });

    // Queue invite emails for all assigned guests who haven't been invited yet
    const campaign = await prisma.outreachCampaign.findFirst({
      where: { eventId, type: "invite", status: "active" },
      include: { templates: { where: { stepOrder: 1 }, take: 1 } },
    });

    if (campaign && campaign.templates[0]) {
      const template = campaign.templates[0];
      const uninvitedGuests = event.guests.filter((g) => g.rsvpStatus === "pending");

      for (const guest of uninvitedGuests) {
        const vars = {
          firstName: guest.contact.firstName,
          eventName: event.name,
          venue: event.venue?.name || "TBD",
          date: event.date?.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" }) || "TBD",
          lumaUrl: event.lumaUrl || "",
        };

        await prisma.outreachMessage.create({
          data: {
            subject: fillTemplate(template.subject, vars),
            body: fillTemplate(template.body, vars),
            channel: "email",
            status: "pending",
            campaignId: campaign.id,
            contactId: guest.contact.id,
          },
        });

        // Mark guest as invited
        await prisma.eventGuest.update({
          where: { id: guest.id },
          data: { rsvpStatus: "invited" },
        });
      }
    }
  }

  if (newStatus === "complete") {
    // Auto-create thank-you campaign
    const existingThankYou = await prisma.outreachCampaign.findFirst({
      where: { eventId, type: "post_event" },
    });

    if (!existingThankYou) {
      // Find the invite campaign's thank-you template
      const inviteCampaign = await prisma.outreachCampaign.findFirst({
        where: { eventId, type: "invite" },
        include: { templates: { where: { stepOrder: 3 }, take: 1 } },
      });

      const thankYouCampaign = await prisma.outreachCampaign.create({
        data: {
          name: `${event.name} — Thank You`,
          type: "post_event",
          status: "active",
          eventId,
        },
      });

      // Queue thank-you emails for everyone who attended
      const attendees = event.guests.filter((g) => g.rsvpStatus === "confirmed" || g.attended);
      const templateBody = inviteCampaign?.templates[0]?.body || `Hi {{firstName}},\n\nThanks for joining us at ${event.name}!`;
      const templateSubject = inviteCampaign?.templates[0]?.subject || `Thanks for coming to ${event.name}`;

      for (const guest of attendees) {
        const vars = {
          firstName: guest.contact.firstName,
          eventName: event.name,
          photosUrl: event.photosUrl || "",
        };

        await prisma.outreachMessage.create({
          data: {
            subject: fillTemplate(templateSubject, vars),
            body: fillTemplate(templateBody, vars),
            channel: "email",
            status: "pending",
            campaignId: thankYouCampaign.id,
            contactId: guest.contact.id,
          },
        });
      }
    }
  }

  revalidatePath("/events");
  revalidatePath(`/events/${eventId}`);
  revalidatePath("/outreach");
  return event;
}

// ─── Bulk assign contacts to event ─────────────────────
export async function bulkAssignGuests(eventId: string, contactIds: string[]) {
  const results = [];
  for (const contactId of contactIds) {
    const existing = await prisma.eventGuest.findUnique({
      where: { eventId_contactId: { eventId, contactId } },
    });
    if (!existing) {
      const guest = await prisma.eventGuest.create({
        data: { eventId, contactId, rsvpStatus: "pending" },
      });
      results.push(guest);
    }
  }

  revalidatePath(`/events/${eventId}`);
  return results;
}

// ─── Import contacts from CSV data ─────────────────────
export async function importContacts(rows: Array<Record<string, string>>) {
  const results = { created: 0, skipped: 0, errors: 0 };

  for (const row of rows) {
    const email = row.email?.trim().toLowerCase();
    if (!row.firstName && !row.first_name && !row.name) {
      results.errors++;
      continue;
    }

    // Handle various CSV column naming conventions
    const firstName = row.firstName || row.first_name || row.name?.split(" ")[0] || "";
    const lastName = row.lastName || row.last_name || row.name?.split(" ").slice(1).join(" ") || "";

    if (email) {
      const existing = await prisma.contact.findUnique({ where: { email } });
      if (existing) {
        results.skipped++;
        continue;
      }
    }

    await prisma.contact.create({
      data: {
        firstName,
        lastName: lastName || null,
        email: email || null,
        company: row.company || row.organization || null,
        role: row.role || row.title || row.job_title || null,
        linkedinUrl: row.linkedinUrl || row.linkedin || row.linkedin_url || null,
        source: row.source || "csv_import",
        tags: row.tags || null,
        notes: row.notes || null,
      },
    });
    results.created++;
  }

  revalidatePath("/contacts");
  return results;
}

// ─── Send pending outreach messages via Gmail ───────────
export async function sendPendingMessages(campaignId: string) {
  const messages = await prisma.outreachMessage.findMany({
    where: { campaignId, status: "pending" },
    include: { contact: true },
  });

  // Return messages ready for Gmail sending
  // The actual Gmail send happens client-side via MCP
  return messages.map((m) => ({
    id: m.id,
    to: m.contact.email,
    toName: `${m.contact.firstName} ${m.contact.lastName || ""}`.trim(),
    subject: m.subject || "",
    body: m.body || "",
  }));
}

// ─── Mark message as sent ──────────────────────────────
export async function markMessageSent(messageId: string) {
  await prisma.outreachMessage.update({
    where: { id: messageId },
    data: { status: "sent", sentAt: new Date() },
  });
  revalidatePath("/outreach");
}

// ─── Update RSVP status ───────────────────────────────
export async function updateRsvp(eventGuestId: string, rsvpStatus: string) {
  await prisma.eventGuest.update({
    where: { id: eventGuestId },
    data: { rsvpStatus },
  });
  revalidatePath("/events");
}

// ─── Check in guest ───────────────────────────────────
export async function checkInGuest(eventGuestId: string) {
  await prisma.eventGuest.update({
    where: { id: eventGuestId },
    data: { attended: true, checkedInAt: new Date(), rsvpStatus: "confirmed" },
  });
  revalidatePath("/events");
}

// ─── Approve inbox item → create event or job ──────────
export async function approveInboxItem(inboxItemId: string) {
  const item = await prisma.inboxItem.findUnique({ where: { id: inboxItemId } });
  if (!item || !item.parsedData) return { error: "Cannot approve — no parsed data" };

  const parsed = JSON.parse(item.parsedData);

  if (item.intent === "event") {
    // Find or create venue if name was extracted
    let venueId: string | null = null;
    if (parsed.venue) {
      const existingVenue = await prisma.venue.findFirst({
        where: { name: { equals: parsed.venue } },
      });
      if (existingVenue) {
        venueId = existingVenue.id;
      } else {
        const newVenue = await prisma.venue.create({ data: { name: parsed.venue } });
        venueId = newVenue.id;
      }
    }

    const event = await prisma.event.create({
      data: {
        name: parsed.name,
        status: "not_started",
        audience: "all_members",
        date: parsed.date ? new Date(parsed.date) : null,
        venueId,
        nextSteps: `Imported from email: ${item.fromName || item.fromEmail}\n\n${parsed.description || ""}`,
      },
    });

    await prisma.inboxItem.update({
      where: { id: inboxItemId },
      data: { status: "approved", processedAt: new Date(), createdEventId: event.id },
    });

    // Also create contact for sender if not exists
    if (parsed.sourceContact?.email) {
      const existing = await prisma.contact.findUnique({
        where: { email: parsed.sourceContact.email },
      });
      if (!existing) {
        const [firstName, ...rest] = (parsed.sourceContact.name || item.fromEmail).split(" ");
        await prisma.contact.create({
          data: {
            firstName: firstName || "Unknown",
            lastName: rest.join(" ") || null,
            email: parsed.sourceContact.email,
            source: "email_intake",
          },
        });
      }
    }

    revalidatePath("/inbox");
    revalidatePath("/events");
    return { success: true, eventId: event.id };
  }

  if (item.intent === "job") {
    const job = await prisma.job.create({
      data: {
        title: parsed.title,
        company: parsed.company || null,
        description: parsed.description || null,
        location: parsed.location || null,
        salary: parsed.salary || null,
        applyUrl: parsed.applyUrl || null,
        contactName: parsed.sourceContact?.name || item.fromName,
        contactEmail: parsed.sourceContact?.email || item.fromEmail,
        source: "email",
        status: "open",
      },
    });

    await prisma.inboxItem.update({
      where: { id: inboxItemId },
      data: { status: "approved", processedAt: new Date(), createdJobId: job.id },
    });

    revalidatePath("/inbox");
    revalidatePath("/jobs");
    return { success: true, jobId: job.id };
  }

  return { error: "Unknown intent" };
}

export async function rejectInboxItem(inboxItemId: string) {
  await prisma.inboxItem.update({
    where: { id: inboxItemId },
    data: { status: "rejected", processedAt: new Date() },
  });
  revalidatePath("/inbox");
}

// ─── Manually paste email for processing ──────────────
export async function ingestEmailManual(from: string, subject: string, body: string) {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/inbox/ingest`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ from, subject, body }),
    }
  );
  revalidatePath("/inbox");
  return await res.json();
}
