import { v } from "convex/values";
import {
  internalAction,
  internalMutation,
  internalQuery,
} from "./_generated/server";
import { internal } from "./_generated/api";
import { Doc, Id } from "./_generated/dataModel";

const SWEEP_BATCH = 50;

type ExpiredRow<T extends "subscriptions" | "parseJobs" | "pendingParses"> = {
  rowId: Id<T>;
  fileId: Id<"_storage"> | undefined;
};

export const sweep = internalAction({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();

    for (const table of ["subscriptions", "parseJobs", "pendingParses"] as const) {
      const expired: ExpiredRow<typeof table>[] = await ctx.runQuery(
        internal.cleanup._listExpired,
        { table, now, limit: SWEEP_BATCH },
      );

      for (const row of expired) {
        if (row.fileId) {
          try {
            await ctx.storage.delete(row.fileId);
          } catch {
            // already gone
          }
        }
        await ctx.runMutation(internal.cleanup._clearFileFields, {
          table,
          rowId: row.rowId as Id<"subscriptions" | "parseJobs" | "pendingParses">,
        });
      }
    }
  },
});

export const _listExpired = internalQuery({
  args: {
    table: v.union(
      v.literal("subscriptions"),
      v.literal("parseJobs"),
      v.literal("pendingParses"),
    ),
    now: v.number(),
    limit: v.number(),
  },
  handler: async (ctx, { table, now, limit }) => {
    const rows: Doc<"subscriptions" | "parseJobs" | "pendingParses">[] =
      await ctx.db
        .query(table)
        .withIndex("by_fileExpiresAt", (q) => q.lt("fileExpiresAt", now))
        .take(limit);
    return rows
      .filter((r) => r.fileExpiresAt !== undefined)
      .map((r) => ({ rowId: r._id, fileId: r.fileId }));
  },
});

export const _clearFileFields = internalMutation({
  args: {
    table: v.union(
      v.literal("subscriptions"),
      v.literal("parseJobs"),
      v.literal("pendingParses"),
    ),
    rowId: v.union(
      v.id("subscriptions"),
      v.id("parseJobs"),
      v.id("pendingParses"),
    ),
  },
  handler: async (ctx, { rowId }) => {
    const row = await ctx.db.get(rowId);
    if (!row) return;
    await ctx.db.patch(rowId, {
      fileId: undefined,
      fileExpiresAt: undefined,
    });
  },
});
