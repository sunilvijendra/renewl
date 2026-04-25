# Go-Live Prep

Operational checklist for taking Renewl from "MVP smoke-tested on `renewl-live.vercel.app` against dev Convex" to "live, production-backed, legacy waitlist project retired".

**Plan summary.** Keep the `renewl-live` Vercel project as the steady-state live deployment. Promote the `renewl-app` Convex project to a prod deployment and re-point `renewl-live` at it. Migrate the existing waitlist subscribers off `silent-albatross-349`, then retire the trio that powers the current waitlist: the `renewl` Vercel project, the `sunilvijendra/renewl-waitlist` GitHub repo, and the `silent-albatross-349` Convex deployment.

**Source of truth for what we're building:** `docs/scope.md`. This file is just the cutover plan.

**Topology today (post-split):**
- This repo (`sunilvijendra/renewl`) — `dev/mvp1` → Vercel `renewl-live` → Convex `kindly-quail-882` (MVP).
- `sunilvijendra/renewl-waitlist` — `main` → Vercel `renewl` → Convex `silent-albatross-349` (legacy waitlist).

---

## Open decisions — answer before executing

- [ ] **Q1.** When updating `renewl-live` Vercel env vars to point at prod Convex, overwrite **all three environments** (Production / Preview / Development), or keep Preview / Development pointing at `kindly-quail-882` for ongoing testing?
- [ ] **Q2.** Merge `dev/mvp1` → `main` and switch `renewl-live`'s production branch to `main`? Recommended yes — having a production branch literally named `dev/mvp1` is awkward forever.
- [ ] **Q3.** Existing waitlist data on `silent-albatross-349`: **(A)** one-shot invite blast email pointing them to `renewl-live.vercel.app`, **(B)** import into the new prod's `waitlist` table for archival, or **(C)** skip for now?

---

## Phase 1 — Prod infra (no user-facing change)

1. **Create the Convex prod deployment for `renewl-app`.** From the repo root: `npx convex deploy --prod`. First run creates the prod deployment alongside `kindly-quail-882`.

2. **Generate fresh JWT signing keys for prod** (don't reuse dev's):
   ```
   npx @convex-dev/auth --prod
   ```
   This sets `SITE_URL`, `JWT_PRIVATE_KEY`, `JWKS` on the prod deployment.

3. **Override `SITE_URL` to the live origin** (the auth helper defaults to `localhost:3000`):
   ```
   npx convex env set --prod SITE_URL https://renewl-live.vercel.app
   ```

4. **Copy the remaining five env vars from dev to prod, without echoing values:**
   ```
   for var in OPENAI_API_KEY AUTH_RESEND_KEY RESEND_API_KEY AUTH_EMAIL_FROM ALERTS_EMAIL_FROM; do
     npx convex env set --prod "$var" "$(npx convex env get "$var")"
   done
   ```

5. **Push schema + functions to prod** — `npx convex deploy --prod` (same command, second run pushes code now that env is in place).

6. **Sanity check:** `npx convex env list --prod` shows all eight expected vars; `npx convex run --prod alerts:scanAndSend '{}'` returns without error (no subs in prod yet, so it's a no-op but proves connectivity).

---

## Phase 2 — Switch `renewl-live` traffic to prod Convex

7. **Update Vercel env vars on `renewl-live`.** Get the prod deployment URLs first:
   ```
   npx convex env list --prod  # note CONVEX_CLOUD_URL / CONVEX_SITE_URL
   ```
   Then for `renewl-live`:
   ```
   vercel env rm NEXT_PUBLIC_CONVEX_URL production --yes
   echo "https://<prod>.convex.cloud" | vercel env add NEXT_PUBLIC_CONVEX_URL production
   vercel env rm NEXT_PUBLIC_CONVEX_SITE_URL production --yes
   echo "https://<prod>.convex.site" | vercel env add NEXT_PUBLIC_CONVEX_SITE_URL production
   ```
   Repeat for `preview` / `development` per **Q1** answer.

8. **Trigger a redeploy.** Env-var changes don't auto-redeploy on Vercel. Either push an empty commit (`git commit --allow-empty -m "redeploy: pick up new convex env"`) or click "Redeploy" on the latest deployment in the Vercel UI.

9. **Re-run the 9-step smoke test from `docs/implementation-plan-01.md` §End-to-end** against `renewl-live.vercel.app`. It's now backed by prod Convex; everything should still pass. Two specific things to retest given the prod cutover:
   - Sign-in: magic-link callback URL should be `renewl-live.vercel.app/...` (driven by prod `SITE_URL`).
   - Cron: from the **prod** Convex dashboard, manually invoke `internal.alerts.scanAndSend` to confirm the prod cron + Resend chain works.

---

## Phase 3 — Branch hygiene

*(Only if Q2 = yes.)*

10. **Merge `dev/mvp1` → `main`.** From local: `git checkout main && git merge dev/mvp1 --ff-only && git push origin main`. (No `--ff-only` if main has commits dev/mvp1 doesn't; in that case do a regular merge.)

11. **Switch `renewl-live`'s production branch to `main`.** Vercel dashboard → Project `renewl-live` → Settings → Git → Production Branch → change to `main`. Save.

12. **Optionally delete `dev/mvp1`** — `git push origin --delete dev/mvp1` and `git branch -d dev/mvp1`. Keep it around if you want a second-opinion record.

---

## Phase 4 — Waitlist migration + retire legacy

13. **Pull the waitlist data off `silent-albatross-349`.** From a clone or temporary worktree pointed at the legacy deployment:
    ```
    npx convex export --path /tmp/silent-albatross-export.zip
    ```
    or use the legacy deployment's dashboard → Data → `waitlist` → "Export".

14. **Per Q3:**
    - **(A)** Compose the launch email (from `alerts@<domain>`) and send to the exported list. Include a clear CTA to `renewl-live.vercel.app`. Use Resend batch send so you don't trip rate limits.
    - **(B)** `npx convex import --prod waitlist /tmp/waitlist.json` (after light reshape if the schemas don't match exactly).
    - **(C)** Skip for now; revisit when ready.

15. **Pause `renewl` Vercel project.** Vercel dashboard → `renewl` → Settings → Pause deployments. Don't delete yet — `renewls.vercel.app` URL stays alive for redirect/archive purposes.

16. **Optional but kind: 301 redirect `renewls.vercel.app` → `renewl-live.vercel.app`** so anyone with the old URL bookmarked lands on the new app. Add a `vercel.json` rewrite or a Routing Middleware on the paused project, then unpause briefly to apply.

17. **Archive the `renewl-waitlist` GitHub repo.** GitHub → repo Settings → "Archive this repository". Once archived, no more pushes will accidentally trigger deploys on the paused Vercel project. Don't delete — preserves the audit trail for the waitlist landing's history.

18. **Pause `silent-albatross-349` Convex deployment.** Convex dashboard → that deployment → Settings → Pause. Wait ~2 weeks in case anything's still pointed there, then it can be deleted.

---

## Phase 5 — (optional) custom domain

19. **Decide on the live URL.** `renewl-live.vercel.app` is fine for soft-launch. For real growth, point a custom domain (you already verified one in Resend — could reuse the apex or use `app.<domain>`).

20. **Add domain in Vercel.** Project `renewl-live` → Settings → Domains → Add. Vercel issues DNS records; add at registrar; wait for verification.

21. **Update prod Convex `SITE_URL` to the custom domain** so magic-link emails match:
    ```
    npx convex env set --prod SITE_URL https://<your-custom-domain>
    ```

22. **Update `app/layout.tsx` `metadataBase`** to the custom domain (so OG/social cards canonicalize there). Commit + push.

---

## Acceptance criteria

Cutover is done when:

- [ ] `renewl-live.vercel.app` (or custom domain) serves the MVP, backed by Convex prod
- [ ] Magic-link sign-in works end-to-end against prod
- [ ] Daily renewal-alert cron has run successfully at least once on prod (or has been manually invoked)
- [ ] 24h file cleanup cron has run on prod
- [ ] `silent-albatross-349` Convex is paused; `renewl` Vercel is paused; `sunilvijendra/renewl-waitlist` GitHub repo is archived
- [ ] Existing waitlist subscribers have been notified (per Q3)
- [ ] `docs/scope.md` §status is updated to reflect "live"
