"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export function EmailLookupForm({ defaultEmail }: { defaultEmail?: string } = {}) {
  const router = useRouter();
  const [email, setEmail] = useState(defaultEmail || "");

  // Remember previous email from localStorage
  useEffect(() => {
    if (!defaultEmail && typeof window !== "undefined") {
      const saved = localStorage.getItem("myca.email");
      if (saved) setEmail(saved);
    }
  }, [defaultEmail]);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!email.trim()) return;
    const normalized = email.trim().toLowerCase();
    if (typeof window !== "undefined") {
      localStorage.setItem("myca.email", normalized);
    }
    router.push(`/my?email=${encodeURIComponent(normalized)}`);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
        className="w-full border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
      />
      <button
        type="submit"
        className="bg-accent text-white text-sm font-semibold py-3 rounded-lg hover:bg-accent-light transition-colors"
      >
        Show my events
      </button>
    </form>
  );
}
