import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const body = await request.json();

  const sponsor = await prisma.sponsor.create({
    data: {
      name: body.name,
      tier: body.tier || null,
      contactName: body.contactName || null,
      contactEmail: body.contactEmail || null,
      notes: body.notes || null,
    },
  });

  return NextResponse.json(sponsor, { status: 201 });
}
