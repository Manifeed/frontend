"use client";

import Link from "next/link";
import { useFormState, useFormStatus } from "react-dom";

import { Button, Field, Notice, Surface, TextInput } from "@/components";

import styles from "./AuthFormCard.module.css";

type AuthFormState = {
  error: string | null;
};

type AuthFormCardProps = {
  title: string;
  description: string;
  submitLabel: string;
  action: (state: AuthFormState, formData: FormData) => Promise<AuthFormState>;
  alternativeHref: string;
  alternativeLabel: string;
  showPseudo?: boolean;
  nextPath?: string | null;
};

const INITIAL_STATE: AuthFormState = { error: null };

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
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
  action,
  alternativeHref,
  alternativeLabel,
  showPseudo = false,
  nextPath,
}: AuthFormCardProps) {
  const [state, formAction] = useFormState(action, INITIAL_STATE);

  return (
    <Surface className={styles.panel} tone="gradient" padding="lg">
      <form action={formAction} className={styles.stack}>
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

        {state.error ? <Notice tone="danger">{state.error}</Notice> : null}

        <SubmitButton label={submitLabel} />

        <p className={styles.hint}>
          <Link href={alternativeHref}>{alternativeLabel}</Link>
        </p>
      </form>
    </Surface>
  );
}
