"use client";

import { useEffect, useState } from "react";

import { Notice, Surface } from "@/components";
import { apiRequest } from "@/services/api/client";
import type { AccountWorkerListRead } from "@/types/account";

export function UserWorkersPanel() {
  const [items, setItems] = useState<AccountWorkerListRead["items"]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void apiRequest<AccountWorkerListRead>("/api/account/workers")
      .then((payload) => setItems(payload.items))
      .catch((loadError) =>
        setError(loadError instanceof Error ? loadError.message : "Unable to load workers"),
      );
  }, []);

  return (
    <section>
      {error ? <Notice tone="danger">{error}</Notice> : null}
      <div style={{ display: "grid", gap: "1rem" }}>
        {items.map((item) => (
          <Surface key={item.api_key_id} tone="soft" padding="md">
            <h3>{item.label}</h3>
            <p>Worker: {item.worker_name}</p>
            <p>Type: {item.worker_type}</p>
            <p>Connected: {item.connected ? "yes" : "no"}</p>
            <p>Active: {item.active ? "yes" : "no"}</p>
            <p>Pending tasks: {item.processing_tasks}</p>
            <p>Last error: {item.last_error ?? "none"}</p>
          </Surface>
        ))}
      </div>
    </section>
  );
}
