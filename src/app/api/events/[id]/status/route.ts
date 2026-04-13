import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { status } = await request.json();
  const validStatuses = ["not_started", "planning", "inviting", "complete", "did_not_do"];

  if (!validStatuses.includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const event = await prisma.event.update({
    where: { id },
    data: { status },
  });

  return NextResponse.json(event);
}
