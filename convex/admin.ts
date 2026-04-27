import { internalQuery } from "./_generated/server";

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const SAFETY_TAKE = 1000;

/**
 * Beta-tier ad-hoc analytics. Run from the Convex dashboard:
 * Functions tab -> internal.admin.summary -> Run.
 *
 * Honors Convex guidelines: bounded `.take(1000)` instead of `.collect()`,
 * no `.filter()` antipatterns (filtering happens in JS over the small
 * Beta dataset, which is faster than adding indexes for one query).
 */
export const summary = internalQuery({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const weekAgo = now - WEEK_MS;

    const [users, subs, parseJobs, pendingParses, alerts] = await Promise.all([
      ctx.db.query("users").take(SAFETY_TAKE),
      ctx.db.query("subscriptions").take(SAFETY_TAKE),
      ctx.db.query("parseJobs").take(SAFETY_TAKE),
      ctx.db.query("pendingParses").take(SAFETY_TAKE),
      ctx.db.query("alerts").take(SAFETY_TAKE),
    ]);

    // ---- users ----
    const signupsLastWeek = users.filter(
      (u) => u._creationTime >= weekAgo,
    ).length;

    // ---- subs per user histogram ----
    const subsByUser: Record<string, number> = {};
    for (const s of subs) {
      const k = s.userId as unknown as string;
      subsByUser[k] = (subsByUser[k] ?? 0) + 1;
    }
    const histogram: Record<number, number> = {};
    for (const u of users) {
      const count = subsByUser[u._id as unknown as string] ?? 0;
      histogram[count] = (histogram[count] ?? 0) + 1;
    }

    // ---- ingestion breakdown ----
    const ingestion = { upload: 0, paste: 0, manual: 0, unknown: 0 };
    for (const s of subs) {
      const t = s.ingestionType;
      if (t === "upload") ingestion.upload++;
      else if (t === "paste") ingestion.paste++;
      else if (t === "manual") ingestion.manual++;
      else ingestion.unknown++;
    }

    // ---- pending parses awaiting review ----
    const pendingAwaitingReview = pendingParses.filter(
      (p) => p.status === "awaiting_review",
    ).length;
    const pendingReplaced = pendingParses.filter(
      (p) => p.status === "replaced",
    ).length;
    const pendingDiscarded = pendingParses.filter(
      (p) => p.status === "discarded",
    ).length;

    // ---- parse jobs by status ----
    const parseJobsByStatus: Record<string, number> = {
      queued: 0,
      running: 0,
      succeeded: 0,
      failed: 0,
    };
    for (const j of parseJobs) {
      parseJobsByStatus[j.status] = (parseJobsByStatus[j.status] ?? 0) + 1;
    }

    // ---- alerts ----
    const alertsLastWeek = alerts.filter(
      (a) => a._creationTime >= weekAgo,
    ).length;

    return {
      generatedAt: now,
      users: {
        total: users.length,
        signupsLastWeek,
      },
      subscriptions: {
        total: subs.length,
        avgPerUser: users.length
          ? Math.round((subs.length / users.length) * 100) / 100
          : 0,
        histogram, // { 0: N, 1: N, 2: N, ... } — N = users with that many subs
      },
      ingestion, // { upload, paste, manual, unknown }
      pendingParses: {
        awaitingReview: pendingAwaitingReview,
        replaced: pendingReplaced,
        discarded: pendingDiscarded,
        total: pendingParses.length,
      },
      parseJobs: parseJobsByStatus,
      alerts: {
        total: alerts.length,
        lastWeek: alertsLastWeek,
      },
    };
  },
});

/**
 * Per-user breakdown — heavier output, useful when investigating a
 * specific user's behavior. Returns one row per user.
 */
export const perUser = internalQuery({
  args: {},
  handler: async (ctx) => {
    const [users, subs, pendingParses] = await Promise.all([
      ctx.db.query("users").take(SAFETY_TAKE),
      ctx.db.query("subscriptions").take(SAFETY_TAKE),
      ctx.db.query("pendingParses").take(SAFETY_TAKE),
    ]);

    const subsByUser: Record<string, typeof subs> = {};
    for (const s of subs) {
      const k = s.userId as unknown as string;
      (subsByUser[k] ??= []).push(s);
    }

    const pendingByUser: Record<string, number> = {};
    for (const p of pendingParses) {
      if (p.status !== "awaiting_review") continue;
      const k = p.userId as unknown as string;
      pendingByUser[k] = (pendingByUser[k] ?? 0) + 1;
    }

    return users.map((u) => {
      const k = u._id as unknown as string;
      const userSubs = subsByUser[k] ?? [];
      const ingestionCounts = { upload: 0, paste: 0, manual: 0, unknown: 0 };
      for (const s of userSubs) {
        const t = s.ingestionType;
        if (t === "upload") ingestionCounts.upload++;
        else if (t === "paste") ingestionCounts.paste++;
        else if (t === "manual") ingestionCounts.manual++;
        else ingestionCounts.unknown++;
      }
      return {
        userId: u._id,
        email: u.email,
        signedUpAt: u._creationTime,
        subscriptionCount: userSubs.length,
        ingestionCounts,
        pendingAwaitingReview: pendingByUser[k] ?? 0,
      };
    });
  },
});
