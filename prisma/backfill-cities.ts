// One-off backfill script to add cities to existing events.
// Safe to run multiple times — uses upsert-like logic.

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // 1. Backfill city on all events without one — default to San Francisco,
  //    unless the event's venue specifies another city.
  const eventsWithoutCity = await prisma.event.findMany({
    where: { city: null },
    include: { venue: true },
  });

  for (const event of eventsWithoutCity) {
    const city = event.venue?.city || "San Francisco";
    await prisma.event.update({ where: { id: event.id }, data: { city } });
  }

  console.log(`Backfilled city on ${eventsWithoutCity.length} events`);

  // 2. Insert the cross-city events from the spreadsheet that weren't seeded
  //    initially. Use findFirst to avoid duplicates.
  const crossCityEvents = [
    {
      name: "LA Farmers Market",
      status: "not_started",
      audience: "all_members",
      city: "Los Angeles",
      date: new Date("2026-03-22"),
    },
    {
      name: "NYC Robotics Dinner",
      status: "not_started",
      audience: "invite_only",
      city: "New York",
    },
    {
      name: "Robotics in Boston",
      status: "not_started",
      audience: "invite_only",
      city: "Boston",
    },
  ];

  let inserted = 0;
  for (const event of crossCityEvents) {
    const existing = await prisma.event.findFirst({ where: { name: event.name } });
    if (!existing) {
      await prisma.event.create({ data: event });
      inserted++;
    }
  }

  console.log(`Inserted ${inserted} new cross-city events`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
