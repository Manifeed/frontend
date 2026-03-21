import { redirect } from "next/navigation";

import { getOptionalSession } from "./backend";

function resolveDefaultHome(role: "user" | "admin"): string {
  return role === "admin" ? "/admin" : "/app";
}

export async function redirectIfAuthenticated(): Promise<void> {
  const session = await getOptionalSession();
  if (session) {
    redirect(resolveDefaultHome(session.user.role));
  }
}

export async function requireSession() {
  const session = await getOptionalSession();
  if (!session) {
    redirect("/login");
  }
  return session;
}

export async function requireAdminSession() {
  const session = await requireSession();
  if (session.user.role !== "admin") {
    redirect("/app");
  }
  return session;
}

export async function redirectLegacyAdminRoute(targetPath: string): Promise<void> {
  const session = await getOptionalSession();
  if (!session) {
    redirect(`/login?next=${encodeURIComponent(targetPath)}`);
  }
  if (session.user.role !== "admin") {
    redirect("/app");
  }
  redirect(targetPath);
}
