import { LogoPlain } from "./logo";
import { WaitlistForm } from "./waitlist-form";

export default function Page() {
  return (
    <main className="min-h-dvh flex flex-col px-6 sm:px-10 md:px-16 pt-8 sm:pt-10 md:pt-14 pb-12">
      {/* Logo — top-left, subtle. Centered-aligned with the content block below via max-width wrapper. */}
      <header className="mx-auto w-full max-w-[640px] md:max-w-[720px] lg:max-w-[780px] flex items-center">
        <LogoPlain className="text-ink" />
      </header>

      {/* Content — text left-aligned within a centered column */}
      <section className="flex-1 flex flex-col justify-center mx-auto w-full max-w-[640px] md:max-w-[720px] lg:max-w-[780px] mt-16 sm:mt-20 md:mt-24">
        {/* Eyebrow */}
        <p className="font-sans text-[12px] sm:text-[13px] uppercase tracking-[0.18em] text-ink-soft mb-8 sm:mb-10">
          Know what renews.&nbsp;&nbsp;Know what it costs.
        </p>

        {/* Headline */}
        <h1 className="font-display text-[44px] leading-[1.02] sm:text-[60px] sm:leading-[1.03] md:text-[76px] md:leading-[1.02] tracking-[-0.015em] text-ink">
          Every recurring charge.
          <br />
          <span className="italic">One dashboard</span>
          <span className="text-accent">.</span>
        </h1>

        {/* Subhead */}
        <p className="mt-7 sm:mt-8 font-sans text-[17px] sm:text-[19px] leading-[1.55] text-ink-soft max-w-[560px]">
          Forward or upload your receipts. Renewl tells you what&rsquo;s
          auto-renewing, when, and for how much&nbsp;— before it hits your
          account.
        </p>

        {/* Form */}
        <div className="mt-10 sm:mt-12 max-w-[520px]">
          <WaitlistForm />
        </div>

        {/* Bullets */}
        <ul className="mt-10 sm:mt-12 space-y-4 max-w-[560px]">
          {BULLETS.map((text) => (
            <li key={text} className="flex items-start gap-3">
              <TickGlyph className="mt-[6px] shrink-0 text-accent" />
              <span className="font-sans text-[15.5px] sm:text-[16px] leading-[1.5] text-ink">
                {text}
              </span>
            </li>
          ))}
        </ul>

        {/* Trust line — footnote-style */}
        <p className="mt-14 sm:mt-16 md:mt-20 pt-6 border-t border-hairline font-sans italic text-[13px] sm:text-[14px] leading-[1.6] text-ink-soft tracking-[0.005em] max-w-[560px]">
          Built this week for people who&rsquo;ve found a ₹1,499 charge they
          didn&rsquo;t remember signing up for.
        </p>
      </section>
    </main>
  );
}

const BULLETS = [
  "See every subscription, warranty, and auto-renewal in one place",
  "Get a heads-up the morning before anything charges",
  "Find the ones you forgot you were paying for",
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
