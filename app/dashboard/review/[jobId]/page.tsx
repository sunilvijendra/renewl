"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { DashboardHeader } from "../../header";
import { SubForm, type SubFormValues } from "../../_components/sub-form";
import Link from "next/link";

export default function ReviewPage({
  params,
}: {
  params: Promise<{ jobId: string }>;
}) {
  const { jobId } = use(params);
  const router = useRouter();
  const job = useQuery(api.parseJobs.getJob, {
    jobId: jobId as Id<"parseJobs">,
  });
  const confirmJob = useMutation(api.parseJobs.confirm);
  const discard = useMutation(api.parseJobs.discard);
  const retry = useMutation(api.parseJobs.retry);

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
            Review parse
          </h1>

          <div className="mt-8">
            {job === undefined ? (
              <Loading text="Loading job…" />
            ) : job === null ? (
              <p className="font-sans text-[15px] text-ink-soft">
                Job not found.
              </p>
            ) : job.status === "queued" || job.status === "running" ? (
              <Loading text="Reading your receipt…" />
            ) : job.status === "failed" ? (
              <FailedCard
                error={job.lastError ?? "Unknown error."}
                onRetry={async () => {
                  await retry({ jobId: job._id });
                }}
                onDiscard={async () => {
                  await discard({ jobId: job._id });
                  router.push("/dashboard");
                }}
              />
            ) : job.status === "succeeded" && job.extracted ? (
              <SuccessCard
                jobId={job._id}
                fileUrl={job.fileUrl}
                initial={extractedToFormValues(job.extracted)}
                onConfirm={async (values) => {
                  const res = await confirmJob({
                    jobId: job._id,
                    edited: {
                      vendor: values.vendor,
                      amountInr: values.amountInr,
                      cycle: values.cycle,
                      nextRenewal: values.nextRenewal,
                      category: values.category,
                      isSubscription: values.isSubscription,
                      confidence: values.confidence ?? 0.6,
                    },
                  });
                  if (res.kind === "added") {
                    router.push("/dashboard");
                  } else {
                    router.push(`/dashboard/replace/${res.pendingId}`);
                  }
                }}
                onDiscard={async () => {
                  await discard({ jobId: job._id });
                  router.push("/dashboard");
                }}
              />
            ) : null}
          </div>
        </section>
      </div>
    </main>
  );
}

function Loading({ text }: { text: string }) {
  return (
    <div className="border border-hairline-strong bg-paper-deep/40 rounded-sm px-6 py-10 text-center">
      <div className="inline-block w-2 h-2 bg-accent rounded-full animate-pulse mr-2" />
      <p className="inline font-sans text-[15px] text-ink-soft">{text}</p>
    </div>
  );
}

function FailedCard({
  error,
  onRetry,
  onDiscard,
}: {
  error: string;
  onRetry: () => Promise<void>;
  onDiscard: () => Promise<void>;
}) {
  return (
    <div className="border border-hairline-strong bg-paper-deep/40 rounded-sm p-6 flex flex-col gap-4">
      <p className="font-display text-[20px] text-ink">
        We couldn&rsquo;t read this receipt.
      </p>
      <p className="font-sans text-[13px] text-ink-soft">{error}</p>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onRetry}
          className="bg-accent hover:bg-accent-hover text-paper font-sans font-medium text-[14px] px-4 py-2 rounded-sm transition-colors"
        >
          Try again
        </button>
        <button
          type="button"
          onClick={onDiscard}
          className="font-sans text-[14px] text-ink-soft hover:text-accent transition-colors"
        >
          Discard
        </button>
      </div>
    </div>
  );
}

function SuccessCard({
  fileUrl,
  initial,
  onConfirm,
  onDiscard,
}: {
  jobId: Id<"parseJobs">;
  fileUrl: string | null;
  initial: SubFormValues;
  onConfirm: (values: SubFormValues) => Promise<void>;
  onDiscard: () => Promise<void>;
}) {
  return (
    <div className="flex flex-col gap-4">
      {fileUrl && (
        <a
          href={fileUrl}
          target="_blank"
          rel="noreferrer"
          className="font-sans text-[13px] text-ink-soft hover:text-accent transition-colors self-start"
        >
          View original receipt →
        </a>
      )}
      <SubForm
        initial={initial}
        submitLabel="Add to tracker"
        showLowConfidenceNote
        onSubmit={onConfirm}
        destructiveAction={{
          label: "Discard",
          onClick: () => {
            void onDiscard();
          },
        }}
      />
    </div>
  );
}

function extractedToFormValues(extracted: {
  vendor: string;
  amountInr: number;
  cycle: "monthly" | "quarterly" | "yearly" | "one_time";
  nextRenewal: number;
  category:
    | "streaming"
    | "ai_productivity"
    | "commerce_membership"
    | "music_audio"
    | "cloud_storage"
    | "news_reading"
    | "fitness_wellness"
    | "insurance"
    | "emis_loans"
    | "utilities_telecom"
    | "other";
  isSubscription: boolean;
  confidence: number;
}): SubFormValues {
  return { ...extracted };
}
