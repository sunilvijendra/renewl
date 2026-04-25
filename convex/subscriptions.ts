import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireUser } from "./lib/auth";

const categoryValidator = v.union(
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
);

const cycleValidator = v.union(
  v.literal("monthly"),
  v.literal("quarterly"),
  v.literal("yearly"),
  v.literal("one_time"),
);

export const listMine = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUser(ctx);
    const subs = await ctx.db
      .query("subscriptions")
      .withIndex("by_user_and_nextRenewal", (q) => q.eq("userId", userId))
      .order("asc")
      .take(15);
    return subs;
  },
});

export const getReceiptUrl = query({
  args: { subscriptionId: v.id("subscriptions") },
  handler: async (ctx, { subscriptionId }) => {
    const userId = await requireUser(ctx);
    const sub = await ctx.db.get(subscriptionId);
    if (!sub || sub.userId !== userId) return null;
    if (!sub.fileId) return null;
    const meta = await ctx.db.system.get(sub.fileId);
    if (!meta) return null;
    return await ctx.storage.getUrl(sub.fileId);
  },
});

export const update = mutation({
  args: {
    subscriptionId: v.id("subscriptions"),
    patch: v.object({
      vendor: v.optional(v.string()),
      amountInr: v.optional(v.number()),
      cycle: v.optional(cycleValidator),
      nextRenewal: v.optional(v.number()),
      category: v.optional(categoryValidator),
    }),
  },
  handler: async (ctx, { subscriptionId, patch }) => {
    const userId = await requireUser(ctx);
    const sub = await ctx.db.get(subscriptionId);
    if (!sub || sub.userId !== userId) {
      throw new Error("Not found.");
    }
    await ctx.db.patch(subscriptionId, { ...patch, updatedAt: Date.now() });
    return null;
  },
});

export const remove = mutation({
  args: { subscriptionId: v.id("subscriptions") },
  handler: async (ctx, { subscriptionId }) => {
    const userId = await requireUser(ctx);
    const sub = await ctx.db.get(subscriptionId);
    if (!sub || sub.userId !== userId) {
      throw new Error("Not found.");
    }
    if (sub.fileId) {
      try {
        await ctx.storage.delete(sub.fileId);
      } catch {
        // already gone
      }
    }
    await ctx.db.delete(subscriptionId);
    return null;
  },
});

export const createManual = mutation({
  args: {
    vendor: v.string(),
    category: categoryValidator,
    amountInr: v.number(),
    cycle: cycleValidator,
    nextRenewal: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    const subs = await ctx.db
      .query("subscriptions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .take(11);
    if (subs.length >= 10) {
      throw new Error("You're at the 10-item cap — delete one first.");
    }
    const subscriptionId = await ctx.db.insert("subscriptions", {
      ...args,
      userId,
      updatedAt: Date.now(),
    });
    return { kind: "added" as const, subscriptionId };
  },
});
