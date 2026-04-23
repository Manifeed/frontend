import { apiRequest } from "@/services/api/client";
import type {
  AdminUserFilters,
  AdminUsersPageRead,
  AdminUserUpdatePayload,
} from "@/types/admin";

const PAGE_SIZE = 100;

function buildUsersQuery(
  filters: AdminUserFilters,
  pageIndex: number,
  debouncedSearch: string,
): string {
  const query = new URLSearchParams();
  const normalizedSearch = debouncedSearch.trim();

  if (normalizedSearch.length > 0) {
    query.set("search", normalizedSearch);
  }
  if (filters.role !== "all") {
    query.set("role", filters.role);
  }
  if (filters.api_access_enabled !== "all") {
    query.set("api_access_enabled", filters.api_access_enabled === "enabled" ? "true" : "false");
  }
  if (filters.status_scope === "inactive") {
    query.set("is_active", "false");
  } else if (normalizedSearch.length === 0) {
    query.set("is_active", "true");
  }
  query.set("limit", PAGE_SIZE.toString());
  query.set("offset", String(pageIndex * PAGE_SIZE));

  const queryString = query.toString();
  return queryString.length > 0 ? `?${queryString}` : "";
}

export async function listAdminUsers(
  filters: AdminUserFilters,
  pageIndex: number,
  debouncedSearch: string,
): Promise<AdminUsersPageRead> {
  return apiRequest<AdminUsersPageRead>(
    `/api/admin/users${buildUsersQuery(filters, pageIndex, debouncedSearch)}`,
  );
}

export async function updateAdminUser(
  userId: number,
  payload: AdminUserUpdatePayload,
): Promise<void> {
  await apiRequest(`/api/admin/users/${userId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}
