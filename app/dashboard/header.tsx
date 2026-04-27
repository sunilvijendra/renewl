"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useAuthActions } from "@convex-dev/auth/react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import Link from "next/link";
import { LogoPlain } from "../logo";
import { FeedbackModal } from "./_components/feedback-modal";

export function DashboardHeader() {
  const { signOut } = useAuthActions();
  const me = useQuery(api.users.me, {});
  const [pending, startTransition] = useTransition();
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuWrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setMenuOpen(false);
    }
    function onPointerDown(e: PointerEvent) {
      if (!menuWrapRef.current?.contains(e.target as Node)) setMenuOpen(false);
    }
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onPointerDown);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onPointerDown);
    };
  }, [menuOpen]);

  function handleSignOut() {
    if (pending) return;
    setMenuOpen(false);
    startTransition(async () => {
      try {
        await signOut();
      } catch {
        // fall through to the redirect either way — clears local state
      }
      window.location.assign("/");
    });
  }

  function handleFeedbackClick() {
    setMenuOpen(false);
    setFeedbackOpen(true);
  }

  return (
    <header className="mx-auto w-full max-w-[720px] flex items-center justify-between pb-6 border-b border-hairline">
      <Link
        href="/dashboard"
        className="flex items-baseline gap-2.5 text-ink hover:text-accent transition-colors"
      >
        <LogoPlain />
        <span className="font-sans text-[10px] uppercase tracking-[0.18em] text-ink-soft border border-hairline-strong px-1.5 py-0.5 rounded-sm leading-none">
          Beta
        </span>
      </Link>

      <div ref={menuWrapRef} className="relative">
        <button
          type="button"
          onClick={() => setMenuOpen((o) => !o)}
          aria-expanded={menuOpen}
          aria-haspopup="menu"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          className="p-2 -mr-2 text-ink-soft hover:text-accent transition-colors"
        >
          <HamburgerIcon />
        </button>

        {menuOpen && (
          <div
            role="menu"
            className="absolute right-0 top-full mt-2 w-64 bg-paper border border-hairline-strong rounded-sm shadow-lg z-20 overflow-hidden"
          >
            {me?.email && (
              <div className="px-4 py-3 border-b border-hairline">
                <p className="font-sans text-[11px] uppercase tracking-[0.14em] text-ink-soft mb-1">
                  Signed in as
                </p>
                <p
                  className="font-sans text-[14px] text-ink truncate"
                  title={me.email}
                >
                  {me.email}
                </p>
              </div>
            )}
            <button
              type="button"
              role="menuitem"
              onClick={handleFeedbackClick}
              className="block w-full text-left px-4 py-3 font-sans text-[14px] text-ink hover:bg-paper-deep transition-colors"
            >
              Feedback
            </button>
            <button
              type="button"
              role="menuitem"
              onClick={handleSignOut}
              disabled={pending}
              className="block w-full text-left px-4 py-3 font-sans text-[14px] text-ink hover:bg-paper-deep transition-colors disabled:opacity-60"
            >
              {pending ? "Signing out…" : "Sign out"}
            </button>
          </div>
        )}
      </div>

      <FeedbackModal
        open={feedbackOpen}
        onClose={() => setFeedbackOpen(false)}
        userEmail={me?.email ?? null}
      />
    </header>
  );
}

function HamburgerIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 22 22"
      aria-hidden
      className="block"
    >
      <line
        x1="4"
        y1="7"
        x2="18"
        y2="7"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <line
        x1="4"
        y1="11"
        x2="18"
        y2="11"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <line
        x1="4"
        y1="15"
        x2="18"
        y2="15"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}
