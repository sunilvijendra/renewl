"use client";

import { useEffect, useState } from "react";
import { useAction } from "convex/react";
import { api } from "@/convex/_generated/api";

type FeedbackType = "bug" | "idea" | "question" | "other";

const TYPES: { value: FeedbackType; label: string; placeholder: string }[] = [
  {
    value: "bug",
    label: "Bug",
    placeholder: "What went wrong, where, and when?",
  },
  {
    value: "idea",
    label: "Idea",
    placeholder: "What would make Renewl more useful?",
  },
  {
    value: "question",
    label: "Question",
    placeholder: "What would you like to know?",
  },
  {
    value: "other",
    label: "Other",
    placeholder: "Tell me anything…",
  },
];

export function FeedbackModal({
  open,
  onClose,
  userEmail,
}: {
  open: boolean;
  onClose: () => void;
  userEmail: string | null;
}) {
  const submit = useAction(api.feedback.submit);
  const [type, setType] = useState<FeedbackType>("bug");
  const [name, setName] = useState("");
  const [feedback, setFeedback] = useState("");
  const [pending, setPending] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !pending) handleClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, pending]);

  if (!open) return null;

  function reset() {
    setType("bug");
    setName("");
    setFeedback("");
    setStatus("idle");
    setError(null);
  }

  function handleClose() {
    if (pending) return;
    reset();
    onClose();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (pending) return;
    setError(null);
    setPending(true);
    try {
      await submit({
        type,
        name: name.trim() || undefined,
        feedback: feedback.trim(),
        page: typeof window !== "undefined" ? window.location.href : "",
        userAgent:
          typeof window !== "undefined" ? window.navigator.userAgent : "",
      });
      setStatus("success");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Could not send feedback.");
    } finally {
      setPending(false);
    }
  }

  const placeholder =
    TYPES.find((t) => t.value === type)?.placeholder ?? "Tell me anything…";

  return (
    <div
      className="fixed inset-0 z-50 flex items-start sm:items-center justify-center bg-ink/40 p-4 sm:p-6 overflow-y-auto"
      onClick={handleClose}
      role="presentation"
    >
      <div
        className="w-full max-w-[520px] bg-paper border border-hairline-strong rounded-sm shadow-xl my-8 sm:my-0"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="feedback-title"
      >
        {status === "success" ? (
          <div className="p-6 sm:p-8">
            <p
              id="feedback-title"
              className="font-display text-[24px] text-ink leading-tight mb-2"
            >
              Got it — thanks.
            </p>
            <p className="font-sans text-[15px] text-ink-soft leading-[1.55]">
              I&rsquo;ll reply to{" "}
              <span className="text-ink">{userEmail ?? "your email"}</span> if I
              have a follow-up.
            </p>
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={handleClose}
                className="bg-accent hover:bg-accent-hover text-paper font-sans font-medium text-[15px] px-5 py-2.5 rounded-sm transition-colors"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  reset();
                }}
                className="font-sans text-[14px] text-ink-soft hover:text-accent transition-colors"
              >
                Send another
              </button>
            </div>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="p-6 sm:p-8 flex flex-col gap-5"
          >
            <div>
              <p
                id="feedback-title"
                className="font-display text-[24px] text-ink leading-tight"
              >
                Send feedback
              </p>
              {userEmail && (
                <p className="mt-1 font-sans text-[13px] text-ink-soft">
                  Sending as <span className="text-ink">{userEmail}</span>
                </p>
              )}
            </div>

            <div>
              <span className="block font-sans text-[12px] uppercase tracking-[0.14em] text-ink-soft mb-2">
                Type
              </span>
              <div className="flex gap-2 flex-wrap">
                {TYPES.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setType(t.value)}
                    className={`px-3 py-2 text-[14px] rounded-sm border transition-colors ${
                      type === t.value
                        ? "border-accent bg-accent text-paper"
                        : "border-hairline-strong bg-paper-deep text-ink hover:border-accent"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <label className="block">
              <span className="block font-sans text-[12px] uppercase tracking-[0.14em] text-ink-soft mb-2">
                Name{" "}
                <span className="normal-case tracking-normal text-ink-muted">
                  (optional)
                </span>
              </span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="What should I call you?"
                className="w-full px-3 py-2.5 text-[16px] text-ink bg-paper-deep border border-hairline-strong rounded-sm focus:outline-none focus:border-accent"
              />
            </label>

            <label className="block">
              <span className="block font-sans text-[12px] uppercase tracking-[0.14em] text-ink-soft mb-2">
                Feedback
              </span>
              <textarea
                required
                minLength={10}
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder={placeholder}
                rows={6}
                className="w-full px-3 py-2.5 text-[15px] text-ink bg-paper-deep border border-hairline-strong rounded-sm focus:outline-none focus:border-accent font-sans"
              />
            </label>

            {error && (
              <p role="alert" className="font-sans text-[13px] text-ink-soft">
                {error}
              </p>
            )}

            <div className="flex items-center justify-between pt-2 gap-4">
              <p className="font-sans text-[12px] text-ink-muted leading-[1.5]">
                I&rsquo;ll reply via email if there&rsquo;s a follow-up.
              </p>
              <div className="flex gap-3 shrink-0">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={pending}
                  className="font-sans text-[14px] text-ink-soft hover:text-accent transition-colors disabled:opacity-60"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={pending || feedback.trim().length < 10}
                  className="bg-accent hover:bg-accent-hover disabled:opacity-60 disabled:cursor-not-allowed text-paper font-sans font-medium text-[15px] px-5 py-2.5 rounded-sm transition-colors"
                >
                  {pending ? "Sending…" : "Send"}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
