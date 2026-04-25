import { LogoPlain, LogoSignature } from "../logo";

export default function PreviewPage() {
  return (
    <main className="min-h-dvh flex flex-col px-6 sm:px-10 md:px-16 py-10">
      <p className="font-sans text-[12px] uppercase tracking-[0.18em] text-ink-soft">
        Logo comparison — not for production
      </p>

      <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="border border-hairline-strong bg-paper-deep/40 p-10 rounded-sm">
          <p className="font-sans text-[11px] uppercase tracking-[0.2em] text-ink-muted mb-8">
            Option A — Plain wordmark
          </p>
          <LogoPlain className="text-ink" />
          <p className="mt-10 font-sans text-[13px] leading-[1.6] text-ink-soft max-w-[280px]">
            Quieter. Lets the headline do all the work. Feels most like a serif
            magazine masthead.
          </p>
        </div>

        <div className="border border-hairline-strong bg-paper-deep/40 p-10 rounded-sm">
          <p className="font-sans text-[11px] uppercase tracking-[0.2em] text-ink-muted mb-8">
            Option B — Signature mark (circled arrow for the &ldquo;w&rdquo;)
          </p>
          <LogoSignature className="text-ink" />
          <p className="mt-10 font-sans text-[13px] leading-[1.6] text-ink-soft max-w-[280px]">
            Carries meaning (recurring charge motif). More memorable but slightly
            busier. My pick for the live site unless you say otherwise.
          </p>
        </div>
      </div>

      <div className="mt-14 pt-8 border-t border-hairline">
        <p className="font-sans text-[12px] uppercase tracking-[0.18em] text-ink-soft mb-6">
          Scaled up — how they feel at 2×
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="border border-hairline-strong bg-paper-deep/40 p-12 rounded-sm flex items-center justify-center">
            <div className="scale-[2.2] origin-center">
              <LogoPlain className="text-ink" />
            </div>
          </div>
          <div className="border border-hairline-strong bg-paper-deep/40 p-12 rounded-sm flex items-center justify-center">
            <div className="scale-[2.2] origin-center">
              <LogoSignature className="text-ink" />
            </div>
          </div>
        </div>
      </div>

      <p className="mt-12 font-sans text-[14px] text-ink-soft">
        Live site is at <a href="/" className="text-accent underline underline-offset-4">/</a>.
        Tell me A or B and I&rsquo;ll lock it in before deploy.
      </p>
    </main>
  );
}
