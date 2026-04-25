"use node";

import { v } from "convex/values";
import { z } from "zod";
import { generateObject, NoObjectGeneratedError } from "ai";
import { openai } from "@ai-sdk/openai";
import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { toStartOfDayIstMs, todayIsoIst } from "./lib/dates";

const CATEGORY_SLUGS = [
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

const CYCLE_SLUGS = ["monthly", "quarterly", "yearly", "one_time"] as const;

const parseSchema = z.object({
  vendor: z.string().min(1).describe("The merchant or service name."),
  amountInr: z
    .number()
    .positive()
    .describe("Amount in INR rupees as a number (e.g. 649 for ₹649)."),
  cycle: z
    .enum(CYCLE_SLUGS)
    .describe("Billing cycle. Default to monthly if uncertain."),
  nextRenewal: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .describe("Next billing date as YYYY-MM-DD."),
  category: z.enum(CATEGORY_SLUGS).describe("Category slug from the fixed list."),
  isSubscription: z
    .boolean()
    .describe(
      "True only if this is a recurring subscription. Food orders, single product purchases, ride-hailing, one-off bills are false.",
    ),
  confidence: z
    .number()
    .min(0)
    .max(1)
    .describe(
      "0.9+ if all fields are explicit on the receipt. 0.6-0.9 if some fields inferred. <0.6 if guessing.",
    ),
});

function buildSystemPrompt(): string {
  return [
    "You extract subscription data from Indian consumer receipts.",
    "Always extract amount in INR. If the receipt shows USD, convert at 84 INR/USD.",
    "Vendors you may see: Netflix, Hotstar / Disney+ Hotstar, JioCinema, JioSaavn, Spotify, YouTube Premium, Apple Music, Amazon Prime, Flipkart Plus, Zomato Gold, Swiggy One, Cred, Notion, Linear, ChatGPT / OpenAI, Claude, Cursor, Vercel, Apollo 24/7, 1mg, Acko, ICICI Lombard, HDFC Ergo, Airtel, Jio, Tata Play, Cult Pass, Zerodha, Groww.",
    "Date rule: nextRenewal must be the next billing date as YYYY-MM-DD. If the receipt is for a one-time purchase, use 30 days from today.",
    "Cycle rule: pick from the enum. If uncertain between monthly and yearly, default monthly.",
    "Category rule: pick a slug from the fixed list. If nothing fits, use 'other'.",
    "isSubscription rule: true ONLY for recurring services. Food, single products, ride-hailing, taxes, one-off bills → false.",
    "Confidence rule: 0.9+ if explicit. 0.6-0.9 if inferred. <0.6 if guessing.",
  ].join("\n");
}

function userPromptText(today: string): string {
  return `Today's date is ${today} (Asia/Kolkata). Extract subscription details from this receipt:`;
}

export const run = internalAction({
  args: { jobId: v.id("parseJobs") },
  handler: async (ctx, { jobId }) => {
    await ctx.runMutation(internal.parseJobs._markRunning, { jobId });

    let job;
    try {
      job = await ctx.runQuery(internal.parseJobs._loadJobInternal, { jobId });
    } catch (err) {
      await ctx.runMutation(internal.parseJobs._markFailed, {
        jobId,
        lastError: `Failed to load job: ${String(err)}`,
      });
      return;
    }
    if (!job) return;

    const today = todayIsoIst(Date.now());

    type ContentPart =
      | { type: "text"; text: string }
      | { type: "image"; image: Uint8Array | string }
      | {
          type: "file";
          data: Uint8Array | string;
          mediaType: string;
          filename?: string;
        };

    const parts: ContentPart[] = [
      { type: "text", text: userPromptText(today) },
    ];

    if (job.fileId) {
      try {
        const contentType = await ctx.runQuery(
          internal.parseJobs._getStorageContentType,
          { fileId: job.fileId },
        );
        const blob = await ctx.storage.get(job.fileId);
        if (!blob) {
          await ctx.runMutation(internal.parseJobs._markFailed, {
            jobId,
            lastError: "Uploaded file is no longer available.",
          });
          return;
        }
        const buf = new Uint8Array(await blob.arrayBuffer());
        if (contentType === "application/pdf") {
          parts.push({
            type: "file",
            data: buf,
            mediaType: "application/pdf",
          });
        } else if (contentType && contentType.startsWith("image/")) {
          parts.push({ type: "image", image: buf });
        } else {
          await ctx.runMutation(internal.parseJobs._markFailed, {
            jobId,
            lastError: `Unsupported file type: ${contentType ?? "unknown"}`,
          });
          return;
        }
      } catch (err) {
        await ctx.runMutation(internal.parseJobs._markFailed, {
          jobId,
          lastError: `Could not read upload: ${String(err)}`,
        });
        return;
      }
    } else if (job.pastedText) {
      parts.push({
        type: "text",
        text: `Pasted receipt text:\n${job.pastedText}`,
      });
    } else {
      await ctx.runMutation(internal.parseJobs._markFailed, {
        jobId,
        lastError: "Job has no file or pasted text.",
      });
      return;
    }

    try {
      const { object } = await generateObject({
        model: openai("gpt-4o-mini"),
        schema: parseSchema,
        system: buildSystemPrompt(),
        messages: [{ role: "user", content: parts }],
      });

      const nextRenewalMs = toStartOfDayIstMs(object.nextRenewal);
      const amountPaise = Math.round(object.amountInr * 100);

      await ctx.runMutation(internal.parseJobs._markSucceeded, {
        jobId,
        extracted: {
          vendor: object.vendor,
          amountInr: amountPaise,
          cycle: object.cycle,
          nextRenewal: nextRenewalMs,
          category: object.category,
          isSubscription: object.isSubscription,
          confidence: object.confidence,
        },
      });
    } catch (err) {
      let lastError: string;
      if (err instanceof NoObjectGeneratedError) {
        lastError = `Schema violation: ${err.message} | text=${err.text ?? ""}`;
      } else {
        lastError = err instanceof Error ? err.message : String(err);
      }
      await ctx.runMutation(internal.parseJobs._markFailed, {
        jobId,
        lastError,
      });
    }
  },
});
