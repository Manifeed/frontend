"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { Button, Field, Notice, Surface, TextInput } from "@/components";
import { ApiRequestError, apiRequest } from "@/services/api/client";
import type { AuthLoginRead } from "@/types/auth";

import styles from "./AuthFormCard.module.css";

type AuthFormCardProps = {
  title: string;
  description: string;
  submitLabel: string;
  mode: "login" | "signup";
  alternativeHref: string;
  alternativeLabel: string;
  showPseudo?: boolean;
  nextPath?: string | null;
};

function resolveRedirectTarget(nextValue: string | null, role: "user" | "admin"): string {
  if (nextValue && nextValue.startsWith("/")) {
    return nextValue;
  }
  return role === "admin" ? "/admin" : "/app";
}

function SubmitButton({ label, pending }: { label: string; pending: boolean }) {
  return (
    <Button type="submit" variant="primary" fullWidth disabled={pending}>
      {pending ? "Working..." : label}
    </Button>
  );
}

export function AuthFormCard({
  title,
  description,
  submitLabel,
  mode,
  alternativeHref,
  alternativeLabel,
  showPseudo = false,
  nextPath,
}: AuthFormCardProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");

    try {
      if (mode === "login") {
        const payload = await apiRequest<AuthLoginRead>("/api/auth/login", {
          method: "POST",
          body: JSON.stringify({ email, password }),
        });
        window.location.assign(resolveRedirectTarget(nextPath ?? null, payload.user.role));
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
      router.push("/login?registered=1");
      router.refresh();
    } catch (submitError) {
      if (submitError instanceof ApiRequestError) {
        setError(submitError.message);
      } else if (submitError instanceof Error) {
        setError(submitError.message);
      } else {
        setError(mode === "login" ? "Unable to sign in" : "Unable to create account");
      }
    } finally {
      setPending(false);
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
          <TextInput id="email" name="email" type="email" autoComplete="email" required />
        </Field>

        <Field label="Password" htmlFor="password">
          <TextInput
            id="password"
            name="password"
            type="password"
            autoComplete={submitLabel === "Create account" ? "new-password" : "current-password"}
            required
          />
        </Field>

        {error ? <Notice tone="danger">{error}</Notice> : null}

        <SubmitButton label={submitLabel} pending={pending} />

        <p className={styles.hint}>
          <Link href={alternativeHref}>{alternativeLabel}</Link>
        </p>
      </form>
    </Surface>
  );
}
