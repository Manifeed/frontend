"use client";

import { useEffect, useState } from "react";

import { Button, Notice, SelectInput, Surface, TextInput } from "@/components";
import { apiRequest } from "@/services/api/client";
import type { AdminUserListRead, AdminUserRead } from "@/types/admin";

export function AdminUsersPanel() {
  const [users, setUsers] = useState<AdminUserRead[]>([]);
  const [pseudoDrafts, setPseudoDrafts] = useState<Record<number, string>>({});
  const [error, setError] = useState<string | null>(null);

  async function loadUsers() {
    try {
      const payload = await apiRequest<AdminUserListRead>("/api/admin/admin/users");
      setUsers(payload.items);
      setPseudoDrafts(Object.fromEntries(payload.items.map((user) => [user.id, user.pseudo])));
      setError(null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load users");
    }
  }

  useEffect(() => {
    void loadUsers();
  }, []);

  async function patchUser(
    userId: number,
    payload: Partial<Pick<AdminUserRead, "pseudo" | "role" | "is_active" | "api_access_enabled">>,
  ) {
    try {
      await apiRequest(`/api/admin/admin/users/${userId}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
      await loadUsers();
    } catch (patchError) {
      setError(patchError instanceof Error ? patchError.message : "Unable to update user");
    }
  }

  return (
    <section style={{ display: "grid", gap: "1rem" }}>
      {error ? <Notice tone="danger">{error}</Notice> : null}
      {users.map((user) => (
        <Surface key={user.id} tone="soft" padding="md">
          <h3>{user.email}</h3>
          <p>Pseudo: {user.pseudo}</p>
          <p>Role: {user.role}</p>
          <p>Active: {user.is_active ? "yes" : "no"}</p>
          <p>API access: {user.api_access_enabled ? "enabled" : "disabled"}</p>
          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", alignItems: "center" }}>
            <TextInput
              value={pseudoDrafts[user.id] ?? ""}
              onChange={(event) =>
                setPseudoDrafts((current) => ({ ...current, [user.id]: event.target.value }))
              }
            />
            <Button
              variant="secondary"
              onClick={() =>
                void patchUser(user.id, { pseudo: pseudoDrafts[user.id] ?? user.pseudo })
              }
            >
              Save pseudo
            </Button>
          </div>
          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
            <SelectInput
              value={user.role}
              onChange={(event) =>
                void patchUser(user.id, { role: event.target.value as AdminUserRead["role"] })
              }
            >
              <option value="user">user</option>
              <option value="admin">admin</option>
            </SelectInput>
            <Button variant="secondary" onClick={() => void patchUser(user.id, { is_active: !user.is_active })}>
              {user.is_active ? "Disable" : "Enable"}
            </Button>
            <Button
              variant="ghost"
              onClick={() =>
                void patchUser(user.id, { api_access_enabled: !user.api_access_enabled })
              }
            >
              {user.api_access_enabled ? "Disable API" : "Enable API"}
            </Button>
          </div>
        </Surface>
      ))}
    </section>
  );
}
