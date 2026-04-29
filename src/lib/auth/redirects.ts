import type { UserRole } from "@/types/auth";

export function resolveDefaultHome(role: UserRole): string {
  void role;
  return "/";
}

export function normalizeNextPath(nextValue: string | null): string | null {
  if (!nextValue || !nextValue.startsWith("/") || nextValue.startsWith("//")) {
    return null;
  }

  if (nextValue.includes("\\") || /[\u0000-\u001f\u007f]/u.test(nextValue)) {
    return null;
  }

  try {
    const parsedUrl = new URL(nextValue, "https://manifeed.local");
    if (parsedUrl.origin !== "https://manifeed.local") {
      return null;
    }
    return `${parsedUrl.pathname}${parsedUrl.search}${parsedUrl.hash}`;
  } catch {
    return null;
  }
}

export function buildLoginHref(nextValue: string | null): string {
  const normalizedNext = normalizeNextPath(nextValue);
  if (!normalizedNext)
    return "/login";

  const searchParams = new URLSearchParams({ next: normalizedNext });
  return `/login?${searchParams.toString()}`;
}

export function resolveLoginRedirectTarget(nextValue: string | null, role: UserRole): string {
  const normalizedNext = normalizeNextPath(nextValue);
  if (normalizedNext)
    return normalizedNext;
  return resolveDefaultHome(role);
}
