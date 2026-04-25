"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { DashboardHeader } from "../../header";
import {
  CATEGORY_LABELS,
  CYCLE_LABELS,
  formatRupees,
} from "@/lib/categories";
import { formatRelativeIst } from "@/lib/dates";
import Link from "next/link";

export default function ReplacePage({
  params,
}: {
  params: Promise<{ pendingId: string }>;
}) {
  const { pendingId } = use(params);
  const router = useRouter();
  const pending = useQuery(api.pendingParses.get, {
    pendingId: pendingId as Id<"pendingParses">,
  });
  const subs = useQuery(api.subscriptions.listMine, {});
  const replace = useMutation(api.pendingParses.replace);
  const discard = useMutation(api.pendingParses.discard);

  const [chosen, setChosen] = useState<Id<"subscriptions"> | null>(null);
  const [pending2, setPending2] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (pending === undefined || subs === undefined) {
    return <Wrapper><p className="text-ink-soft">Loading…</p></Wrapper>;
  }
  if (pending === null) {
    return <Wrapper><p className="text-ink-soft">Pending parse not found.</p></Wrapper>;
  }
  if (pending.status !== "awaiting_review") {
    return <Wrapper><p className="text-ink-soft">This parse has already been resolved.</p></Wrapper>;
  }

  return (
    <Wrapper>
      <h1 className="font-display text-[32px] sm:text-[40px] tracking-[-0.01em] text-ink">
        You&rsquo;re at the cap.
      </h1>
      <p className="mt-2 font-sans text-[15px] text-ink-soft max-w-[480px]">
        Pick which existing subscription to replace with the new parse, or
        discard the new one.
      </p>

      <div className="mt-8 grid sm:grid-cols-2 gap-6">
        <div>
          <p className="font-sans text-[12px] uppercase tracking-[0.14em] text-ink-soft mb-3">
            New parse
          </p>
          <div className="border border-hairline-strong bg-paper-deep/60 rounded-sm p-5">
            <p className="font-display text-[22px] text-ink">
              {pending.extracted.vendor}
            </p>
            <p className="font-sans text-[12px] uppercase tracking-[0.14em] text-ink-soft mt-1">
              {CATEGORY_LABELS[pending.extracted.category]}
            </p>
            <p className="font-sans text-[14px] text-ink-soft mt-3">
              {formatRupees(pending.extracted.amountInr)} ·{" "}
              {CYCLE_LABELS[pending.extracted.cycle]} · next{" "}
              {formatRelativeIst(pending.extracted.nextRenewal)}
            </p>
            {pending.fileUrl && (
              <a
                href={pending.fileUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-block mt-4 font-sans text-[13px] text-ink-soft hover:text-accent"
              >
                View receipt →
              </a>
            )}
          </div>
        </div>

        <div>
          <p className="font-sans text-[12px] uppercase tracking-[0.14em] text-ink-soft mb-3">
            Replace one of these
          </p>
          <ul className="flex flex-col gap-2">
            {subs.map((sub) => (
              <li key={sub._id}>
                <label className="flex items-start gap-3 border border-hairline-strong bg-paper-deep/40 hover:border-accent rounded-sm px-4 py-3 cursor-pointer">
                  <input
                    type="radio"
                    name="replace-target"
                    checked={chosen === sub._id}
                    onChange={() => setChosen(sub._id)}
                    className="mt-1 accent-accent"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="font-display text-[16px] text-ink truncate">
                      {sub.vendor}
                    </p>
                    <p className="font-sans text-[12px] text-ink-soft">
                      {formatRupees(sub.amountInr)} · {CYCLE_LABELS[sub.cycle]}{" "}
                      · next {formatRelativeIst(sub.nextRenewal)}
                    </p>
                  </div>
                </label>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {error && (
        <p role="alert" className="mt-4 font-sans text-[13px] text-ink-soft">
          {error}
        </p>
      )}

      <div className="mt-8 flex gap-3">
        <button
          type="button"
          disabled={!chosen || pending2}
          onClick={async () => {
            if (!chosen) return;
            setError(null);
            setPending2(true);
            try {
              await replace({
                pendingId: pending._id,
                replaceSubscriptionId: chosen,
              });
              router.push("/dashboard");
            } catch (err) {
              setError(err instanceof Error ? err.message : "Could not replace.");
              setPending2(false);
            }
          }}
          className="bg-accent hover:bg-accent-hover disabled:opacity-60 text-paper font-sans font-medium text-[15px] px-5 py-2.5 rounded-sm transition-colors"
        >
          {pending2 ? "Replacing…" : "Replace"}
        </button>
        <button
          type="button"
          disabled={pending2}
          onClick={async () => {
            setPending2(true);
            try {
              await discard({ pendingId: pending._id });
              router.push("/dashboard");
            } catch (err) {
              setError(err instanceof Error ? err.message : "Could not discard.");
              setPending2(false);
            }
          }}
          className="font-sans text-[14px] text-ink-soft hover:text-accent transition-colors"
        >
          Discard new parse
        </button>
      </div>
    </Wrapper>
  );
}

function Wrapper({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-dvh px-6 sm:px-10 md:px-16 pt-8 pb-12">
      <div className="mx-auto w-full max-w-[800px]">
        <DashboardHeader />
        <section className="mt-10">
          <Link
            href="/dashboard"
            className="font-sans text-[13px] text-ink-soft hover:text-accent"
          >
            ← Back
          </Link>
          <div className="mt-4">{children}</div>
        </section>
      </div>
    </main>
  );
}
