"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";

import { getApiPayloadMessage, parseApiResponsePayload } from "@/services/api/response";
import type { AuthenticatedUser } from "@/types/auth";

import styles from "./AvatarMenu.module.css";

type AvatarMenuProps = {
  user: AuthenticatedUser;
};

async function parseLogoutError(response: Response): Promise<string> {
  try {
    const payload = await parseApiResponsePayload(response);
    return getApiPayloadMessage(payload, response.status) ?? "Unable to sign out";
  } catch {
    return "Unable to sign out";
  }
}

export function AvatarMenu({ user }: AvatarMenuProps) {
  const pathname = usePathname();
  const router = useRouter();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isNavigating, startTransition] = useTransition();
  const isPending = isSubmitting || isNavigating;
  const isAdminArea = pathname?.startsWith("/admin") ?? false;

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (rootRef.current?.contains(event.target as Node)) {
        return;
      }
      setIsOpen(false);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  async function handleLogout() {
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "same-origin",
      });
      if (response.ok || response.status === 401 || response.status === 403) {
        setIsOpen(false);
        startTransition(() => {
          router.replace("/");
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

  function handleMenuNavigation(href: string) {
    setError(null);
    setIsOpen(false);
    router.push(href);
  }

  return (
    <div className={styles.menuRoot} ref={rootRef}>
      <button
        type="button"
        className={styles.avatarButton}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-label="Open account menu"
        onClick={() => {
          setError(null);
          setIsOpen((current) => !current);
        }}
      >
        <img
          className={styles.avatarImage}
          src={`/pp/${user.pp_id}.webp`}
          alt={`${user.pseudo} avatar`}
          loading="lazy"
          decoding="async"
        />
      </button>

      {isOpen ? (
        <div className={styles.menuPanel} role="menu" aria-label="Account menu">
          <Link
            href="/profile"
            className={styles.menuAction}
            role="menuitem"
            onClick={() => setIsOpen(false)}
          >
            Profile
          </Link>

          {user.api_access_enabled ? (
            <Link
              href="/api-keys"
              className={styles.menuAction}
              role="menuitem"
              onClick={() => setIsOpen(false)}
            >
              API Keys
            </Link>
          ) : null}

          {user.api_access_enabled ? (
            <Link
              href="/workers"
              className={styles.menuAction}
              role="menuitem"
              onClick={() => setIsOpen(false)}
            >
              Workers
            </Link>
          ) : null}

          {user.role === "admin" ? (
            <button
              type="button"
              className={styles.menuAction}
              role="menuitem"
              onClick={() => handleMenuNavigation(isAdminArea ? "/" : "/admin")}
            >
              {isAdminArea ? "Switch to App" : "Switch to Admin"}
            </button>
          ) : null}

          <button
            type="button"
            className={`${styles.menuAction} ${styles.dangerAction}`}
            role="menuitem"
            disabled={isPending}
            onClick={() => void handleLogout()}
          >
            {isPending ? "Signing out..." : "Sign out"}
          </button>

          {error ? <p className={styles.error}>{error}</p> : null}
        </div>
      ) : null}
    </div>
  );
}
