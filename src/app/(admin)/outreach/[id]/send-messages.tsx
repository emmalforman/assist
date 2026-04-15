"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { markMessageSent } from "@/lib/actions";

type Message = {
  id: string;
  to: string;
  toName: string;
  subject: string;
  body: string;
  status: string;
  sentAt: string | null;
};

export function SendMessages({
  campaignId,
  messages,
  statusColors,
}: {
  campaignId: string;
  messages: Message[];
  statusColors: Record<string, string>;
}) {
  const router = useRouter();
  const [sending, setSending] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const pending = messages.filter((m) => m.status === "pending");
  const sent = messages.filter((m) => m.status !== "pending");

  async function handleSendAll() {
    setSending(true);
    // Mark all pending as sent — in production this would trigger actual Gmail sends
    for (const msg of pending) {
      await markMessageSent(msg.id);
    }
    router.refresh();
    setSending(false);
  }

  async function handleSendOne(id: string) {
    await markMessageSent(id);
    router.refresh();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-zinc-900">Messages ({messages.length})</h2>
        {pending.length > 0 && (
          <button
            onClick={handleSendAll}
            disabled={sending}
            className="text-sm bg-accent text-white font-medium px-4 py-2 rounded-lg hover:bg-accent-light transition-colors disabled:opacity-50"
          >
            {sending ? "Sending..." : `Send All ${pending.length} Pending`}
          </button>
        )}
      </div>

      <div className="bg-card-bg border border-border rounded-xl divide-y divide-border">
        {messages.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-sm text-muted">No messages queued yet. Add guests to the event and move it to &ldquo;Inviting&rdquo; to auto-generate emails.</p>
          </div>
        ) : (
          messages.map((m) => (
            <div key={m.id} className="px-4 py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap ${statusColors[m.status] || "bg-zinc-100"}`}>
                    {m.status}
                  </span>
                  <div className="truncate">
                    <span className="text-sm font-medium text-zinc-900">{m.toName}</span>
                    <span className="text-xs text-muted ml-2">{m.to}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {m.sentAt && (
                    <span className="text-xs text-muted">
                      {new Date(m.sentAt).toLocaleDateString()}
                    </span>
                  )}
                  <button
                    onClick={() => setExpandedId(expandedId === m.id ? null : m.id)}
                    className="text-xs text-accent hover:underline"
                  >
                    {expandedId === m.id ? "Hide" : "Preview"}
                  </button>
                  {m.status === "pending" && (
                    <button
                      onClick={() => handleSendOne(m.id)}
                      className="text-xs bg-accent/10 text-accent font-medium px-2.5 py-1 rounded-lg hover:bg-accent/20"
                    >
                      Send
                    </button>
                  )}
                </div>
              </div>
              {expandedId === m.id && (
                <div className="mt-3 bg-zinc-50 rounded-lg p-3">
                  <p className="text-xs font-semibold text-zinc-700 mb-1">Subject: {m.subject}</p>
                  <pre className="text-xs text-zinc-600 whitespace-pre-wrap font-sans leading-relaxed">{m.body}</pre>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
