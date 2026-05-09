import { PrismaClient } from "@prisma/client";
const p = new PrismaClient();

async function main() {
  // 1. Import La Rossi Pizza Party at Slik
  const existing1 = await p.event.findFirst({ where: { name: { contains: "La Rossi" } } });
  if (!existing1) {
    let venue = await p.venue.findFirst({ where: { name: "SLIK" } });
    if (!venue) venue = await p.venue.create({ data: { name: "SLIK", address: "437 E 12th St", city: "New York" } });
    await p.event.create({
      data: {
        name: "La Rossi Pizza Party at Slik",
        status: "not_started",
        audience: "all_members",
        city: "New York",
        date: new Date("2026-05-05T22:00:00.000Z"),
        venueId: venue.id,
        lumaUrl: "https://luma.com/gt3w661c?pk=g-haSICyFjiPlwGdj",
        nextSteps: "Synced from Google Calendar (Myca Collective)\n\nJoin us for pizza, candy, soft serve & drinks at Nordic candy bar Slik to celebrate spring.",
      },
    });
    console.log("Created: La Rossi Pizza Party at Slik");
  } else {
    console.log("Skipped: La Rossi already exists");
  }

  // 2. Import next 4 Farmers Market instances
  const fmDates = [
    new Date("2026-05-16T14:00:00.000Z"),
    new Date("2026-05-23T14:00:00.000Z"),
    new Date("2026-05-30T14:00:00.000Z"),
    new Date("2026-06-06T14:00:00.000Z"),
  ];
  let fmVenue = await p.venue.findFirst({ where: { name: { contains: "Fort Greene" } } });
  if (!fmVenue) fmVenue = await p.venue.create({ data: { name: "Fort Greene Park Greenmarket", address: "Washington Park & Dekalb Ave, Brooklyn, NY 11201", city: "New York" } });

  let fmCreated = 0;
  for (const date of fmDates) {
    const dateStr = date.toISOString().split("T")[0];
    const dayStart = new Date(dateStr + "T00:00:00.000Z");
    const dayEnd = new Date(dateStr + "T23:59:59.000Z");
    const exists = await p.event.findFirst({
      where: { name: "Farmers Market", date: { gte: dayStart, lt: dayEnd } },
    });
    if (!exists) {
      await p.event.create({
        data: {
          name: "Farmers Market",
          status: "not_started",
          audience: "all_members",
          city: "New York",
          date,
          venueId: fmVenue.id,
          nextSteps: "Synced from Google Calendar (Myca Collective)\n\nRecurring weekly at Fort Greene Park Greenmarket.",
        },
      });
      fmCreated++;
    }
  }
  console.log("Created " + fmCreated + " Farmers Market instances");
  console.log("Done.");
}

main().finally(() => p.$disconnect());
