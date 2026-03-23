"use client";

import { useEffect, useState } from "react";

import { Button, Field, Notice, SelectInput, Surface, TextInput } from "@/components";
import { apiRequest } from "@/services/api/client";
import type { UserApiKeyCreateRead, UserApiKeyListRead } from "@/types/account";

import styles from "./UserApiKeysPanel.module.css";

type Props = {
  apiAccessEnabled: boolean;
};

export function UserApiKeysPanel({ apiAccessEnabled }: Props) {
  const [keys, setKeys] = useState<UserApiKeyListRead["items"]>([]);
  const [label, setLabel] = useState("");
  const [workerType, setWorkerType] = useState<"rss_scrapper" | "source_embedding">("rss_scrapper");
  const [error, setError] = useState<string | null>(null);
  const [createdSecret, setCreatedSecret] = useState<string | null>(null);

  async function loadKeys() {
    try {
      const payload = await apiRequest<UserApiKeyListRead>("/api/account/api-keys");
      setKeys(payload.items);
      setError(null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load API keys");
    }
  }

  useEffect(() => {
    void loadKeys();
  }, []);

  async function handleCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      const payload = await apiRequest<UserApiKeyCreateRead>("/api/account/api-keys", {
        method: "POST",
        body: JSON.stringify({ label, worker_type: workerType }),
      });
      setCreatedSecret(payload.api_key);
      setLabel("");
      await loadKeys();
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "Unable to create API key");
    }
  }

  async function handleRevoke(apiKeyId: number) {
    try {
      await apiRequest(`/api/account/api-keys/${apiKeyId}`, { method: "DELETE" });
      await loadKeys();
    } catch (revokeError) {
      setError(revokeError instanceof Error ? revokeError.message : "Unable to revoke API key");
    }
  }

  return (
    <section className={styles.panel}>
      {!apiAccessEnabled ? (
        <Notice tone="warning">
          API access is disabled on your account. An admin must enable it before you can create
          worker keys.
        </Notice>
      ) : null}

      {error ? <Notice tone="danger">{error}</Notice> : null}

      {createdSecret ? (
        <Surface tone="soft" padding="md">
          <p>Copy this API key now. It will only be shown once.</p>
          <p className={styles.secret}>{createdSecret}</p>
        </Surface>
      ) : null}

      <Surface tone="gradient" padding="md">
        <form className={styles.form} onSubmit={handleCreate}>
          <Field label="Label" htmlFor="api-key-label">
            <TextInput
              id="api-key-label"
              value={label}
              onChange={(event) => setLabel(event.target.value)}
              required
              disabled={!apiAccessEnabled}
            />
          </Field>
          <Field label="Worker type" htmlFor="api-key-worker-type">
            <SelectInput
              id="api-key-worker-type"
              value={workerType}
              onChange={(event) =>
                setWorkerType(event.target.value as "rss_scrapper" | "source_embedding")
              }
              disabled={!apiAccessEnabled}
            >
              <option value="rss_scrapper">RSS worker</option>
              <option value="source_embedding">Embedding worker</option>
            </SelectInput>
          </Field>
          <Button type="submit" variant="primary" disabled={!apiAccessEnabled}>
            Create API key
          </Button>
        </form>
      </Surface>

      <div className={styles.grid}>
        {keys.map((item) => (
          <Surface key={item.id} tone="soft" padding="md">
            <h3>{item.label}</h3>
            <p>Scope: {item.worker_type}</p>
            <p>Generated worker name: {item.worker_name}</p>
            <p>Prefix: {item.key_prefix}</p>
            <p>Last used: {item.last_used_at ?? "never"}</p>
            <Button variant="ghost" onClick={() => void handleRevoke(item.id)}>
              Revoke
            </Button>
          </Surface>
        ))}
      </div>
    </section>
  );
}
