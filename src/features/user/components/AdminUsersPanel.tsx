"use client";

import { useEffect, useState } from "react";

import { Button, EmptyState, Field, Notice, SelectInput, Surface } from "@/components";
import { apiRequest } from "@/services/api/client";
import type {
  AdminUserFilters,
  AdminUserListRead,
  AdminUserPatchPayload,
  AdminUserRead,
} from "@/types/admin";

const DEFAULT_FILTERS: AdminUserFilters = {
  role: "all",
  is_active: "all",
  api_access_enabled: "all",
};

function buildUsersQuery(filters: AdminUserFilters): string {
  const query = new URLSearchParams();

  if (filters.role !== "all") {
    query.set("role", filters.role);
  }
  if (filters.is_active !== "all") {
    query.set("is_active", filters.is_active === "active" ? "true" : "false");
  }
  if (filters.api_access_enabled !== "all") {
    query.set("api_access_enabled", filters.api_access_enabled === "enabled" ? "true" : "false");
  }

  const queryString = query.toString();
  return queryString.length > 0 ? `?${queryString}` : "";
}

export function AdminUsersPanel() {
  const [users, setUsers] = useState<AdminUserRead[]>([]);
  const [filters, setFilters] = useState<AdminUserFilters>(DEFAULT_FILTERS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadUsers(activeFilters: AdminUserFilters) {
    setLoading(true);

    try {
      const payload = await apiRequest<AdminUserListRead>(
        `/api/admin/users${buildUsersQuery(activeFilters)}`,
      );
      setUsers(payload.items);
      setError(null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load users");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadUsers(filters);
  }, [filters]);

  async function patchUser(userId: number, payload: AdminUserPatchPayload) {
    try {
      await apiRequest(`/api/admin/users/${userId}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
      await loadUsers(filters);
    } catch (patchError) {
      setError(patchError instanceof Error ? patchError.message : "Unable to update user");
    }
  }

  function updateFilter<K extends keyof AdminUserFilters>(key: K, value: AdminUserFilters[K]) {
    setFilters((current) => ({ ...current, [key]: value }));
  }

  return (
    <section style={{ display: "grid", gap: "1rem" }}>
      {error ? <Notice tone="danger">{error}</Notice> : null}
      <Surface tone="soft" padding="md" style={{ display: "grid", gap: "0.75rem" }}>
        <div
          style={{
            display: "grid",
            gap: "0.75rem",
            gridTemplateColumns: "repeat(auto-fit, minmax(12rem, 1fr))",
            alignItems: "end",
          }}
        >
          <Field label="Filter by role" htmlFor="admin-users-role-filter">
            <SelectInput
              id="admin-users-role-filter"
              value={filters.role}
              onChange={(event) => updateFilter("role", event.target.value as AdminUserFilters["role"])}
              disabled={loading}
            >
              <option value="all">All roles</option>
              <option value="user">user</option>
              <option value="admin">admin</option>
            </SelectInput>
          </Field>
          <Field label="Filter by activity" htmlFor="admin-users-active-filter">
            <SelectInput
              id="admin-users-active-filter"
              value={filters.is_active}
              onChange={(event) =>
                updateFilter("is_active", event.target.value as AdminUserFilters["is_active"])
              }
              disabled={loading}
            >
              <option value="all">All statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </SelectInput>
          </Field>
          <Field label="Filter by API access" htmlFor="admin-users-api-filter">
            <SelectInput
              id="admin-users-api-filter"
              value={filters.api_access_enabled}
              onChange={(event) =>
                updateFilter(
                  "api_access_enabled",
                  event.target.value as AdminUserFilters["api_access_enabled"],
                )
              }
              disabled={loading}
            >
              <option value="all">All API access</option>
              <option value="enabled">Enabled</option>
              <option value="disabled">Disabled</option>
            </SelectInput>
          </Field>
        </div>
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", flexWrap: "wrap" }}>
          <Button variant="secondary" onClick={() => setFilters(DEFAULT_FILTERS)} disabled={loading}>
            Clear filters
          </Button>
          <span>{loading ? "Loading users..." : `${users.length} visible`}</span>
        </div>
      </Surface>

      {!loading && users.length === 0 ? (
        <EmptyState
          title="No users match these filters"
          description="Adjust the role, activity, or API access filters to broaden the list."
        />
      ) : null}

      {users.map((user) => (
        <Surface key={user.id} tone="soft" padding="md">
          <h3>{user.email}</h3>
          <p>Pseudo: {user.pseudo}</p>
          <p>Role: {user.role}</p>
          <p>Active: {user.is_active ? "yes" : "no"}</p>
          <p>API access: {user.api_access_enabled ? "enabled" : "disabled"}</p>
          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
            <Button
              variant="secondary"
              onClick={() => void patchUser(user.id, { is_active: !user.is_active })}
              disabled={loading}
            >
              {user.is_active ? "Disable" : "Enable"}
            </Button>
            <Button
              variant="ghost"
              onClick={() => void patchUser(user.id, { api_access_enabled: !user.api_access_enabled })}
              disabled={loading}
            >
              {user.api_access_enabled ? "Disable API" : "Enable API"}
            </Button>
          </div>
        </Surface>
      ))}
    </section>
  );
}
