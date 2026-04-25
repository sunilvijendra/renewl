"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { DashboardHeader } from "../../header";
import Link from "next/link";

export default function PastePage() {
  const router = useRouter();
  const submitPaste = useMutation(api.parseJobs.submitPaste);
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (pending) return;
    setError(null);

    startTransition(async () => {
      try {
        const jobId = await submitPaste({ pastedText: text });
        router.push(`/dashboard/review/${jobId}`);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not submit.");
      }
    });
  }

  return (
    <main className="min-h-dvh px-6 sm:px-10 md:px-16 pt-8 pb-12">
      <div className="mx-auto w-full max-w-[640px]">
        <DashboardHeader />

        <section className="mt-10">
          <Link
            href="/dashboard"
            className="font-sans text-[13px] text-ink-soft hover:text-accent"
          >
            ← Back
          </Link>

          <h1 className="mt-4 font-display text-[32px] sm:text-[40px] tracking-[-0.01em] text-ink">
            Paste receipt text
          </h1>
          <p className="mt-2 font-sans text-[15px] text-ink-soft">
            Paste the body of an email or any receipt text. We&rsquo;ll parse it
            and give you an editable card.
          </p>

          <form
            onSubmit={handleSubmit}
            className="mt-8 border border-hairline-strong bg-paper-deep/40 rounded-sm p-6 flex flex-col gap-5"
          >
            <textarea
              required
              minLength={20}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Paste the receipt text here…"
              rows={12}
              className="w-full px-3 py-2.5 text-[15px] text-ink bg-paper-deep border border-hairline-strong rounded-sm focus:outline-none focus:border-accent font-sans"
            />
            {error && (
              <p role="alert" className="font-sans text-[13px] text-ink-soft">
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={pending || text.trim().length < 20}
              className="self-start bg-accent hover:bg-accent-hover disabled:opacity-60 text-paper font-sans font-medium text-[15px] px-5 py-2.5 rounded-sm transition-colors"
            >
              {pending ? "Reading…" : "Parse this text"}
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
