import { v } from "convex/values";
import { mutation, query, internalQuery, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";
import { requireUser } from "./lib/auth";

const FILE_TTL_MS = 24 * 60 * 60 * 1000;
const PARSE_FILE_TTL_MS = 25 * 60 * 60 * 1000;
const MAX_PASTE_LENGTH = 100_000;

const extractedValidator = v.object({
  vendor: v.string(),
  amountInr: v.number(),
  cycle: v.union(
    v.literal("monthly"),
    v.literal("quarterly"),
    v.literal("yearly"),
    v.literal("one_time"),
  ),
  nextRenewal: v.number(),
  category: v.union(
    v.literal("streaming"),
    v.literal("ai_productivity"),
    v.literal("commerce_membership"),
    v.literal("music_audio"),
    v.literal("cloud_storage"),
    v.literal("news_reading"),
    v.literal("fitness_wellness"),
    v.literal("insurance"),
    v.literal("emis_loans"),
    v.literal("utilities_telecom"),
    v.literal("other"),
  ),
  isSubscription: v.boolean(),
  confidence: v.number(),
});

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    await requireUser(ctx);
    return await ctx.storage.generateUploadUrl();
  },
});

export const submitUpload = mutation({
  args: { fileId: v.id("_storage") },
  handler: async (ctx, { fileId }) => {
    const userId = await requireUser(ctx);
    const jobId = await ctx.db.insert("parseJobs", {
      userId,
      fileId,
      fileExpiresAt: Date.now() + PARSE_FILE_TTL_MS,
      status: "queued",
      attempts: 0,
    });
    await ctx.scheduler.runAfter(0, internal.parser.run, { jobId });
    return jobId;
  },
});

export const submitPaste = mutation({
  args: { pastedText: v.string() },
  handler: async (ctx, { pastedText }) => {
    const userId = await requireUser(ctx);
    const trimmed = pastedText.trim();
    if (trimmed.length < 20) {
      throw new Error("Paste at least a few lines of receipt text.");
    }
    if (trimmed.length > MAX_PASTE_LENGTH) {
      throw new Error("That paste is too long.");
    }
    const jobId = await ctx.db.insert("parseJobs", {
      userId,
      pastedText: trimmed,
      status: "queued",
      attempts: 0,
    });
    await ctx.scheduler.runAfter(0, internal.parser.run, { jobId });
    return jobId;
  },
});

export const listMyJobs = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUser(ctx);
    const jobs = await ctx.db
      .query("parseJobs")
      .withIndex("by_user_and_status", (q) => q.eq("userId", userId))
      .order("desc")
      .take(20);
    return jobs;
  },
});

export const getJob = query({
  args: { jobId: v.id("parseJobs") },
  handler: async (ctx, { jobId }) => {
    const userId = await requireUser(ctx);
    const job = await ctx.db.get(jobId);
    if (!job || job.userId !== userId) return null;
    const fileUrl = job.fileId ? await ctx.storage.getUrl(job.fileId) : null;
    return { ...job, fileUrl };
  },
});

export const discard = mutation({
  args: { jobId: v.id("parseJobs") },
  handler: async (ctx, { jobId }) => {
    const userId = await requireUser(ctx);
    const job = await ctx.db.get(jobId);
    if (!job || job.userId !== userId) {
      throw new Error("Not found.");
    }
    if (job.fileId) {
      try {
        await ctx.storage.delete(job.fileId);
      } catch {
        // file may already be gone
      }
    }
    await ctx.db.delete(jobId);
    return null;
  },
});

export const retry = mutation({
  args: { jobId: v.id("parseJobs") },
  handler: async (ctx, { jobId }) => {
    const userId = await requireUser(ctx);
    const job = await ctx.db.get(jobId);
    if (!job || job.userId !== userId) {
      throw new Error("Not found.");
    }
    await ctx.db.patch(jobId, { status: "queued", lastError: undefined });
    await ctx.scheduler.runAfter(0, internal.parser.run, { jobId });
    return null;
  },
});

export const confirm = mutation({
  args: {
    jobId: v.id("parseJobs"),
    edited: extractedValidator,
  },
  handler: async (ctx, { jobId, edited }) => {
    const userId = await requireUser(ctx);
    const job = await ctx.db.get(jobId);
    if (!job || job.userId !== userId) {
      throw new Error("Not found.");
    }
    if (job.status !== "succeeded") {
      throw new Error("Parse not ready.");
    }

    const subs = await ctx.db
      .query("subscriptions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .take(8);

    const now = Date.now();

    if (subs.length < 7) {
      const subscriptionId = await ctx.db.insert("subscriptions", {
        userId,
        vendor: edited.vendor,
        category: edited.category,
        amountInr: edited.amountInr,
        cycle: edited.cycle,
        nextRenewal: edited.nextRenewal,
        confidence: edited.confidence,
        fileId: job.fileId,
        fileExpiresAt: job.fileId ? now + FILE_TTL_MS : undefined,
        updatedAt: now,
      });
      await ctx.db.delete(jobId);
      return { kind: "added" as const, subscriptionId };
    }

    const pendingId = await ctx.db.insert("pendingParses", {
      userId,
      extracted: edited,
      fileId: job.fileId,
      fileExpiresAt: job.fileId ? now + FILE_TTL_MS : undefined,
      status: "awaiting_review",
    });
    await ctx.db.delete(jobId);
    return { kind: "queued_for_replacement" as const, pendingId };
  },
});

// Internal helpers used by the parser action.

export const _loadJobInternal = internalQuery({
  args: { jobId: v.id("parseJobs") },
  handler: async (ctx, { jobId }) => {
    return await ctx.db.get(jobId);
  },
});

export const _markRunning = internalMutation({
  args: { jobId: v.id("parseJobs") },
  handler: async (ctx, { jobId }) => {
    const job = await ctx.db.get(jobId);
    if (!job) return;
    await ctx.db.patch(jobId, {
      status: "running",
      attempts: job.attempts + 1,
    });
  },
});

export const _markSucceeded = internalMutation({
  args: { jobId: v.id("parseJobs"), extracted: extractedValidator },
  handler: async (ctx, { jobId, extracted }) => {
    const job = await ctx.db.get(jobId);
    if (!job) return; // discarded mid-flight
    await ctx.db.patch(jobId, { status: "succeeded", extracted });
  },
});

export const _markFailed = internalMutation({
  args: { jobId: v.id("parseJobs"), lastError: v.string() },
  handler: async (ctx, { jobId, lastError }) => {
    const job = await ctx.db.get(jobId);
    if (!job) return;
    await ctx.db.patch(jobId, { status: "failed", lastError });
  },
});

export const _getStorageContentType = internalQuery({
  args: { fileId: v.id("_storage") },
  handler: async (ctx, { fileId }): Promise<string | null> => {
    const meta = await ctx.db.system.get(fileId);
    return meta?.contentType ?? null;
  },
});

// Helper types
export type ParseJobId = Id<"parseJobs">;
