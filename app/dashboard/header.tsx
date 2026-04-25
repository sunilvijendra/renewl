"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useAuthActions } from "@convex-dev/auth/react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import Link from "next/link";
import { LogoPlain } from "../logo";

export function DashboardHeader() {
  const router = useRouter();
  const { signOut } = useAuthActions();
  const me = useQuery(api.users.me, {});
  const [pending, startTransition] = useTransition();

  function handleSignOut() {
    if (pending) return;
    startTransition(async () => {
      await signOut();
      router.push("/sign-in");
    });
  }

  return (
    <header className="mx-auto w-full max-w-[720px] flex items-center justify-between pb-6 border-b border-hairline">
      <Link href="/dashboard" className="text-ink hover:text-accent transition-colors">
        <LogoPlain />
      </Link>
      <div className="flex items-center gap-4">
        {me?.email && (
          <span className="font-sans text-[13px] text-ink-soft">{me.email}</span>
        )}
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
