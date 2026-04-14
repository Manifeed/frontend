"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button, Notice } from "@/components";

type LogoutErrorPayload = {
  message?: string;
  detail?: string;
};

async function parseLogoutError(response: Response): Promise<string> {
  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    try {
      const payload = (await response.json()) as LogoutErrorPayload;
      return payload.message ?? payload.detail ?? "Unable to sign out";
    } catch {
      return "Unable to sign out";
    }
  }

  try {
    const text = await response.text();
    return text || "Unable to sign out";
  } catch {
    return "Unable to sign out";
  }
}

export function LogoutButton() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isNavigating, startTransition] = useTransition();
  const isPending = isSubmitting || isNavigating;

  async function handleLogout() {
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "same-origin",
      });
      if (response.ok || response.status === 401 || response.status === 403) {
        startTransition(() => {
          router.replace("/login");
          router.refresh();
        });
        return;
      }
      setError(await parseLogoutError(response));
    } catch {
      setError("Unable to sign out");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div style={{ display: "grid", justifyItems: "end", gap: "0.5rem" }}>
      <Button variant="ghost" size="sm" type="button" onClick={handleLogout} disabled={isPending}>
        {isPending ? "Signing out..." : "Sign out"}
      </Button>
      {error ? <Notice tone="danger">{error}</Notice> : null}
    </div>
  );
}
