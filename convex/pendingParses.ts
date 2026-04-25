import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireUser } from "./lib/auth";

const FILE_TTL_MS = 24 * 60 * 60 * 1000;

export const get = query({
  args: { pendingId: v.id("pendingParses") },
  handler: async (ctx, { pendingId }) => {
    const userId = await requireUser(ctx);
    const row = await ctx.db.get(pendingId);
    if (!row || row.userId !== userId) return null;
    const fileUrl = row.fileId ? await ctx.storage.getUrl(row.fileId) : null;
    return { ...row, fileUrl };
  },
});

export const listMine = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUser(ctx);
    return await ctx.db
      .query("pendingParses")
      .withIndex("by_user_and_status", (q) =>
        q.eq("userId", userId).eq("status", "awaiting_review"),
      )
      .order("desc")
      .take(20);
  },
});

export const replace = mutation({
  args: {
    pendingId: v.id("pendingParses"),
    replaceSubscriptionId: v.id("subscriptions"),
  },
  handler: async (ctx, { pendingId, replaceSubscriptionId }) => {
    const userId = await requireUser(ctx);
    const pending = await ctx.db.get(pendingId);
    const target = await ctx.db.get(replaceSubscriptionId);
    if (!pending || pending.userId !== userId) {
      throw new Error("Pending parse not found.");
    }
    if (!target || target.userId !== userId) {
      throw new Error("Subscription not found.");
    }
    if (pending.status !== "awaiting_review") {
      throw new Error("Already resolved.");
    }

    const now = Date.now();

    if (target.fileId && target.fileId !== pending.fileId) {
      try {
        await ctx.storage.delete(target.fileId);
      } catch {
        // gone
      }
    }

    await ctx.db.patch(replaceSubscriptionId, {
      vendor: pending.extracted.vendor,
      category: pending.extracted.category,
      amountInr: pending.extracted.amountInr,
      cycle: pending.extracted.cycle,
      nextRenewal: pending.extracted.nextRenewal,
      confidence: pending.extracted.confidence,
      fileId: pending.fileId,
      fileExpiresAt: pending.fileId ? now + FILE_TTL_MS : undefined,
      updatedAt: now,
    });

    await ctx.db.patch(pendingId, { status: "replaced" });
    return null;
  },
});

export const discard = mutation({
  args: { pendingId: v.id("pendingParses") },
  handler: async (ctx, { pendingId }) => {
    const userId = await requireUser(ctx);
    const row = await ctx.db.get(pendingId);
    if (!row || row.userId !== userId) {
      throw new Error("Not found.");
    }
    if (row.fileId) {
      try {
        await ctx.storage.delete(row.fileId);
      } catch {
        // gone
      }
    }
    await ctx.db.delete(pendingId);
    return null;
  },
});
