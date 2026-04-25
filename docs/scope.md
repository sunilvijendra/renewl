# Renewl — Scope Document


> Single source of truth for what Renewl is, who it's for, and what we've decided.
> Read top-to-bottom in ~10 minutes. Update any time a decision changes.

**Last updated:** 2026-04-25
**Status:** MVP code complete on `dev/mvp1` (auth, ingestion, parser, dashboard, replace flow, alerts cron, file cleanup cron). Pending: domain verification + Convex env vars before end-to-end smoke test on the deployed dev URL.
**Live URL:** https://renewls.vercel.app
**Dev URL:** https://renewls-dev.vercel.app (deploys from `dev/mvp1`, reads from Convex project `renewl-app` / deployment `kindly-quail-882`)

---

## 1. One-liner

Renewl helps urban Indian consumers see every subscription, warranty, and auto-renewal they're paying for — by parsing receipts they upload or paste — so they know what's charging them before it charges them.

## 2. Who it's for

- Urban Indian professionals with **8–15 active subscriptions** across OTT, AI tools, commerce memberships, cloud storage, insurance, and EMIs
- People who have found a surprise charge on their statement in the last 90 days
- People who use Gmail as their primary inbox for receipts
- Not for: enterprise finance teams, non-Indian markets (INR-only MVP), users tracking business expenses

## 3. Value proposition

> "Every recurring charge. One dashboard."

Indian consumers auto-pay dozens of small recurring amounts that individually feel negligible but aggregate to meaningful monthly spend. There is no neutral place to see them all. Renewl collapses the tracking job into: *forward / upload / paste the receipt, and we handle the rest* — then emails you the morning before anything charges.

## 4. What we're building (MVP)

- **Max 10 tracked line items per user.**
- **Ingestion — two channels in dashboard:**
  - Upload PDF or image of a receipt
  - Paste receipt text into a box
- **Parser — OpenAI `gpt-4o-mini` via Vercel AI SDK** with structured output. AI SDK chosen specifically so we can swap the underlying model (Anthropic, Gemini, etc.) without rewriting the parser.
- **Extraction schema:**
  ```ts
  {
    vendor: string,                  // "Netflix Premium"
    amount_inr: number,              // 649
    cycle: "monthly" | "quarterly" | "yearly" | "one_time",
    next_renewal: string,            // ISO date
    category: <fixed enum, see §8>,
    is_subscription: boolean,
    confidence: number               // 0.0–1.0
  }
  ```
- **Parse UX:** user sees the parsed card, can edit any field, confirms → lands in tracker. If `is_subscription === false` or `confidence < 0.6`, card shows "Looks one-time — add anyway?" to prevent polluting the tracker with food orders / one-off purchases.
- **Manual entry** as fallback, using the same schema fields. Used for items without a receipt (gym, cash insurance premium, handshake recurring).
- **At 10-item cap:** new parses land in a **pending queue**. User picks which existing item to replace. No data loss, no hard block.
- **Auth — magic-link email** via Convex Auth, sent through Resend. No password, no OAuth.
- **Alerts — email only, day before renewal at 08:00 IST.** Daily Convex cron scans `next_renewal == today + 1` and emails the user.
- **File retention — 24 hours.** Uploaded PDF/image is deleted from Convex file storage 24h after successful parse. Extracted JSON is retained.

## 5. Explicitly NOT in MVP

Things we chose to leave out *on purpose*. If a decision flips, move it to §4 and log it in §11.

- Email forwarding ingestion (unique forward addresses, inbound email webhooks)
- Gmail OAuth / inbox scan
- Bank / UPI statement import
- SMS, WhatsApp, or push notifications
- Cancellation assist
- Weekly or monthly digest emails
- Spend analytics, category breakdowns beyond the list view
- More than 10 line items per user
- Currencies other than INR
- Paid tier / team plans / sharing
- A mobile app

## 6. Near-term roadmap (post-MVP)

Loose, ordered by likelihood / value:

- **v1.1** Weekly digest email (`₹X renewing this week`)
- **v1.2** Email-forwarding ingestion (unique address per user)
- **v1.3** Remove 10-item cap → freemium tier
- **v2**   Gmail OAuth, UPI statement parser, cancellation flows

## 7. Architecture snapshot

```
[browser]
  ├─ Next.js 16 App Router (Vercel)
  ├─ Tailwind v4, Instrument Serif + Geist Sans
  │
  └─ ConvexReactClient
        ↕
[Convex backend — project: renewl]
  ├─ Queries + mutations (typed, realtime-subscribed to UI)
  ├─ Actions (for external API calls)
  │     └─ Vercel AI SDK → @ai-sdk/openai → gpt-4o-mini
  ├─ File storage (uploaded receipts, 24h TTL via scheduled cleanup)
  ├─ Scheduled functions (daily 08:00 IST renewal alert cron)
  └─ Convex Auth (magic-link email)
        ↕
[Resend]
  ├─ Magic-link sign-in emails
  └─ Day-before renewal alert emails
```

## 8. Data model

Current (as of 2026-04-24, waitlist landing only):

| Table | Fields | Notes |
|---|---|---|
| `waitlist` | `email`, `createdAt`, `source` | Index: `by_email`. Populated by the live landing page. |

Planned (MVP) — written to `convex/schema.ts` on 2026-04-25:

| Table | Fields | Notes |
|---|---|---|
| `users` | `email` | **Placeholder** until Convex Auth is installed; will be replaced by `authTables.users`. Index: `by_email`. |
| `subscriptions` | `userId`, `vendor`, `category` (slug enum), `amountInr` (paise), `cycle` (enum), `nextRenewal` (ms, start-of-day IST), `confidence?`, `fileId?`, `updatedAt` | Index: `by_user`, `by_user_and_nextRenewal`. Cap 10 per user (enforced in mutation). `fileId` powers "view receipt" within the 24h retention window; goes dangling after cleanup. `_creationTime` covers `createdAt`. |
| `parseJobs` | `userId`, `fileId?`, `pastedText?`, `extracted?` (parser output, awaiting confirm), `status` ("queued" \| "running" \| "succeeded" \| "failed"), `attempts`, `lastError?` | Short-lived; deleted on user confirm or discard. Index: `by_user_and_status`. |
| `pendingParses` | `userId`, `extracted` (subscription-shaped), `fileId?`, `status` ("awaiting_review" \| "replaced" \| "discarded") | Triggered when user is at 10-item cap. `extracted` mirrors subscription field shape so a confirmed replace is a straight copy. Index: `by_user_and_status`. |
| `alerts` | `userId`, `subscriptionId`, `type` ("day_before"), `sentAt` | Dedup + audit. Index: `by_subscription_and_type`. |

**Storage units & encodings**
- `amountInr` is **paise as integer** (`64900` for ₹649) — avoids float drift on totals; UI converts at the edge.
- `nextRenewal` and `sentAt` are **ms timestamps**, with `nextRenewal` snapped to start-of-day in `Asia/Kolkata`. No per-user timezone is stored — all users are urban Indians per §2; cron and date math hard-code IST.
- `category` slugs: `streaming`, `ai_productivity`, `commerce_membership`, `music_audio`, `cloud_storage`, `news_reading`, `fitness_wellness`, `insurance`, `emis_loans`, `utilities_telecom`, `other`. UI maps slug → display label (see §9).
- `cycle` literals: `monthly`, `quarterly`, `yearly`, `one_time`.

## 9. Reference — fixed lists and constants

**Subscription categories** (user picks one per item; parser guesses one):

1. Streaming
2. AI & Productivity
3. Commerce membership
4. Music & audio
5. Cloud storage
6. News & reading
7. Fitness & wellness
8. Insurance
9. EMIs & loans
10. Utilities & telecom
11. Other

**Billing cycles:** `monthly`, `quarterly`, `yearly`, `one_time`

**Confidence threshold:** parses with `confidence < 0.6` are flagged as low-confidence and require explicit user confirmation.

**Alert timing:** 08:00 IST, the day before `nextRenewal`.

**Item cap:** 10 active subscriptions per user.

**File retention:** 24 hours after successful parse.

## 10. Open questions

- **Optional "essential" flag on each item?** — would let the discovery UX highlight non-essentials the user might forget. Parked for MVP unless the "find the ones you forgot" story feels weak without it.
- **Domain.** Currently on `renewls.vercel.app` (with an `s`) because `renewl.vercel.app` was taken. Decision on whether to buy `renewl.in` / `getrenewl.com` before public launch.
- **Prod vs dev Convex deployment.** Production is currently reading from the dev deployment (`silent-albatross-349`). Needs promotion to prod before any real user traffic.
- **Post-launch analytics.** None wired yet. Week-one question: do we install Plausible / PostHog / Vercel Analytics?
- **Delete-receipt UX.** 24h auto-delete is decided; do we also give users a "delete now" button? Probably yes, cheap to add.

## 11. Decision log

Append-only. Most recent first. Every material decision gets an entry. Format:
**Decision · Why · Alternatives considered · Revisit when**

### 2026-04-25 — Schema details locked (enums, units, references)
- **Decision:**
  - `vendor` (not `name`) for the merchant string.
  - `nextRenewal` stored as `v.number()` (ms timestamp, snapped to start-of-day IST), not ISO string.
  - `category` and `cycle` encoded as Convex `v.union(v.literal(...))`. Categories use slugs; UI maps slug → display label.
  - `amountInr` stored as **paise (integer)** to avoid float drift.
  - `confidence` carried onto `subscriptions` so dashboard can dim or flag low-confidence rows.
  - `fileId` stored directly on `subscriptions` (not via `parseJobs`, which is short-lived). After 24h cleanup the field goes dangling — UI hides "view receipt" when storage object is gone.
  - `parseJobs.extracted` (optional) holds parser output between parse and user confirm; deleted with the parseJob on confirm/discard.
  - `pendingParses.extracted` mirrors the subscription field shape so confirming a replacement is a straight copy.
  - `users` table is a placeholder pending Convex Auth installation; will be replaced by `authTables.users` then.
  - Drop explicit `createdAt` from new tables — rely on Convex `_creationTime`. (Existing `waitlist` keeps its `createdAt` field; not migrated.)
  - `essential` flag: deferred (still open in §10).
  - All users IST per §2 — no per-user TZ stored; cron and date math hard-code Asia/Kolkata.
- **Why:** Database-class defaults (paise, integer timestamps, enum unions) over UI conveniences. Schema is strict where it can be cheap.
- **Alternatives considered:** Display-string categories (uglier slug-key in UI), rupees as float (drift on totals), ISO date strings (heavier, less ergonomic for `by_user_and_nextRenewal` range queries), a third "draft" table for pre-confirm parses (`parseJobs.extracted` covers it).
- **Revisit when:** A category slug needs renaming (one-shot data migration), we expose multi-currency, or `_creationTime` proves insufficient for any audit need.

### 2026-04-25 — Dev environment isolation: `renewls-dev` Vercel + `renewl-app` Convex
- **Decision:** MVP build runs on a separate Vercel project (`renewls-dev`, prod branch `dev/mvp1`) reading from a separate Convex project (`renewl-app`, dev deployment `kindly-quail-882`). Live waitlist (`renewls` Vercel + `silent-albatross-349` Convex) stays untouched.
- **Why:** Lets us iterate on schema, mutations, and actions without risking the live waitlist mid-build.
- **Alternatives considered:** Vercel preview deploys on the existing `renewls` project (no domain stability, shares Convex), or sharing `silent-albatross-349` Convex (live waitlist breaks if a schema iteration is bad).
- **Revisit when:** MVP is ready to merge to `main`; at that point we promote `renewl-app` to a Convex prod deployment, repoint `renewls` Vercel to it, and retire `renewls-dev`.

### 2026-04-24 — Auth: magic-link email via Convex Auth
- **Decision:** Email magic-link sign-in. No password, no OAuth.
- **Why:** Email is already our only user channel (alerts are email). Lowest friction, uses the same Resend integration we're already wiring.
- **Alternatives:** Google OAuth (adds nothing for MVP since we're not reading Gmail), password auth (friction + security surface).
- **Revisit when:** We add Gmail OAuth for inbox scan (v2).

### 2026-04-24 — File retention: 24 hours
- **Decision:** Auto-delete uploaded receipts from Convex file storage 24h after successful parse.
- **Why:** Minimal privacy footprint; extracted JSON is all we need long-term; smaller storage bill.
- **Alternatives:** Indefinite retention (no MVP benefit), immediate deletion after parse (breaks retry on parse failure).
- **Revisit when:** Users ask to view the original receipt attached to an item.

### 2026-04-24 — At cap, new parses queue for replacement
- **Decision:** When user has 10 items and parses another, result goes to `pendingParses`. User picks which existing item to replace.
- **Why:** No data loss; user controls the tradeoff; avoids hard-block frustration.
- **Alternatives:** Hard block with "delete one first" error (worse UX), auto-upgrade to paid tier (no MVP tier exists).
- **Revisit when:** We remove the 10-item cap in v1.3.

### 2026-04-25 — Parser switched to OpenAI `gpt-4o-mini`
- **Decision:** Use OpenAI `gpt-4o-mini` via `@ai-sdk/openai` (provider-direct, not via AI Gateway). Supersedes the 2026-04-24 Claude Haiku 4.5 decision below.
- **Why:** User has existing OpenAI credits to apply against the parse cost. `gpt-4o-mini` matches what we need (vision for PDFs + images, structured output via Zod, ~1s latency, ~$0.15/1M input tokens), and the AI SDK abstracts the provider so the swap was a single import + model-string change in `convex/parser.ts`.
- **Alternatives considered:** `gpt-4o` (≈3× cost, marginal gain on receipts), o-series reasoning models (overkill, slow + expensive), keeping Claude Haiku 4.5 (no credits to apply).
- **Revisit when:** Indian-vendor parse accuracy drops below ~90% on a 100-receipt eval (consider `gpt-4o`), or OpenAI credits run out.

### 2026-04-24 — Parser: Claude Haiku via Vercel AI SDK *(superseded 2026-04-25)*
- **Decision:** Anthropic Claude Haiku 4.5 as the parser; called through Vercel AI SDK with a structured-output schema.
- **Why:** Cheap (~₹0.05/receipt), fast, strong structured-output. AI SDK's provider abstraction means we can swap to OpenAI / Gemini / Claude Sonnet with a one-line change.
- **Alternatives:** Rule-based parser (brittle for Indian vendors), OpenAI GPT-4o-mini (fine, but SDK abstracts this anyway), Vercel AI Gateway (viable for later; unnecessary layer for MVP).
- **Revisit when:** Parse accuracy is <90% on a 100-receipt eval, or cost per parse exceeds ₹0.20.

### 2026-04-24 — Email provider: Resend (outbound only)
- **Decision:** Resend for transactional email (magic links + renewal alerts).
- **Why:** Clean API, generous free tier (3k/month), fast to wire from Convex.
- **Alternatives:** Postmark (was on the table when we needed inbound; dropped with inbound removed from scope).
- **Revisit when:** We hit the free-tier limit, or deliverability to Indian domains shows issues.

### 2026-04-24 — Ingestion: upload + paste only (no email forwarding, no Gmail OAuth)
- **Decision:** MVP accepts PDF/image upload and pasted receipt text in the dashboard. No forward-to-email address, no Gmail OAuth scan.
- **Why:** No inbound email vendor, no Google verification wait, no webhook surface. Ships faster.
- **Alternatives:** Email forwarding with unique addresses (deferred to v1.2), Gmail OAuth (deferred to v2).
- **Revisit when:** Users tell us uploading is too high-friction; a meaningful fraction of receipts come via Gmail threads they don't want to open.

### 2026-04-24 — MVP cap: 10 line items per user
- **Decision:** Hard cap at 10 tracked items for MVP.
- **Why:** Keeps the mental model simple; forces the "what are you actually paying for?" moment; enables clean replacement UX; bounds parse cost.
- **Alternatives:** Unlimited (too open-ended for a week-one build), 5 (too few for the target user).
- **Revisit when:** Either the cap becomes the #1 user complaint, or we launch a paid tier.

### 2026-04-24 — Fixed category list (11 categories)
- **Decision:** Streaming · AI & Productivity · Commerce membership · Music & audio · Cloud storage · News & reading · Fitness & wellness · Insurance · EMIs & loans · Utilities & telecom · Other
- **Why:** Enough coverage for Indian consumer stack without decision fatigue at the add-item moment. Bounded list simplifies the parser's `category` enum.
- **Alternatives:** Free-text tags (messy, hard to query), larger list (fatigue).
- **Revisit when:** A category is used by <2% of users for >60 days (consolidate), or a missing category is requested repeatedly (add).

### 2026-04-24 — Waitlist landing live
- **Decision:** Shipped the waitlist landing at `renewls.vercel.app` on 2026-04-24. Email capture → Convex `waitlist` table.
- **Why:** Gate sign-ups while we build; validate the copy + positioning; buy ourselves a week to build without pressure.
- **Alternatives:** Ship the app directly (higher risk, no user buffer).
- **Revisit when:** MVP is ready to open to waitlist users.

## 12. Changelog

- **2026-04-25** — Swapped parser provider from `@ai-sdk/anthropic` (Claude Haiku 4.5) to `@ai-sdk/openai` (gpt-4o-mini) to use existing OpenAI credits. Code change is one-line in `convex/parser.ts`; env var on Convex is now `OPENAI_API_KEY` instead of `ANTHROPIC_API_KEY`.
- **2026-04-25** — Built the MVP end-to-end on `dev/mvp1`: Convex Auth magic-link sign-in via Resend, file upload + paste ingestion, Claude Haiku 4.5 parser (Vercel AI SDK v6, `@ai-sdk/anthropic`), parse-review card with cap-aware confirm/replace/discard, dashboard list with edit-in-place + delete + view-receipt, manual entry, daily 08:00 IST renewal-alert cron via `@convex-dev/resend` component, hourly 24h file cleanup cron. Schema swap: spread `authTables` (replacing the placeholder `users`), added `fileExpiresAt` + `by_fileExpiresAt` indexes on subscriptions/parseJobs/pendingParses. Build green; awaiting domain verification + Convex env vars (ANTHROPIC_API_KEY, AUTH_RESEND_KEY, RESEND_API_KEY, AUTH_EMAIL_FROM, ALERTS_EMAIL_FROM) before end-to-end smoke test.
- **2026-04-25** — Locked MVP schema and wrote `convex/schema.ts`. Set up `renewls-dev` Vercel project on `dev/mvp1` reading from new `renewl-app` Convex deployment so the live waitlist stays untouched during the build.
- **2026-04-24** — Initial scope doc created. Captures all decisions taken during the pre-build scoping session: MVP shape, parser + ingestion, auth, retention, item cap, category list. Waitlist landing is live; MVP build begins next.
