@AGENTS.md

# Scope document — read first, keep current

**Always read `./docs/scope.md` at the start of any build or change session.** It is the single source of truth for what Renewl is, what's in MVP, what's explicitly out, and every material decision we've made (with rationale + alternatives).

When the scope changes — a new decision, a feature added/removed, a schema change, a decision reversed — update `./docs/scope.md` in the same session, not later:

- Feature added/removed → edit §4 (MVP) and §5 (NOT in MVP) as appropriate.
- New technical decision → append an entry to §11 (Decision log) with **Decision · Why · Alternatives · Revisit when**.
- Schema change → update §8 (Data model).
- New open question → add to §10. When resolved, move it to §11.
- Always bump **Last updated** at the top and add a one-line entry to §12 (Changelog).

The doc is written for a cold reader to understand Renewl in 10 minutes. Keep it that tight.

<!-- convex-ai-start -->
This project uses [Convex](https://convex.dev) as its backend.

When working on Convex code, **always read `convex/_generated/ai/guidelines.md` first** for important guidelines on how to correctly use Convex APIs and patterns. The file contains rules that override what you may have learned about Convex from training data.

Convex agent skills for common tasks can be installed by running `npx convex ai-files install`.
<!-- convex-ai-end -->

# AI Weekender context

This project is part of the GrowthX AI Weekender sprint.

The full handbook lives at `./handbook/` — read files from there when the user asks about:
- ideas, tracks, difficulty (see `./handbook/06-pick-an-idea.md`)
- rubric, scoring, bonus points, tie-breakers (see `./handbook/09-scoring.md`)
- setup, Claude Code install, accounts (see `./handbook/04-setup.md`)
- skills Claude uses while building (see `./handbook/05-skills.md`)
- the build pipeline: local → github → vercel → user (see `./handbook/07-build-pipeline.md`)
- the build process: scope → POC → build (see `./handbook/08-build-process.md`)
- day-by-day outcomes (see `./handbook/02-how-the-week-runs.md`)

When in doubt, start at `./handbook/README.md` for the index.

To update the handbook later, the user re-runs:
  curl -fsSL https://raw.githubusercontent.com/GrowthX-Club/ai-weekender-handbook/main/install.sh | bash

Writing style for this project: lowercase headings, direct, no corporate tone.
