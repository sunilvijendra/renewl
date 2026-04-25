export function LogoPlain({ className }: { className?: string }) {
  return (
    <span
      className={`font-display text-[22px] leading-none tracking-tight ${className ?? ""}`}
    >
      Renewl
    </span>
  );
}

export function LogoSignature({ className }: { className?: string }) {
  return (
    <span
      className={`font-display text-[22px] leading-none tracking-tight inline-flex items-baseline ${className ?? ""}`}
      aria-label="Renewl"
    >
      <span aria-hidden>Rene</span>
      <svg
        viewBox="0 0 20 20"
        className="inline-block h-[0.72em] w-[0.72em] translate-y-[0.06em] mx-[0.02em]"
        aria-hidden
      >
        <circle
          cx="10"
          cy="10"
          r="8.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
        />
        <path
          d="M 5.8 7.2 A 5.2 5.2 0 0 1 14.2 7.2 L 14.2 9"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
        <path
          d="M 12.2 8.6 L 14.2 9.2 L 14.8 7.2"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span aria-hidden>l</span>
    </span>
  );
}
