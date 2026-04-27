"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Doc } from "@/convex/_generated/dataModel";
import { DashboardHeader } from "./header";
import { SubForm, type SubFormValues } from "./_components/sub-form";
import {
  CATEGORY_LABELS,
  CYCLE_LABELS,
  formatRupees,
} from "@/lib/categories";
import { formatRelativeIst } from "@/lib/dates";

type SortKey = "next" | "amount_desc" | "amount_asc" | "vendor";

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "next", label: "Next renewal" },
  { value: "amount_desc", label: "Amount: high to low" },
  { value: "amount_asc", label: "Amount: low to high" },
  { value: "vendor", label: "Vendor: A–Z" },
];

export default function DashboardPage() {
  const subs = useQuery(api.subscriptions.listMine, {});
  const pendingInbox = useQuery(api.pendingParses.listMine, {});
  const [sortKey, setSortKey] = useState<SortKey>("next");

  const sortedSubs = useMemo(() => {
    if (!subs) return undefined;
    const arr = [...subs];
    switch (sortKey) {
      case "next":
        arr.sort((a, b) => a.nextRenewal - b.nextRenewal);
        break;
      case "amount_desc":
        arr.sort((a, b) => b.amountInr - a.amountInr);
        break;
      case "amount_asc":
        arr.sort((a, b) => a.amountInr - b.amountInr);
        break;
      case "vendor":
        arr.sort((a, b) => a.vendor.localeCompare(b.vendor));
        break;
    }
    return arr;
  }, [subs, sortKey]);

  return (
    <main className="min-h-dvh px-6 sm:px-10 md:px-16 pt-8 pb-12">
      <div className="mx-auto w-full max-w-[720px]">
        <DashboardHeader />

        <section className="mt-10">
          {pendingInbox && pendingInbox.length > 0 && (
            <div className="mb-6 border border-hairline-strong bg-paper-deep/60 rounded-sm px-5 py-4 flex items-center justify-between">
              <p className="font-sans text-[14px] text-ink">
                {pendingInbox.length} parse
                {pendingInbox.length === 1 ? "" : "s"} waiting — you&rsquo;re at
                the 7-item cap.
              </p>
              <Link
                href={`/dashboard/replace/${pendingInbox[0]._id}`}
                className="font-sans text-[14px] text-accent hover:text-accent-hover"
              >
                Resolve →
              </Link>
            </div>
          )}

          <div className="flex items-baseline justify-between mb-6">
            <h1 className="font-display text-[32px] sm:text-[40px] tracking-[-0.01em] text-ink">
              Your subscriptions
            </h1>
            <span className="font-sans text-[13px] text-ink-soft">
              {subs ? `${subs.length} of 7` : "—"}
            </span>
          </div>

          <div className="flex flex-wrap gap-2 mb-8">
            <CTA href="/dashboard/add/upload">Upload receipt</CTA>
            <CTA href="/dashboard/add/paste">Paste text</CTA>
            <CTA href="/dashboard/add/manual" variant="ghost">
              Add manually
            </CTA>
          </div>

          {sortedSubs === undefined ? (
            <p className="font-sans text-[14px] text-ink-soft">Loading…</p>
          ) : sortedSubs.length === 0 ? (
            <EmptyState />
          ) : (
            <>
              <div className="flex items-center justify-end gap-2 mb-3">
                <label
                  htmlFor="sort"
                  className="font-sans text-[12px] uppercase tracking-[0.14em] text-ink-soft"
                >
                  Sort
                </label>
                <select
                  id="sort"
                  value={sortKey}
                  onChange={(e) => setSortKey(e.target.value as SortKey)}
                  className="font-sans text-[13px] text-ink bg-paper-deep border border-hairline-strong rounded-sm px-2 py-1 focus:outline-none focus:border-accent"
                >
                  {SORT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <ul className="flex flex-col gap-3">
                {sortedSubs.map((sub) => (
                  <SubRow key={sub._id} sub={sub} />
                ))}
              </ul>
            </>
          )}
        </section>
      </div>
    </main>
  );
}

function EmptyState() {
  return (
    <div className="border border-hairline-strong bg-paper-deep/40 rounded-sm px-6 py-10 text-center">
      <p className="font-display text-[22px] text-ink mb-2">
        Nothing tracked yet.
      </p>
      <p className="font-sans text-[15px] text-ink-soft">
        Upload, paste, or add a subscription manually to get started.
      </p>
    </div>
  );
}

function CTA({
  href,
  children,
  variant = "solid",
}: {
  href: string;
  children: React.ReactNode;
  variant?: "solid" | "ghost";
}) {
  const className =
    variant === "solid"
      ? "bg-accent hover:bg-accent-hover text-paper font-sans font-medium text-[14px] px-4 py-2.5 rounded-sm transition-colors"
      : "border border-hairline-strong text-ink hover:border-accent hover:text-accent font-sans text-[14px] px-4 py-2.5 rounded-sm transition-colors";
  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}

function SubRow({ sub }: { sub: Doc<"subscriptions"> }) {
  const [mode, setMode] = useState<
    "compact" | "expanded" | "editing" | "confirmingDelete"
  >("compact");
  const update = useMutation(api.subscriptions.update);
  const remove = useMutation(api.subscriptions.remove);

  const isExpanded = mode === "expanded" || mode === "confirmingDelete";

  // Only fetch the signed receipt URL when the row is open.
  const receiptUrl = useQuery(
    api.subscriptions.getReceiptUrl,
    isExpanded && sub.fileId ? { subscriptionId: sub._id } : "skip",
  );

  if (mode === "editing") {
    const initial: SubFormValues = {
      vendor: sub.vendor,
      amountInr: sub.amountInr,
      cycle: sub.cycle,
      nextRenewal: sub.nextRenewal,
      category: sub.category,
      isSubscription: true,
      confidence: sub.confidence,
    };
    return (
      <li>
        <SubForm
          initial={initial}
          submitLabel="Save"
          onCancel={() => setMode("expanded")}
          onSubmit={async (values) => {
            await update({
              subscriptionId: sub._id,
              patch: {
                vendor: values.vendor,
                amountInr: values.amountInr,
                cycle: values.cycle,
                nextRenewal: values.nextRenewal,
                category: values.category,
              },
            });
            setMode("compact");
          }}
        />
      </li>
    );
  }

  function toggle() {
    setMode(isExpanded ? "compact" : "expanded");
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      toggle();
    }
  }

  return (
    <li className="border border-hairline-strong bg-paper-deep/40 rounded-sm overflow-hidden">
      <div
        role="button"
        tabIndex={0}
        onClick={toggle}
        onKeyDown={handleKeyDown}
        aria-expanded={isExpanded}
        className="px-5 py-4 flex items-center justify-between gap-4 cursor-pointer hover:bg-paper-deep/60 transition-colors"
      >
        <div className="min-w-0 flex-1">
          <p className="font-display text-[20px] text-ink truncate">
            {sub.vendor}
          </p>
          <p className="font-sans text-[14px] text-ink-soft mt-1">
            {formatRupees(sub.amountInr)} · {CYCLE_LABELS[sub.cycle]} ·{" "}
            {formatRelativeIst(sub.nextRenewal)}
          </p>
        </div>
        <ChevronDown
          className={`shrink-0 text-ink-soft transition-transform duration-200 ${
            isExpanded ? "rotate-180" : ""
          }`}
        />
      </div>

      {isExpanded && (
        <div className="px-5 pb-4 pt-3 border-t border-hairline flex flex-wrap items-center gap-x-4 gap-y-3">
          <span className="font-sans text-[12px] uppercase tracking-[0.14em] text-ink-soft">
            {CATEGORY_LABELS[sub.category]}
          </span>
          <div className="flex-1 min-w-0" />
          {receiptUrl && (
            <a
              href={receiptUrl}
              target="_blank"
              rel="noreferrer"
              className="font-sans text-[13px] text-ink-soft hover:text-accent transition-colors"
            >
              Receipt
            </a>
          )}
          <button
            type="button"
            onClick={() => setMode("editing")}
            className="font-sans text-[13px] text-ink-soft hover:text-accent transition-colors"
          >
            Edit
          </button>
          {mode === "confirmingDelete" ? (
            <>
              <button
                type="button"
                onClick={async () => {
                  await remove({ subscriptionId: sub._id });
                }}
                className="font-sans text-[13px] text-accent hover:text-accent-hover transition-colors"
              >
                Confirm delete
              </button>
              <button
                type="button"
                onClick={() => setMode("expanded")}
                className="font-sans text-[13px] text-ink-soft hover:text-accent transition-colors"
              >
                Cancel
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setMode("confirmingDelete")}
              className="font-sans text-[13px] text-ink-soft hover:text-accent transition-colors"
            >
              Delete
            </button>
          )}
        </div>
      )}
    </li>
  );
}

function ChevronDown({ className }: { className?: string }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      className={className}
      aria-hidden
    >
      <path
        d="M 3.5 5.5 L 7 9 L 10.5 5.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
