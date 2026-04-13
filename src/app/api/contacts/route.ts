import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const body = await request.json();

  const contact = await prisma.contact.create({
    data: {
      firstName: body.firstName,
      lastName: body.lastName || null,
      email: body.email || null,
      company: body.company || null,
      role: body.role || null,
      linkedinUrl: body.linkedinUrl || null,
      source: body.source || "manual",
      tags: body.tags || null,
      notes: body.notes || null,
    },
  });

  return NextResponse.json(contact, { status: 201 });
}
