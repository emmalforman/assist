import { prisma } from "@/lib/db";
import { getAdminEmails } from "@/lib/admin";
import { InboxActions } from "./inbox-actions";
import { PasteEmailForm } from "./paste-form";

const intentColors: Record<string, string> = {
  event: "bg-accent/10 text-accent",
  job: "bg-violet-100 text-violet-700",
  unknown: "bg-zinc-100 text-zinc-600",
};

const statusColors: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  approved: "bg-emerald-100 text-emerald-800",
  rejected: "bg-zinc-100 text-zinc-500",
};

export default async function InboxPage() {
  const items = await prisma.inboxItem.findMany({
    orderBy: { receivedAt: "desc" },
    take: 50,
  });

  const pending = items.filter((i) => i.status === "pending");
  const adminEmails = getAdminEmails();

  return (
    <>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-zinc-900">Inbox</h1>
        <p className="text-sm text-muted mt-1">
          Email <span className="font-mono text-accent">emma@mycacollective.com</span> with &ldquo;event&rdquo; or &ldquo;job&rdquo;
          in the subject line — it&apos;ll show up here for one-click approval.
        </p>
        <p className="text-xs text-muted mt-2">
          Auto-approved senders:{" "}
          {adminEmails.map((e, i) => (
            <span key={e}>
              <span className="font-mono text-accent">{e}</span>
              {i < adminEmails.length - 1 && ", "}
            </span>
          ))}
        </p>
      </div>

      {/* Setup instructions */}
      <details className="mb-8 bg-card-bg border border-border rounded-xl">
        <summary className="px-5 py-3 cursor-pointer text-sm font-semibold text-zinc-900">
          How to wire up email forwarding
        </summary>
        <div className="px-5 py-3 border-t border-border text-sm text-zinc-600 space-y-3">
          <p>Point your email provider&apos;s inbound webhook at:</p>
          <pre className="bg-zinc-50 rounded-lg p-3 text-xs font-mono">POST https://your-deployed-url.com/api/inbox/ingest</pre>
          <p>Expected JSON payload:</p>
          <pre className="bg-zinc-50 rounded-lg p-3 text-xs font-mono whitespace-pre-wrap">{`{
  "messageId": "optional-for-dedup",
  "from": "Sender Name <sender@example.com>",
  "subject": "Event: Summer Member Meetup",
  "body": "Full email text..."
}`}</pre>
          <p className="text-xs">
            <strong>Services that do this:</strong> SendGrid Inbound Parse, Mailgun Routes,
            Cloudflare Email Workers, Postmark Inbound. Set up a Gmail filter on{" "}
            <span className="font-mono">emma@mycacollective.com</span> to forward matching
            emails to your inbound address.
          </p>
        </div>
      </details>

      {/* Manual paste form */}
      <div className="mb-8">
        <PasteEmailForm />
      </div>

      {/* Inbox items */}
      <div className="mb-4 flex items-center gap-3">
        <h2 className="text-sm font-semibold text-zinc-900">Items ({items.length})</h2>
        {pending.length > 0 && (
          <span className="text-xs bg-amber-100 text-amber-800 font-medium px-2 py-0.5 rounded-full">
            {pending.length} pending review
          </span>
        )}
      </div>

      {items.length === 0 ? (
        <div className="bg-card-bg border border-border rounded-xl p-12 text-center">
          <p className="text-sm text-muted">No inbox items yet.</p>
          <p className="text-xs text-muted mt-1">
            Forward an email or paste one below to see the intake flow.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => {
            const parsed = item.parsedData ? JSON.parse(item.parsedData) : null;
            const isAdminSubmission = adminEmails.includes(item.fromEmail.toLowerCase());
            return (
              <div key={item.id} className="bg-card-bg border border-border rounded-xl p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${intentColors[item.intent]}`}>
                        {item.intent}
                      </span>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusColors[item.status]}`}>
                        {item.status}
                      </span>
                      {isAdminSubmission && item.status === "approved" && (
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-violet-100 text-violet-700">
                          auto-approved (admin)
                        </span>
                      )}
                      <span className="text-xs text-muted">
                        {item.receivedAt.toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-zinc-900">{item.subject}</p>
                    <p className="text-xs text-muted mt-0.5">
                      From: {item.fromName ? `${item.fromName} <${item.fromEmail}>` : item.fromEmail}
                    </p>
                  </div>
                  {item.status === "pending" && <InboxActions itemId={item.id} />}
                </div>

                {/* Parsed preview */}
                {parsed && item.intent === "event" && (
                  <div className="bg-accent/5 border border-accent/20 rounded-lg p-3 mb-3 text-xs space-y-1">
                    <p className="font-semibold text-accent mb-1">Will create event:</p>
                    <p><span className="text-muted">Name:</span> <span className="font-medium text-zinc-900">{parsed.name}</span></p>
                    {parsed.date && <p><span className="text-muted">Date:</span> <span className="font-medium">{parsed.date}</span></p>}
                    {parsed.venue && <p><span className="text-muted">Venue:</span> <span className="font-medium">{parsed.venue}</span></p>}
                  </div>
                )}

                {parsed && item.intent === "job" && (
                  <div className="bg-violet-50 border border-violet-200 rounded-lg p-3 mb-3 text-xs space-y-1">
                    <p className="font-semibold text-violet-700 mb-1">Will create job:</p>
                    <p><span className="text-muted">Title:</span> <span className="font-medium text-zinc-900">{parsed.title}</span></p>
                    {parsed.company && <p><span className="text-muted">Company:</span> <span className="font-medium">{parsed.company}</span></p>}
                    {parsed.location && <p><span className="text-muted">Location:</span> <span className="font-medium">{parsed.location}</span></p>}
                    {parsed.salary && <p><span className="text-muted">Salary:</span> <span className="font-medium">{parsed.salary}</span></p>}
                    {parsed.applyUrl && (
                      <p><span className="text-muted">Apply:</span> <a href={parsed.applyUrl} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">{parsed.applyUrl}</a></p>
                    )}
                  </div>
                )}

                {/* Raw body preview */}
                <details className="text-xs">
                  <summary className="text-muted cursor-pointer hover:text-zinc-700">View original email</summary>
                  <pre className="mt-2 bg-zinc-50 rounded-lg p-3 whitespace-pre-wrap font-sans text-zinc-600">{item.body}</pre>
                </details>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
