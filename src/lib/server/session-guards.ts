import { notFound, redirect } from "next/navigation";

import { buildLoginHref, resolveDefaultHome } from "@/lib/auth/redirects";

import { getOptionalSession } from "./backend";

export async function redirectIfAuthenticated(): Promise<void> {
  const session = await getOptionalSession();
  if (session) {
    redirect(resolveDefaultHome(session.user.role));
  }
}

export async function requireSession(nextPath: string) {
  const session = await getOptionalSession();
  if (!session) {
    redirect(buildLoginHref(nextPath));
  }
  return session;
}

export async function requireAdminSession() {
  const session = await getOptionalSession();
  if (!session || session.user.role !== "admin") {
    notFound();
  }
  return session;
}

export async function requireApiEnabledSession(nextPath: string) {
  const session = await requireSession(nextPath);
  if (!session.user.api_access_enabled) {
    redirect("/");
  }
  return session;
}
