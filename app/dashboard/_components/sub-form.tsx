"use client";

import { useState } from "react";
import {
  CATEGORY_OPTIONS,
  CATEGORY_SLUGS,
  CYCLE_SLUGS,
  CategorySlug,
  CycleSlug,
  paiseToRupeesString,
  rupeesStringToPaise,
} from "@/lib/categories";
import {
  formatIstDateInputValue,
  toStartOfDayIstMs,
} from "@/lib/dates";

export type SubFormValues = {
  vendor: string;
  amountInr: number; // paise
  cycle: CycleSlug;
  nextRenewal: number; // ms, start-of-day IST
  category: CategorySlug;
  isSubscription: boolean;
  confidence?: number;
};

type Props = {
  initial: SubFormValues;
  submitLabel?: string;
  showLowConfidenceNote?: boolean;
  onSubmit: (values: SubFormValues) => Promise<void> | void;
  onCancel?: () => void;
  cancelLabel?: string;
  destructiveAction?: { label: string; onClick: () => void };
};

export function SubForm({
  initial,
  submitLabel = "Save",
  showLowConfidenceNote,
  onSubmit,
  onCancel,
  cancelLabel = "Cancel",
  destructiveAction,
}: Props) {
  const [vendor, setVendor] = useState(initial.vendor);
  const [amountStr, setAmountStr] = useState(
    paiseToRupeesString(initial.amountInr),
  );
  const [cycle, setCycle] = useState<CycleSlug>(initial.cycle);
  const [dateValue, setDateValue] = useState(
    formatIstDateInputValue(initial.nextRenewal),
  );
  const [category, setCategory] = useState<CategorySlug>(initial.category);
  const [isSubscription, setIsSubscription] = useState(initial.isSubscription);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const lowConfidence =
    showLowConfidenceNote &&
    (typeof initial.confidence === "number" && initial.confidence < 0.6
      ? true
      : !initial.isSubscription);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (pending) return;
    setError(null);

    try {
      const amountInr = rupeesStringToPaise(amountStr);
      const nextRenewal = toStartOfDayIstMs(dateValue);
      await onSubmit({
        vendor: vendor.trim(),
        amountInr,
        cycle,
        nextRenewal,
        category,
        isSubscription,
        confidence: initial.confidence,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form
      onSubmit={(e) => {
        setPending(true);
        void handleSubmit(e);
      }}
      className="border border-hairline-strong bg-paper-deep/40 rounded-sm p-5 sm:p-6 flex flex-col gap-5"
    >
      {lowConfidence && (
        <div className="border border-hairline-strong bg-paper-deep px-4 py-3 rounded-sm text-[14px] text-ink-soft">
          Looks like a one-time purchase or low-confidence parse. Add anyway?
        </div>
      )}

      <Field label="Vendor">
        <input
          type="text"
          required
          value={vendor}
          onChange={(e) => setVendor(e.target.value)}
          className="w-full px-3 py-2.5 text-[16px] text-ink bg-paper-deep border border-hairline-strong rounded-sm focus:outline-none focus:border-accent"
        />
      </Field>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Amount (₹)">
          <input
            type="number"
            inputMode="decimal"
            min="0"
            step="0.01"
            required
            value={amountStr}
            onChange={(e) => setAmountStr(e.target.value)}
            className="w-full px-3 py-2.5 text-[16px] text-ink bg-paper-deep border border-hairline-strong rounded-sm focus:outline-none focus:border-accent"
          />
        </Field>

        <Field label="Next charge">
          <input
            type="date"
            required
            value={dateValue}
            onChange={(e) => setDateValue(e.target.value)}
            className="w-full px-3 py-2.5 text-[16px] text-ink bg-paper-deep border border-hairline-strong rounded-sm focus:outline-none focus:border-accent"
          />
        </Field>
      </div>

      <Field label="Cycle">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {CYCLE_SLUGS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCycle(c)}
              className={`px-3 py-2 text-[14px] rounded-sm border transition-colors ${
                cycle === c
                  ? "border-accent bg-accent text-paper"
                  : "border-hairline-strong bg-paper-deep text-ink hover:border-accent"
              }`}
            >
              {c === "one_time" ? "One-time" : c.charAt(0).toUpperCase() + c.slice(1)}
            </button>
          ))}
        </div>
      </Field>

      <Field label="Category">
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as CategorySlug)}
          className="w-full px-3 py-2.5 text-[16px] text-ink bg-paper-deep border border-hairline-strong rounded-sm focus:outline-none focus:border-accent"
        >
          {CATEGORY_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </Field>

      <label className="flex items-center gap-2 text-[14px] text-ink-soft">
        <input
          type="checkbox"
          checked={isSubscription}
          onChange={(e) => setIsSubscription(e.target.checked)}
          className="accent-accent"
        />
        Treat as a recurring subscription
      </label>

      {error && (
        <p role="alert" className="text-[14px] text-ink-soft">
          {error}
        </p>
      )}

      <div className="flex items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-3">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={pending}
              className="font-sans text-[14px] text-ink-soft hover:text-accent transition-colors"
            >
              {cancelLabel}
            </button>
          )}
          {destructiveAction && (
            <button
              type="button"
              onClick={destructiveAction.onClick}
              disabled={pending}
              className="font-sans text-[14px] text-ink-soft hover:text-accent transition-colors"
            >
              {destructiveAction.label}
            </button>
          )}
        </div>
        <button
          type="submit"
          disabled={pending}
          className="bg-accent hover:bg-accent-hover disabled:opacity-60 text-paper font-sans font-medium text-[15px] tracking-[0.01em] px-5 py-2.5 rounded-sm transition-colors"
        >
          {pending ? "Saving…" : submitLabel}
        </button>
      </div>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block font-sans text-[12px] uppercase tracking-[0.14em] text-ink-soft mb-2">
        {label}
      </span>
      {children}
    </label>
  );
}

export const EMPTY_SUBFORM_DEFAULTS: SubFormValues = {
  vendor: "",
  amountInr: 0,
  cycle: "monthly",
  nextRenewal: 0, // caller sets via toStartOfDayIstMs(Date.now() + 30d) on mount
  category: "other",
  isSubscription: true,
};

export const ALL_CYCLE_SLUGS = CYCLE_SLUGS;
export const ALL_CATEGORY_SLUGS = CATEGORY_SLUGS;
