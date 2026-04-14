import type { UserRole } from "@/types/auth";

export function resolveDefaultHome(role: UserRole): string {
  return role === "admin" ? "/admin" : "/profile";
}

export function normalizeNextPath(nextValue: string | null): string | null {
  if (nextValue && nextValue.startsWith("/")) {
    return nextValue;
  }
  return null;
}

export function buildLoginHref(nextValue: string | null): string {
  const normalizedNext = normalizeNextPath(nextValue);
  if (!normalizedNext) {
    return "/login";
  }

  const searchParams = new URLSearchParams({ next: normalizedNext });
  return `/login?${searchParams.toString()}`;
}

export function resolveLoginRedirectTarget(nextValue: string | null, role: UserRole): string {
  const normalizedNext = normalizeNextPath(nextValue);
  if (normalizedNext) {
    return normalizedNext;
  }
  return resolveDefaultHome(role);
}
