export const CATEGORY_SLUGS = [
  "streaming",
  "ai_productivity",
  "commerce_membership",
  "music_audio",
  "cloud_storage",
  "news_reading",
  "fitness_wellness",
  "insurance",
  "emis_loans",
  "utilities_telecom",
  "other",
] as const;

export type CategorySlug = (typeof CATEGORY_SLUGS)[number];

export const CATEGORY_LABELS: Record<CategorySlug, string> = {
  streaming: "Streaming",
  ai_productivity: "AI & Productivity",
  commerce_membership: "Commerce membership",
  music_audio: "Music & audio",
  cloud_storage: "Cloud storage",
  news_reading: "News & reading",
  fitness_wellness: "Fitness & wellness",
  insurance: "Insurance",
  emis_loans: "EMIs & loans",
  utilities_telecom: "Utilities & telecom",
  other: "Other",
};

export const CATEGORY_OPTIONS = CATEGORY_SLUGS.map((slug) => ({
  value: slug,
  label: CATEGORY_LABELS[slug],
}));

export const CYCLE_SLUGS = ["monthly", "quarterly", "yearly", "one_time"] as const;
export type CycleSlug = (typeof CYCLE_SLUGS)[number];

export const CYCLE_LABELS: Record<CycleSlug, string> = {
  monthly: "Monthly",
  quarterly: "Quarterly",
  yearly: "Yearly",
  one_time: "One-time",
};

const rupeeFormatter = new Intl.NumberFormat("en-IN", {
  maximumFractionDigits: 0,
});

export function formatRupees(paise: number): string {
  const rupees = Math.round(paise) / 100;
  return `₹${rupeeFormatter.format(rupees)}`;
}

export function paiseToRupeesString(paise: number): string {
  const rupees = paise / 100;
  return Number.isInteger(rupees) ? String(rupees) : rupees.toFixed(2);
}

export function rupeesStringToPaise(rupees: string): number {
  const n = Number.parseFloat(rupees);
  if (Number.isNaN(n) || n < 0) {
    throw new Error("Invalid rupee amount.");
  }
  return Math.round(n * 100);
}
