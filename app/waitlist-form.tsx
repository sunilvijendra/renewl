"use client";

import { useState, useTransition } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

type Status = "idle" | "success" | "error";

export function WaitlistForm() {
  const addEmail = useMutation(api.waitlist.addEmail);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (pending) return;
    setErrorMsg(null);

    startTransition(async () => {
      try {
        await addEmail({ email, source: "landing" });
        setStatus("success");
      } catch (err) {
        setStatus("error");
        setErrorMsg(
          err instanceof Error ? err.message : "Something went wrong."
        );
      }
    });
  }

  if (status === "success") {
    return (
      <div
        role="status"
        className="flex items-start gap-3 border border-hairline-strong bg-paper-deep/60 px-5 py-4 rounded-sm"
      >
        <CheckGlyph className="mt-[3px] shrink-0 text-accent" />
        <p className="font-display text-[19px] leading-snug text-ink">
          You&rsquo;re in. We&rsquo;ll email you when Renewl goes live.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="w-full">
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-0 sm:border sm:border-hairline-strong sm:rounded-sm sm:bg-paper-deep/40 sm:focus-within:border-accent sm:transition-colors">
        <label className="sr-only" htmlFor="email">
          Email address
        </label>
        <input
          id="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          required
          disabled={pending}
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (status === "error") setStatus("idle");
          }}
          placeholder="you@gmail.com"
          className="flex-1 min-w-0 px-4 py-3.5 text-[17px] text-ink placeholder:text-ink-muted bg-paper-deep/40 sm:bg-transparent border border-hairline-strong sm:border-0 rounded-sm sm:rounded-none focus:outline-none focus:border-accent sm:focus:border-0 disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={pending || email.length === 0}
          className="bg-accent hover:bg-accent-hover disabled:opacity-60 disabled:cursor-not-allowed text-paper font-sans font-medium text-[15px] tracking-[0.01em] px-6 py-3.5 rounded-sm sm:rounded-none transition-colors whitespace-nowrap"
        >
          {pending ? "Saving…" : "Count me in"}
        </button>
      </div>
      {status === "error" && errorMsg && (
        <p role="alert" className="mt-2 text-[14px] text-ink-soft">
          {errorMsg}
        </p>
      )}
    </form>
  );
}

function CheckGlyph({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 20 20"
      className={`h-[18px] w-[18px] ${className ?? ""}`}
      aria-hidden
    >
      <circle cx="10" cy="10" r="9" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <path
        d="M 5.8 10.2 L 8.8 13 L 14.4 7.2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
