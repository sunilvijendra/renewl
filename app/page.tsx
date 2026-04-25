import Link from "next/link";
import { isAuthenticatedNextjs } from "@convex-dev/auth/nextjs/server";
import { LogoPlain } from "./logo";

export default async function Page() {
  const isAuthed = await isAuthenticatedNextjs();
  const ctaHref = isAuthed ? "/dashboard" : "/sign-in";
  const ctaLabel = isAuthed ? "Open dashboard" : "Sign in";

  return (
    <main className="min-h-dvh flex flex-col px-6 sm:px-10 md:px-16 pt-8 sm:pt-10 md:pt-14 pb-12">
      <header className="mx-auto w-full max-w-[640px] md:max-w-[720px] lg:max-w-[780px] flex items-center justify-between">
        <LogoPlain className="text-ink" />
        <Link
          href={ctaHref}
          className="font-sans text-[14px] text-ink-soft hover:text-accent transition-colors"
        >
          {isAuthed ? "Dashboard" : "Sign in"}
        </Link>
      </header>

      <section className="flex-1 flex flex-col justify-center mx-auto w-full max-w-[640px] md:max-w-[720px] lg:max-w-[780px] mt-16 sm:mt-20 md:mt-24">
        <p className="font-sans text-[12px] sm:text-[13px] uppercase tracking-[0.18em] text-ink-soft mb-8 sm:mb-10">
          Know what renews.&nbsp;&nbsp;Know what it costs.
        </p>

        <h1 className="font-display text-[44px] leading-[1.02] sm:text-[60px] sm:leading-[1.03] md:text-[76px] md:leading-[1.02] tracking-[-0.015em] text-ink">
          Every recurring charge.
          <br />
          <span className="italic">One dashboard</span>
          <span className="text-accent">.</span>
        </h1>

        <p className="mt-7 sm:mt-8 font-sans text-[17px] sm:text-[19px] leading-[1.55] text-ink-soft max-w-[560px]">
          Upload or paste your receipts. Renewl tells you what&rsquo;s
          auto-renewing, when, and for how much&nbsp;— and emails you the
          morning before anything charges.
        </p>

        <div className="mt-10 sm:mt-12">
          <Link
            href={ctaHref}
            className="inline-block bg-accent hover:bg-accent-hover text-paper font-sans font-medium text-[16px] tracking-[0.01em] px-7 py-3.5 rounded-sm transition-colors"
          >
            {ctaLabel} →
          </Link>
          {!isAuthed && (
            <p className="mt-3 font-sans text-[13px] text-ink-soft">
              Magic link to your inbox. No password.
            </p>
          )}
        </div>

        <ul className="mt-12 sm:mt-14 space-y-4 max-w-[560px]">
          {BULLETS.map((text) => (
            <li key={text} className="flex items-start gap-3">
              <TickGlyph className="mt-[6px] shrink-0 text-accent" />
              <span className="font-sans text-[15.5px] sm:text-[16px] leading-[1.5] text-ink">
                {text}
              </span>
            </li>
          ))}
        </ul>

        <div className="mt-16 sm:mt-20">
          <p className="font-sans text-[12px] sm:text-[13px] uppercase tracking-[0.18em] text-ink-soft mb-6">
            How it works
          </p>
          <ol className="flex flex-col gap-6 max-w-[560px]">
            {STEPS.map((step, i) => (
              <li key={step.title} className="flex items-start gap-5">
                <span className="font-display text-[28px] text-accent w-6 shrink-0 leading-none mt-[2px]">
                  {i + 1}
                </span>
                <div>
                  <p className="font-display text-[20px] text-ink leading-tight">
                    {step.title}
                  </p>
                  <p className="mt-1 font-sans text-[15px] text-ink-soft leading-[1.55]">
                    {step.body}
                  </p>
                </div>
              </li>
            ))}
          </ol>
          <p className="mt-7 font-sans italic text-[13px] sm:text-[14px] text-ink-soft max-w-[560px]">
            Uploaded receipts auto-delete after 24 hours. We keep only the
            parsed details.
          </p>
        </div>

        <p className="mt-14 sm:mt-16 md:mt-20 pt-6 border-t border-hairline font-sans italic text-[13px] sm:text-[14px] leading-[1.6] text-ink-soft tracking-[0.005em] max-w-[560px]">
          Built for people who&rsquo;ve found a ₹1,499 charge they didn&rsquo;t
          remember signing up for.
        </p>
      </section>

      <footer className="mx-auto w-full max-w-[640px] md:max-w-[720px] lg:max-w-[780px] mt-12 sm:mt-16 pt-6 border-t border-hairline flex flex-col sm:flex-row items-baseline justify-between gap-2 font-sans text-[13px] text-ink-muted">
        <span>© 2026 Renewl</span>
        <span>Limited Time Free Plan &middot; Pro plan launching soon</span>
      </footer>
    </main>
  );
}

const BULLETS = [
  "See every subscription, warranty, and auto-renewal in one place",
  "Get a heads-up the morning before anything charges",
  "Find the ones you forgot you were paying for",
] as const;

const STEPS = [
  {
    title: "Drop in a receipt",
    body: "Upload a PDF or image, or paste the text from an email.",
  },
  {
    title: "Review the parsed card",
    body: "Vendor, amount, cycle, next charge — all extracted. Edit anything, then confirm.",
  },
  {
    title: "We email you the morning before",
    body: "08:00 IST, the day before any auto-renewal hits your account.",
  },
] as const;

function TickGlyph({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      className={`h-[14px] w-[14px] ${className ?? ""}`}
      aria-hidden
    >
      <path
        d="M 3 8.4 L 6.4 11.6 L 13 4.6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
