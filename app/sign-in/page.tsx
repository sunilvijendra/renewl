"use client";

import { useState, useTransition } from "react";
import { useAuthActions } from "@convex-dev/auth/react";
import Link from "next/link";
import { LogoPlain } from "../logo";

type Status = "idle" | "sent" | "error";

export default function SignInPage() {
  const { signIn } = useAuthActions();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (pending) return;
    setErrorMsg(null);

    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      try {
        await signIn("resend", formData);
        setStatus("sent");
      } catch (err) {
        setStatus("error");
        setErrorMsg(
          err instanceof Error ? err.message : "Could not send link.",
        );
      }
    });
  }

  return (
    <main className="min-h-dvh flex flex-col px-6 sm:px-10 md:px-16 pt-8 sm:pt-10 md:pt-14 pb-12">
      <header className="mx-auto w-full max-w-[520px] flex items-center">
        <Link href="/" className="text-ink hover:text-accent transition-colors">
          <LogoPlain />
        </Link>
      </header>

      <section className="flex-1 flex flex-col justify-center mx-auto w-full max-w-[520px]">
        <p className="font-sans text-[12px] sm:text-[13px] uppercase tracking-[0.18em] text-ink-soft mb-6">
          Sign in to Renewl
        </p>

        <h1 className="font-display text-[40px] leading-[1.04] sm:text-[52px] sm:leading-[1.04] tracking-[-0.015em] text-ink">
          We&rsquo;ll email you{" "}
          <span className="italic">a link</span>
          <span className="text-accent">.</span>
        </h1>

        <p className="mt-6 font-sans text-[16px] leading-[1.55] text-ink-soft">
          No password. The link expires in 30 minutes.
        </p>

        <div className="mt-10">
          {status === "sent" ? (
            <div
              role="status"
              className="flex items-start gap-3 border border-hairline-strong bg-paper-deep/60 px-5 py-4 rounded-sm"
            >
              <CheckGlyph className="mt-[3px] shrink-0 text-accent" />
              <p className="font-display text-[19px] leading-snug text-ink">
                Check your inbox. The link will land in a moment.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate className="w-full">
              <input type="hidden" name="redirectTo" value="/dashboard" />
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-0 sm:border sm:border-hairline-strong sm:rounded-sm sm:bg-paper-deep/40 sm:focus-within:border-accent sm:transition-colors">
                <label className="sr-only" htmlFor="email">
                  Email address
                </label>
                <input
                  id="email"
                  name="email"
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
                  {pending ? "Sending…" : "Send link"}
                </button>
              </div>
              {status === "error" && errorMsg && (
                <p role="alert" className="mt-2 text-[14px] text-ink-soft">
                  {errorMsg}
                </p>
              )}
            </form>
          )}
        </div>
      </section>
    </main>
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
