import type { Metadata } from "next";
import { Instrument_Serif } from "next/font/google";
import { GeistSans } from "geist/font/sans";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { ConvexAuthNextjsServerProvider } from "@convex-dev/auth/nextjs/server";
import { Providers } from "./providers";
import "./globals.css";

const instrumentSerif = Instrument_Serif({
  variable: "--font-display",
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "Renewl — Every recurring charge. One dashboard.",
  description:
    "Forward or upload your receipts. Renewl tells you what's auto-renewing, when, and for how much — before it hits your account.",
  metadataBase: new URL("https://renewl.in"),
  openGraph: {
    title: "Renewl — Every recurring charge. One dashboard.",
    description:
      "Forward or upload your receipts. Renewl tells you what's auto-renewing, when, and for how much — before it hits your account.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <ConvexAuthNextjsServerProvider>
      <html
        lang="en"
        className={`${GeistSans.variable} ${instrumentSerif.variable} antialiased`}
      >
        <body className="min-h-dvh bg-paper text-ink font-sans">
          <Providers>{children}</Providers>
          <Analytics />
          <SpeedInsights />
        </body>
      </html>
    </ConvexAuthNextjsServerProvider>
  );
}
