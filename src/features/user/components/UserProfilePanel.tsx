"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Button, Field, Notice, Surface, TextInput } from "@/components";
import { apiRequest } from "@/services/api/client";
import type { AccountPasswordUpdateRead, AccountProfileUpdateRead } from "@/types/account";
import type { AuthenticatedUser } from "@/types/auth";

type Props = {
  user: AuthenticatedUser;
};

export function UserProfilePanel({ user }: Props) {
  const router = useRouter();
  const [isRedirecting, startRedirect] = useTransition();
  const [pseudo, setPseudo] = useState(user.pseudo);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const payload = await apiRequest<AccountProfileUpdateRead>("/api/account/me", {
        method: "PATCH",
        body: JSON.stringify({ pseudo }),
      });
      setPseudo(payload.user.pseudo);
      setSuccess("Pseudo updated.");
      router.refresh();
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "Unable to update pseudo");
    } finally {
      setSaving(false);
    }
  }

  async function handlePasswordSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setChangingPassword(true);
    setPasswordError(null);

    try {
      await apiRequest<AccountPasswordUpdateRead>("/api/account/password", {
        method: "PATCH",
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
        }),
      });
      startRedirect(() => {
        router.replace("/login?passwordChanged=1");
        router.refresh();
      });
    } catch (updateError) {
      setPasswordError(
        updateError instanceof Error ? updateError.message : "Unable to update password",
      );
    } finally {
      setChangingPassword(false);
    }
  }

  return (
    <Surface tone="soft" padding="lg" style={{ display: "grid", gap: "1rem" }}>
      <div>
        <p>Email: {user.email}</p>
        <p>Pseudo actuel: {pseudo}</p>
        <p>Role: {user.role}</p>
        <p>Created: {user.created_at}</p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: "grid", gap: "0.75rem", maxWidth: "24rem" }}>
        <Field label="Pseudo" htmlFor="profile-pseudo">
          <TextInput
            id="profile-pseudo"
            value={pseudo}
            onChange={(event) => setPseudo(event.target.value)}
            autoComplete="nickname"
            required
          />
        </Field>

        {error ? <Notice tone="danger">{error}</Notice> : null}
        {success ? <Notice tone="info">{success}</Notice> : null}

        <Button type="submit" variant="primary" disabled={saving}>
          {saving ? "Saving..." : "Update pseudo"}
        </Button>
      </form>

      <form
        onSubmit={handlePasswordSubmit}
        style={{ display: "grid", gap: "0.75rem", maxWidth: "24rem" }}
      >
        <Field label="Current password" htmlFor="current-password">
          <TextInput
            id="current-password"
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
            type="password"
            autoComplete="current-password"
            required
          />
        </Field>

        <Field label="New password" htmlFor="new-password">
          <TextInput
            id="new-password"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            type="password"
            autoComplete="new-password"
            minLength={8}
            required
          />
        </Field>

        {passwordError ? <Notice tone="danger">{passwordError}</Notice> : null}

        <Button type="submit" variant="primary" disabled={changingPassword || isRedirecting}>
          {changingPassword || isRedirecting ? "Updating..." : "Change password"}
        </Button>
      </form>
    </Surface>
  );
}
