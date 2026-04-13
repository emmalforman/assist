// Event templates based on Myca's recurring event types
// Pre-fills everything so you just pick a template and go

export type EventTemplate = {
  name: string;
  audience: string;
  defaultNotes: string;
  suggestedTags: string[];
  emailSubject: string;
  emailBody: string;
  reminderBody: string;
  thankYouBody: string;
};

export const EVENT_TEMPLATES: Record<string, EventTemplate> = {
  member_meetup: {
    name: "Member Meetup",
    audience: "all_members",
    defaultNotes: "Casual member gathering. Confirm venue, set up Luma page.",
    suggestedTags: ["members", "community", "networking"],
    emailSubject: "You're invited: Myca Member Meetup — {{date}}",
    emailBody: `Hi {{firstName}},

You're invited to our next Myca Member Meetup at {{venue}} on {{date}}.

It's a casual evening to connect with fellow food, bev, and hospitality people. No agenda — just good company and great food.

RSVP here: {{lumaUrl}}

See you there,
Myca Team`,
    reminderBody: `Hi {{firstName}},

Quick reminder — our Member Meetup is {{daysUntil}}! We'd love to see you there.

{{venue}} · {{date}}

RSVP: {{lumaUrl}}`,
    thankYouBody: `Hi {{firstName}},

Thanks for joining us at last night's Member Meetup! It was great seeing you.

Check out the photos: {{photosUrl}}

See you at the next one.`,
  },

  industry_dinner: {
    name: "Industry Dinner",
    audience: "invite_only",
    defaultNotes: "Curated dinner. Finalize guest list, confirm sponsor, coordinate menu.",
    suggestedTags: ["dinner", "curated", "industry"],
    emailSubject: "Exclusive invite: {{eventName}} with Myca",
    emailBody: `Hi {{firstName}},

We're hosting an intimate dinner bringing together leaders in {{industry}} on {{date}} at {{venue}}.

This is a curated gathering — we think you'd be a great addition to the table.

Space is limited to {{capacity}} guests.

RSVP here: {{lumaUrl}}

Warmly,
Myca Team`,
    reminderBody: `Hi {{firstName}},

Just a reminder — our {{eventName}} dinner is {{daysUntil}}. We have a fantastic group confirmed and would love for you to join.

{{venue}} · {{date}}

RSVP: {{lumaUrl}}`,
    thankYouBody: `Hi {{firstName}},

Thank you for being part of our {{eventName}} dinner. The conversation was incredible.

Photos: {{photosUrl}}

We'd love to stay connected — let us know if there's anyone in the community you'd like an intro to.`,
  },

  pitch_night: {
    name: "Pitch Night",
    audience: "external",
    defaultNotes: "Pitch competition. Confirm judges, sponsors, and presenting companies.",
    suggestedTags: ["pitch", "startups", "investors"],
    emailSubject: "{{eventName}} — Pitch Night by Myca",
    emailBody: `Hi {{firstName}},

Myca is hosting a pitch night featuring the most exciting companies in {{industry}}.

Join us on {{date}} at {{venue}} to watch founders pitch, connect with investors, and discover what's next.

RSVP: {{lumaUrl}}`,
    reminderBody: `Hi {{firstName}},

Our {{eventName}} pitch night is {{daysUntil}}! Don't miss it.

{{venue}} · {{date}}
RSVP: {{lumaUrl}}`,
    thankYouBody: `Hi {{firstName}},

Thanks for coming to {{eventName}}! What a night.

Photos: {{photosUrl}}

Want to connect with any of the founders who pitched? Reply and we'll make the intro.`,
  },

  popup: {
    name: "Pop-Up Event",
    audience: "all_members",
    defaultNotes: "Pop-up collaboration. Confirm partner, logistics, marketing assets.",
    suggestedTags: ["popup", "collaboration", "food"],
    emailSubject: "{{eventName}} — A Myca Pop-Up",
    emailBody: `Hi {{firstName}},

We're teaming up for a special pop-up experience on {{date}} at {{venue}}.

This is going to be something different — come hungry.

RSVP: {{lumaUrl}}`,
    reminderBody: `Hi {{firstName}},

Our pop-up is {{daysUntil}}! Spots are filling up.

{{venue}} · {{date}}
RSVP: {{lumaUrl}}`,
    thankYouBody: `Hi {{firstName}},

Thanks for coming to our pop-up! Hope you loved it as much as we did.

Photos: {{photosUrl}}`,
  },

  farmers_market: {
    name: "Farmers Market",
    audience: "all_members",
    defaultNotes: "Market event. Confirm location, vendor coordination, setup logistics.",
    suggestedTags: ["market", "outdoor", "local"],
    emailSubject: "Myca at the Farmers Market — {{date}}",
    emailBody: `Hi {{firstName}},

Join us at the farmers market on {{date}}! We'll be at {{venue}} connecting with local producers and the Myca community.

RSVP: {{lumaUrl}}`,
    reminderBody: `Hi {{firstName}},

See you at the market {{daysUntil}}!

{{venue}} · {{date}}`,
    thankYouBody: `Hi {{firstName}},

Great seeing you at the market! Photos: {{photosUrl}}`,
  },
};

export function fillTemplate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] || `{{${key}}}`);
}
