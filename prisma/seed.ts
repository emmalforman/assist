import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // ─── VENUES ──────────────────────────────────────────
  const buddyBuddy = await prisma.venue.create({
    data: { name: "BUDDY BUDDY", city: "San Francisco" },
  });
  const maxwell = await prisma.venue.create({
    data: { name: "Maxwell", city: "San Francisco" },
  });
  const softBar = await prisma.venue.create({
    data: { name: "Soft Bar", city: "San Francisco" },
  });
  const biondivino = await prisma.venue.create({
    data: { name: "Biondivino", city: "San Francisco" },
  });
  const acme = await prisma.venue.create({
    data: { name: "Acme Smoked Fish", city: "San Francisco" },
  });
  const moonrise = await prisma.venue.create({
    data: { name: "Moonrise Bagel", city: "San Francisco" },
  });
  const sixteenMills = await prisma.venue.create({
    data: { name: "Sixteen Mills", city: "San Francisco" },
  });
  const santoTaco = await prisma.venue.create({
    data: { name: "Santo Taco", city: "San Francisco" },
  });
  const bookClub = await prisma.venue.create({
    data: { name: "Book Club", city: "San Francisco" },
  });

  // ─── SPONSORS ────────────────────────────────────────
  const blackbird = await prisma.sponsor.create({
    data: { name: "Blackbird/Boop", tier: "partner" },
  });
  const verve = await prisma.sponsor.create({
    data: { name: "Verve", tier: "gold" },
  });
  const jpm = await prisma.sponsor.create({
    data: { name: "JPMorgan", tier: "gold" },
  });
  const doordash = await prisma.sponsor.create({
    data: { name: "DoorDash", tier: "gold" },
  });
  const braze = await prisma.sponsor.create({
    data: { name: "Braze", tier: "silver" },
  });
  const dion = await prisma.sponsor.create({
    data: { name: "Dion", tier: "partner" },
  });
  const svb = await prisma.sponsor.create({
    data: { name: "SVB", tier: "silver" },
  });
  const resy = await prisma.sponsor.create({
    data: { name: "Resy", tier: "partner" },
  });

  // ─── EVENTS (from actual spreadsheet) ────────────────
  const events = [
    {
      name: "Member Meetup",
      status: "complete",
      audience: "all_members",
      city: "San Francisco",
      date: new Date("2026-01-22"),
      venueId: buddyBuddy.id,
      lumaUrl: "https://luma.com/ylj061le",
    },
    {
      name: "Women in Hospitality",
      status: "complete",
      audience: "invite_only",
      city: "San Francisco",
      date: new Date("2026-02-02"),
      venueId: maxwell.id,
      lumaUrl: "https://luma.com/0m1zb59d",
      photosUrl: "https://sravyabalasaphotography.pixieset.com/myca/",
    },
    {
      name: "Protein Brunch",
      status: "complete",
      audience: "all_members",
      city: "San Francisco",
      date: new Date("2026-02-21"),
      venueId: maxwell.id,
      lumaUrl: "https://luma.com/9p80w5j7",
    },
    {
      name: "Member Meetup",
      status: "complete",
      audience: "all_members",
      city: "San Francisco",
      date: new Date("2026-03-11"),
      venueId: softBar.id,
      lumaUrl: "https://luma.com/event/manage/evt-n5bJm46hJsDIeUP/overview",
    },
    {
      name: "Women in Robotics",
      status: "complete",
      audience: "invite_only",
      city: "San Francisco",
      date: new Date("2026-03-16"),
      venueId: biondivino.id,
      lumaUrl: "https://luma.com/hhoo2jza",
      photosUrl: "https://oksanashvets.art/disk/2026-03-16-myca-dt1cxm",
      nextSteps: "Women in Physical AI Community",
    },
    {
      name: "China Wine",
      status: "complete",
      audience: "all_members",
      city: "San Francisco",
      date: new Date("2026-03-26"),
    },
    {
      name: "Sargun Verve Dinner",
      status: "complete",
      audience: "external",
      city: "San Francisco",
      photosUrl: "https://leandracreativellc.pic-time.com/-vervedinneratfrankshouse/gallery",
    },
    {
      name: "AgTech Pitch Night",
      status: "complete",
      audience: "external",
      city: "San Francisco",
      photosUrl: "https://sravyabalasaphotography.pixieset.com/agpitchcompetition/",
    },
    {
      name: "Deux Chats x Myca",
      status: "inviting",
      audience: "all_members",
      city: "San Francisco",
      date: new Date("2026-04-26"),
    },
    {
      name: "AI Event",
      status: "inviting",
      audience: "all_members",
      city: "San Francisco",
      date: new Date("2026-04-16"),
      lumaUrl: "https://luma.com/event/manage/evt-kfF3n6h5XwbjBUE",
    },
    {
      name: "Member Meetup",
      status: "not_started",
      audience: "all_members",
      city: "San Francisco",
      date: new Date("2026-05-01"),
      venueId: moonrise.id,
    },
    {
      name: "Consumer Investors Dinner",
      status: "planning",
      audience: "invite_only",
      city: "San Francisco",
      date: new Date("2026-05-18"),
    },
    {
      name: "Community Builders",
      status: "planning",
      audience: "all_members",
      city: "San Francisco",
      date: new Date("2026-05-15"),
    },
    {
      name: "Retailers x Myca",
      status: "not_started",
      audience: "invite_only",
      city: "San Francisco",
      date: new Date("2026-04-16"),
    },
    {
      name: "Myca 1st Birthday",
      status: "not_started",
      audience: "all_members",
      city: "San Francisco",
      date: new Date("2026-05-24"),
    },
    {
      name: "LA Farmers Market",
      status: "not_started",
      audience: "all_members",
      city: "Los Angeles",
      date: new Date("2026-03-22"),
    },
    {
      name: "Tech Week Event",
      status: "not_started",
      audience: "all_members",
      city: "New York",
      date: new Date("2026-06-02"),
    },
    {
      name: "Fancy Food Show",
      status: "not_started",
      audience: "all_members",
      city: "New York",
      date: new Date("2026-08-07"),
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
    {
      name: "Member Meetup: Book Club",
      status: "not_started",
      audience: "all_members",
      city: "San Francisco",
      date: new Date("2026-04-14"),
      venueId: bookClub.id,
      lumaUrl: "https://luma.com/m1ewugjv",
    },
  ];

  for (const event of events) {
    await prisma.event.create({ data: event });
  }

  // ─── EVENT-SPONSOR LINKS ────────────────────────────
  const womenHosp = await prisma.event.findFirst({ where: { name: "Women in Hospitality" } });
  const womenRobo = await prisma.event.findFirst({ where: { name: "Women in Robotics" } });
  const investorDinner = await prisma.event.findFirst({ where: { name: "Consumer Investors Dinner" } });
  const communityBuilders = await prisma.event.findFirst({ where: { name: "Community Builders" } });
  const retailers = await prisma.event.findFirst({ where: { name: "Retailers x Myca" } });
  const birthday = await prisma.event.findFirst({ where: { name: "Myca 1st Birthday" } });
  const techWeek = await prisma.event.findFirst({ where: { name: "Tech Week Event" } });

  const sponsorLinks = [
    { eventId: womenHosp!.id, sponsorId: blackbird.id, status: "delivered" },
    { eventId: womenRobo!.id, sponsorId: verve.id, status: "delivered" },
    { eventId: investorDinner!.id, sponsorId: jpm.id, status: "confirmed" },
    { eventId: communityBuilders!.id, sponsorId: dion.id, status: "confirmed" },
    { eventId: retailers!.id, sponsorId: doordash.id, status: "pending" },
    { eventId: birthday!.id, sponsorId: resy.id, status: "pending" },
    { eventId: birthday!.id, sponsorId: doordash.id, status: "pending" },
    { eventId: birthday!.id, sponsorId: jpm.id, status: "pending" },
    { eventId: techWeek!.id, sponsorId: braze.id, status: "pending" },
  ];

  for (const link of sponsorLinks) {
    await prisma.eventSponsor.create({ data: link });
  }

  // ─── SAMPLE CONTACTS ────────────────────────────────
  const contacts = [
    { firstName: "Sarah", lastName: "Chen", email: "sarah.chen@example.com", company: "Verve Coffee", role: "Head of Partnerships", source: "linkedin", tags: "food-tech,coffee,sf", leadScore: 85 },
    { firstName: "Marcus", lastName: "Rivera", email: "marcus.r@example.com", company: "DoorDash", role: "Sr. Product Manager", source: "referral", tags: "delivery,tech,sf", leadScore: 78 },
    { firstName: "Anya", lastName: "Patel", email: "anya.p@example.com", company: "Resy", role: "VP of Business Dev", source: "gmail", tags: "hospitality,restaurants,nyc", leadScore: 92 },
    { firstName: "James", lastName: "Okafor", email: "james.o@example.com", company: "JPMorgan", role: "Venture Investor", source: "linkedin", tags: "investor,fintech,sf", leadScore: 88 },
    { firstName: "Lily", lastName: "Zhang", email: "lily.z@example.com", company: "Farm One", role: "CEO", source: "manual", tags: "agriculture,vertical-farming,nyc", leadScore: 75 },
    { firstName: "Diego", lastName: "Santos", email: "diego.s@example.com", company: "Braze", role: "Growth Lead", source: "linkedin", tags: "marketing,tech,sf", leadScore: 70 },
    { firstName: "Emma", lastName: "Larsson", email: "emma.l@example.com", company: "Pop Up Grocer", role: "Founder", source: "referral", tags: "cpg,retail,nyc", leadScore: 90 },
    { firstName: "Raj", lastName: "Mehta", email: "raj.m@example.com", company: "NEA", role: "Partner", source: "linkedin", tags: "investor,food-tech,sf", leadScore: 95 },
  ];

  for (const contact of contacts) {
    await prisma.contact.create({ data: contact });
  }

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
