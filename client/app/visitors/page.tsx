import React from "react";
import type { Metadata } from "next";
import { formatDate } from "@/lib/utils";
import { GuestbookForm } from "@/components/visitors/GuestbookForm";
import type { GuestbookEntry } from "@/types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Visitor's Book",
  description: "Leave a message.",
};

async function getEntries(): Promise<GuestbookEntry[]> {
  try {
    const { getApprovedEntries } = await import("@/lib/db/guestbook");
    return getApprovedEntries();
  } catch {
    return [];
  }
}

export default async function VisitorsPage() {
  const entries = await getEntries();

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <header className="mb-10">
        <h1 className="text-4xl font-bold mb-2">Visitor's Book</h1>
        <p className="text-muted-foreground">
          Leave a message — I read every one.
        </p>
      </header>

      <GuestbookForm />

      <section className="mt-12 space-y-4">
        {entries.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            No messages yet. Be the first!
          </p>
        ) : (
          entries.map((entry) => (
            <div
              key={entry.id}
              className="border-2 border-border shadow-brutal rounded-2xl p-5 bg-card"
            >
              <div className="flex items-baseline justify-between gap-4 mb-2">
                <span className="font-bold text-sm">{entry.name}</span>
                <span className="text-xs text-muted-foreground shrink-0">
                  {formatDate(entry.createdAt)}
                </span>
              </div>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">
                {entry.message}
              </p>
              {entry.reply && (
                <div className="mt-3 pl-3 border-l-2 border-border">
                  <p className="text-xs font-semibold mb-0.5">Peter replied</p>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap text-muted-foreground">
                    {entry.reply}
                  </p>
                </div>
              )}
            </div>
          ))
        )}
      </section>
    </div>
  );
}
