import { v } from "convex/values";
import {
  internalAction,
  internalMutation,
  internalQuery,
} from "./_generated/server";
import { internal, components } from "./_generated/api";
import { Resend } from "@convex-dev/resend";
import { paginationOptsValidator } from "convex/server";
import { Id } from "./_generated/dataModel";
import { startOfTomorrowIstMs } from "./lib/dates";
import { dayBeforeAlert } from "./lib/emailTemplates";

export const resend: Resend = new Resend(components.resend, {
  testMode: false,
});

export const scanAndSend = internalAction({
  args: {},
  handler: async (ctx) => {
    const dayMs = startOfTomorrowIstMs(Date.now());

    let cursor: string | null = null;
    while (true) {
      const page: {
        page: { _id: Id<"users"> }[];
        isDone: boolean;
        continueCursor: string;
      } = await ctx.runQuery(internal.alerts._listUsers, {
        paginationOpts: { numItems: 100, cursor },
      });

      for (const user of page.page) {
        const due: Id<"subscriptions">[] = await ctx.runQuery(
          internal.alerts._findDueForUser,
          { userId: user._id, dayMs },
        );
        for (const subscriptionId of due) {
          await ctx.runMutation(internal.alerts._maybeSendOne, {
            userId: user._id,
            subscriptionId,
            dayMs,
          });
        }
      }

      if (page.isDone) break;
      cursor = page.continueCursor;
    }
  },
});

export const _listUsers = internalQuery({
  args: { paginationOpts: paginationOptsValidator },
  handler: async (ctx, { paginationOpts }) => {
    return await ctx.db.query("users").paginate(paginationOpts);
  },
});

export const _findDueForUser = internalQuery({
  args: { userId: v.id("users"), dayMs: v.number() },
  handler: async (ctx, { userId, dayMs }) => {
    const subs = await ctx.db
      .query("subscriptions")
      .withIndex("by_user_and_nextRenewal", (q) =>
        q.eq("userId", userId).eq("nextRenewal", dayMs),
      )
      .take(50);
    return subs.map((s) => s._id);
  },
});

export const _maybeSendOne = internalMutation({
  args: {
    userId: v.id("users"),
    subscriptionId: v.id("subscriptions"),
    dayMs: v.number(),
  },
  handler: async (ctx, { userId, subscriptionId, dayMs }) => {
    const existing = await ctx.db
      .query("alerts")
      .withIndex("by_subscription_and_type", (q) =>
        q.eq("subscriptionId", subscriptionId).eq("type", "day_before"),
      )
      .filter((q) => q.eq(q.field("forDayMs"), dayMs))
      .first();
    if (existing) return;

    const alertId = await ctx.db.insert("alerts", {
      userId,
      subscriptionId,
      type: "day_before",
      sentAt: Date.now(),
      forDayMs: dayMs,
    });

    await ctx.scheduler.runAfter(0, internal.alerts.sendEmail, { alertId });
  },
});

export const sendEmail = internalAction({
  args: { alertId: v.id("alerts") },
  handler: async (ctx, { alertId }) => {
    const data: {
      userEmail: string | null;
      sub: {
        vendor: string;
        amountInr: number;
        cycle: "monthly" | "quarterly" | "yearly" | "one_time";
        nextRenewal: number;
      } | null;
    } = await ctx.runQuery(internal.alerts._loadAlertContext, { alertId });

    if (!data.userEmail || !data.sub) return;

    const fromAddr = process.env.ALERTS_EMAIL_FROM;
    if (!fromAddr) {
      throw new Error("ALERTS_EMAIL_FROM is not set on Convex env.");
    }
    const dashboardUrl = process.env.SITE_URL
      ? `${process.env.SITE_URL.replace(/\/$/, "")}/dashboard`
      : "https://renewls-dev.vercel.app/dashboard";

    const tpl = dayBeforeAlert({ sub: data.sub, dashboardUrl });

    await resend.sendEmail(ctx, {
      from: fromAddr,
      to: data.userEmail,
      subject: tpl.subject,
      html: tpl.html,
      text: tpl.text,
    });
  },
});

export const _loadAlertContext = internalQuery({
  args: { alertId: v.id("alerts") },
  handler: async (ctx, { alertId }) => {
    const alert = await ctx.db.get(alertId);
    if (!alert) return { userEmail: null, sub: null };
    const user = await ctx.db.get(alert.userId);
    const sub = await ctx.db.get(alert.subscriptionId);
    if (!sub) return { userEmail: user?.email ?? null, sub: null };
    return {
      userEmail: user?.email ?? null,
      sub: {
        vendor: sub.vendor,
        amountInr: sub.amountInr,
        cycle: sub.cycle,
        nextRenewal: sub.nextRenewal,
      },
    };
  },
});
