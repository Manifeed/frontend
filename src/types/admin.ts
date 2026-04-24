import type { UserRole } from "./auth";

export type AdminUserListItem = {
  id: number;
  email: string;
  pseudo: string;
  role: UserRole;
  is_active: boolean;
  api_access_enabled: boolean;
};

export type AdminUsersPageRead = {
  items: AdminUserListItem[];
  total: number;
  active_total: number;
  limit: number;
  offset: number;
};

export type AdminUserUpdatePayload = {
  is_active?: boolean;
  api_access_enabled?: boolean;
};

export type AdminUserRoleFilter = "all" | UserRole;
export type AdminUserApiAccessFilter = "all" | "enabled" | "disabled";
export type AdminUserStatusScope = "active" | "inactive";

export type AdminUserFilters = {
  search: string;
  status_scope: AdminUserStatusScope;
  role: AdminUserRoleFilter;
  api_access_enabled: AdminUserApiAccessFilter;
};

export type AdminStatsRead = {
  connected_users: number;
  total_users: number;
  connected_workers: number;
  total_sources: number;
};
