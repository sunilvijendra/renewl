import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

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

const extractedValidator = v.object({
  vendor: v.string(),
  amountInr: v.number(),
  cycle: cycleValidator,
  nextRenewal: v.number(),
  category: categoryValidator,
  isSubscription: v.boolean(),
  confidence: v.number(),
});

export default defineSchema({
  waitlist: defineTable({
    email: v.string(),
    createdAt: v.number(),
    source: v.string(),
  }).index("by_email", ["email"]),

  users: defineTable({
    email: v.string(),
  }).index("by_email", ["email"]),

  subscriptions: defineTable({
    userId: v.id("users"),
    vendor: v.string(),
    category: categoryValidator,
    amountInr: v.number(),
    cycle: cycleValidator,
    nextRenewal: v.number(),
    confidence: v.optional(v.number()),
    fileId: v.optional(v.id("_storage")),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_and_nextRenewal", ["userId", "nextRenewal"]),

  parseJobs: defineTable({
    userId: v.id("users"),
    fileId: v.optional(v.id("_storage")),
    pastedText: v.optional(v.string()),
    extracted: v.optional(extractedValidator),
    status: v.union(
      v.literal("queued"),
      v.literal("running"),
      v.literal("succeeded"),
      v.literal("failed"),
    ),
    attempts: v.number(),
    lastError: v.optional(v.string()),
  }).index("by_user_and_status", ["userId", "status"]),

  pendingParses: defineTable({
    userId: v.id("users"),
    extracted: extractedValidator,
    fileId: v.optional(v.id("_storage")),
    status: v.union(
      v.literal("awaiting_review"),
      v.literal("replaced"),
      v.literal("discarded"),
    ),
  }).index("by_user_and_status", ["userId", "status"]),

  alerts: defineTable({
    userId: v.id("users"),
    subscriptionId: v.id("subscriptions"),
    type: v.union(v.literal("day_before")),
    sentAt: v.number(),
  }).index("by_subscription_and_type", ["subscriptionId", "type"]),
});
