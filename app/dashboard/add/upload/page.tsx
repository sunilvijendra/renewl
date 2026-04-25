"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { DashboardHeader } from "../../header";
import Link from "next/link";

const MAX_BYTES = 10 * 1024 * 1024;
const ACCEPT = "application/pdf,image/png,image/jpeg,image/webp";

export default function UploadPage() {
  const router = useRouter();
  const generateUploadUrl = useMutation(api.parseJobs.generateUploadUrl);
  const submitUpload = useMutation(api.parseJobs.submitUpload);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file || pending) return;
    setError(null);

    if (file.size > MAX_BYTES) {
      setError("File is over 10MB.");
      return;
    }

    startTransition(async () => {
      try {
        const uploadUrl = await generateUploadUrl({});
        const res = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": file.type },
          body: file,
        });
        if (!res.ok) throw new Error("Upload failed.");
        const { storageId } = (await res.json()) as { storageId: string };
        const jobId = await submitUpload({
          fileId: storageId as never,
        });
        router.push(`/dashboard/review/${jobId}`);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not upload.");
      }
    });
  }

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
            Upload a receipt
          </h1>
          <p className="mt-2 font-sans text-[15px] text-ink-soft">
            PDF or image up to 10MB. We&rsquo;ll read it with Claude Haiku and
            give you an editable card to confirm.
          </p>

          <form
            onSubmit={handleSubmit}
            className="mt-8 border border-hairline-strong bg-paper-deep/40 rounded-sm p-6 flex flex-col gap-5"
          >
            <input
              type="file"
              accept={ACCEPT}
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="font-sans text-[14px] text-ink file:mr-4 file:py-2 file:px-4 file:rounded-sm file:border file:border-hairline-strong file:bg-paper file:text-ink file:font-sans file:text-[13px] hover:file:border-accent"
            />
            {file && (
              <p className="font-sans text-[13px] text-ink-soft">
                {file.name} · {(file.size / 1024).toFixed(0)} KB
              </p>
            )}
            {error && (
              <p role="alert" className="font-sans text-[13px] text-ink-soft">
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={!file || pending}
              className="self-start bg-accent hover:bg-accent-hover disabled:opacity-60 text-paper font-sans font-medium text-[15px] px-5 py-2.5 rounded-sm transition-colors"
            >
              {pending ? "Uploading…" : "Read this receipt"}
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
