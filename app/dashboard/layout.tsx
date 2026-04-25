import { redirect } from "next/navigation";
import { isAuthenticatedNextjs } from "@convex-dev/auth/nextjs/server";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const isAuthed = await isAuthenticatedNextjs();
  if (!isAuthed) {
    redirect("/sign-in");
  }

  return <>{children}</>;
}
