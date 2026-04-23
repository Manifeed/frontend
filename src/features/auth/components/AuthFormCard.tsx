"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button, Field, Notice, Surface, TextInput } from "@/components";
import { resolveLoginRedirectTarget } from "@/lib/auth/redirects";
import { apiRequest } from "@/services/api/client";
import type { AuthLoginRead } from "@/types/auth";

import styles from "./AuthFormCard.module.css";

type AuthFormCardProps = {
  mode: "login" | "signup";
  title: string;
  description?: string | null;
  submitLabel: string;
  alternativeHref: string;
  alternativeLabel: string;
  showPseudo?: boolean;
  nextPath?: string | null;
};

export function AuthFormCard({
  mode,
  title,
  description,
  submitLabel,
  alternativeHref,
  alternativeLabel,
  showPseudo = false,
  nextPath,
}: AuthFormCardProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isNavigating, startTransition] = useTransition();
  const isPending = isSubmitting || isNavigating;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");

    try {
      if (mode === "login") {
        const payload = await apiRequest<AuthLoginRead>("/api/auth/login", {
          method: "POST",
          body: JSON.stringify({ email, password }),
        });
        startTransition(() => {
          router.replace(resolveLoginRedirectTarget(nextPath ?? null, payload.user.role));
          router.refresh();
        });
        return;
      }

      await apiRequest("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({
          pseudo: String(formData.get("pseudo") ?? ""),
          email,
          password,
        }),
      });
      startTransition(() => {
        router.replace("/login?registered=1");
        router.refresh();
      });
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to submit form");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Surface className={styles.panel} tone="gradient" padding="lg">
      <form onSubmit={handleSubmit} className={styles.stack}>
        <div className={styles.stack}>
          <h1 className={styles.title}>{title}</h1>
          <p className={styles.description}>{description}</p>
        </div>

        {nextPath ? <input type="hidden" name="next" value={nextPath} /> : null}

        {showPseudo ? (
          <Field label="Pseudo" htmlFor="pseudo">
            <TextInput id="pseudo" name="pseudo" autoComplete="nickname" required />
          </Field>
        ) : null}

        <Field label="Email" htmlFor="email">
          <TextInput
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            disabled={isPending}
          />
        </Field>

        <Field label="Password" htmlFor="password">
          <TextInput
            id="password"
            name="password"
            type="password"
            autoComplete={submitLabel === "Create account" ? "new-password" : "current-password"}
            required
            disabled={isPending}
          />
        </Field>

        {error ? <Notice tone="danger">{error}</Notice> : null}

        <Button type="submit" variant="primary" fullWidth disabled={isPending}>
          {isPending ? "Working..." : submitLabel}
        </Button>

        <p className={styles.hint}>
          <Link href={alternativeHref}>{alternativeLabel}</Link>
        </p>
      </form>
    </Surface>
  );
}
