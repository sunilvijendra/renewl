"use client";

import { useTransition } from "react";
import { useAuthActions } from "@convex-dev/auth/react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import Link from "next/link";
import { LogoPlain } from "../logo";

export function DashboardHeader() {
  const { signOut } = useAuthActions();
  const me = useQuery(api.users.me, {});
  const [pending, startTransition] = useTransition();

  function handleSignOut() {
    if (pending) return;
    startTransition(async () => {
      try {
        await signOut();
      } catch {
        // fall through to the redirect either way — clears local state
      }
      // full browser navigation so the dashboard's convex queries can't
      // throw "not signed in" mid-soft-navigation and surface as a
      // "this page couldn't load" error.
      window.location.assign("/");
    });
  }

  return (
    <header className="mx-auto w-full max-w-[720px] flex items-center justify-between pb-6 border-b border-hairline">
      <Link href="/dashboard" className="flex items-baseline gap-2.5 text-ink hover:text-accent transition-colors">
        <LogoPlain />
        <span className="font-sans text-[10px] uppercase tracking-[0.18em] text-ink-soft border border-hairline-strong px-1.5 py-0.5 rounded-sm leading-none">
          Beta
        </span>
      </Link>
      <div className="flex items-center gap-4">
        {me?.email && (
          <span className="font-sans text-[13px] text-ink-soft">{me.email}</span>
        )}
        <a
          href="mailto:renewl@sunilvijendra.com?subject=Renewl%20Beta%20feedback"
          className="font-sans text-[13px] text-ink-soft hover:text-accent transition-colors"
        >
          Feedback
        </a>
        <button
          type="button"
          onClick={handleSignOut}
          disabled={pending}
          className="font-sans text-[13px] text-ink-soft hover:text-accent transition-colors disabled:opacity-60"
        >
          {pending ? "Signing out…" : "Sign out"}
        </button>
      </div>
    </header>
  );
}
