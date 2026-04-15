import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

// Public RSVP endpoint. Members post { eventId, firstName, lastName?, email,
// company?, status? } and we:
// 1. Find/create the Contact by email
// 2. Find/create the EventGuest with rsvpStatus=confirmed
// 3. Return the contact.id so the client can link to /my?email=...

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { eventId, firstName, lastName, email, company, status } = body;

    if (!eventId || !firstName || !email) {
      return NextResponse.json(
        { error: "Missing required fields: eventId, firstName, email" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Find or create the contact
    let contact = await prisma.contact.findUnique({ where: { email: normalizedEmail } });
    if (!contact) {
      contact = await prisma.contact.create({
        data: {
          firstName: firstName.trim(),
          lastName: lastName?.trim() || null,
          email: normalizedEmail,
          company: company?.trim() || null,
          source: "self_rsvp",
        },
      });
    } else {
      // Opportunistically fill in any fields we didn't already have
      const updates: Record<string, unknown> = {};
      if (!contact.firstName && firstName) updates.firstName = firstName.trim();
      if (!contact.lastName && lastName) updates.lastName = lastName.trim();
      if (!contact.company && company) updates.company = company.trim();
      if (Object.keys(updates).length) {
        contact = await prisma.contact.update({
          where: { id: contact.id },
          data: updates,
        });
      }
    }

    // Find or create the EventGuest
    const existing = await prisma.eventGuest.findUnique({
      where: { eventId_contactId: { eventId, contactId: contact.id } },
    });

    const validStatuses = ["saved", "confirmed", "declined"];
    const rsvpStatus = validStatuses.includes(status) ? status : "confirmed";

    if (existing) {
      await prisma.eventGuest.update({
        where: { id: existing.id },
        data: { rsvpStatus },
      });
    } else {
      await prisma.eventGuest.create({
        data: { eventId, contactId: contact.id, rsvpStatus },
      });
    }

    return NextResponse.json({
      success: true,
      contactId: contact.id,
      email: contact.email,
      rsvpStatus,
    });
  } catch (error) {
    console.error("RSVP error:", error);
    return NextResponse.json({ error: "Failed to save RSVP" }, { status: 500 });
  }
}
