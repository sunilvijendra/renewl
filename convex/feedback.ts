import { v } from "convex/values";
import { action, internalQuery } from "./_generated/server";
import { internal } from "./_generated/api";
import { requireUser } from "./lib/auth";
import { resend } from "./alerts";

const FEEDBACK_TO = "renewl@sunilvijendra.com";

const TYPE_LABELS: Record<string, string> = {
  bug: "Bug",
  idea: "Idea",
  question: "Question",
  other: "Other",
};

export const submit = action({
  args: {
    name: v.optional(v.string()),
    type: v.union(
      v.literal("bug"),
      v.literal("idea"),
      v.literal("question"),
      v.literal("other"),
    ),
    feedback: v.string(),
    page: v.string(),
    userAgent: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);

    const userEmail: string | null = await ctx.runQuery(
      internal.feedback._loadUserEmail,
      { userId },
    );
    if (!userEmail) {
      throw new Error("Could not load your email address.");
    }

    const trimmedFeedback = args.feedback.trim();
    if (trimmedFeedback.length < 10) {
      throw new Error("Feedback must be at least 10 characters.");
    }
    if (trimmedFeedback.length > 5000) {
      throw new Error("Feedback is too long.");
    }

    const fromAddr = process.env.ALERTS_EMAIL_FROM;
    if (!fromAddr) {
      throw new Error("ALERTS_EMAIL_FROM is not set on Convex env.");
    }

    const typeLabel = TYPE_LABELS[args.type] ?? "Other";
    const trimmedName = args.name?.trim();
    const fromLabel = trimmedName ? `${trimmedName} (${userEmail})` : userEmail;
    const subject = `[Renewl ${typeLabel}] from ${trimmedName || userEmail}`;

    const text = [
      `Type: ${typeLabel}`,
      `From: ${fromLabel}`,
      `Page: ${args.page}`,
      `User-Agent: ${args.userAgent}`,
      "",
      trimmedFeedback,
    ].join("\n");

    const html = `<!doctype html>
<html><body style="margin:0;padding:0;background:#f6f3ec;">
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color:#f6f3ec; color:#0f1a16; padding:32px 24px; line-height:1.55;">
  <div style="max-width:560px; margin:0 auto; background-color:#ede8dc; border:1px solid rgba(15,26,22,0.16); border-radius:4px; padding:24px 28px;">
    <p style="font-size:13px;letter-spacing:0.18em;text-transform:uppercase;color:#5c6a62;margin:0 0 14px 0;">Renewl ${typeLabel}</p>
    <p style="margin:0 0 18px 0;font-size:18px;color:#0f1a16;"><strong>${escapeHtml(trimmedName || userEmail)}</strong></p>
    <p style="white-space:pre-wrap;font-size:15px;color:#0f1a16;line-height:1.55;margin:0;">${escapeHtml(trimmedFeedback)}</p>
    <hr style="border:0;border-top:1px solid rgba(15,26,22,0.16);margin:28px 0 16px 0;" />
    <p style="margin:0;font-size:12px;color:#5c6a62;">From: ${escapeHtml(userEmail)}</p>
    <p style="margin:4px 0 0 0;font-size:12px;color:#5c6a62;">Page: <code style="font-family:ui-monospace,monospace;">${escapeHtml(args.page)}</code></p>
    <p style="margin:4px 0 0 0;font-size:12px;color:#5c6a62;">UA: <code style="font-family:ui-monospace,monospace;">${escapeHtml(args.userAgent)}</code></p>
  </div>
</div>
</body></html>`;

    await resend.sendEmail(ctx, {
      from: fromAddr,
      to: FEEDBACK_TO,
      subject,
      html,
      text,
      replyTo: [userEmail],
    });

    return { ok: true } as const;
  },
});

export const _loadUserEmail = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const user = await ctx.db.get(userId);
    return user?.email ?? null;
  },
});

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
