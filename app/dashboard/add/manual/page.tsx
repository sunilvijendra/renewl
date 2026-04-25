"use client";

import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { DashboardHeader } from "../../header";
import {
  SubForm,
  type SubFormValues,
} from "../../_components/sub-form";
import { toStartOfDayIstMs } from "@/lib/dates";
import Link from "next/link";

export default function ManualPage() {
  const router = useRouter();
  const createManual = useMutation(api.subscriptions.createManual);

  const initial: SubFormValues = {
    vendor: "",
    amountInr: 0,
    cycle: "monthly",
    nextRenewal: toStartOfDayIstMs(Date.now() + 30 * 24 * 60 * 60 * 1000),
    category: "other",
    isSubscription: true,
  };

  return (
    <main className="min-h-dvh px-6 sm:px-10 md:px-16 pt-8 pb-12">
      <div className="mx-auto w-full max-w-[640px]">
        <DashboardHeader />

        <section className="mt-10">
          <Link
            href="/dashboard"
            className="font-sans text-[13px] text-ink-soft hover:text-accent"
          >
            ← Back
          </Link>

          <h1 className="mt-4 font-display text-[32px] sm:text-[40px] tracking-[-0.01em] text-ink">
            Add manually
          </h1>
          <p className="mt-2 font-sans text-[15px] text-ink-soft">
            For subscriptions without a receipt — gym, cash insurance,
            handshake recurring.
          </p>

          <div className="mt-8">
            <SubForm
              initial={initial}
              submitLabel="Add subscription"
              onSubmit={async (values) => {
                await createManual({
                  vendor: values.vendor,
                  category: values.category,
                  amountInr: values.amountInr,
                  cycle: values.cycle,
                  nextRenewal: values.nextRenewal,
                });
                router.push("/dashboard");
              }}
              onCancel={() => router.push("/dashboard")}
            />
          </div>
        </section>
      </div>
    </main>
  );
}
