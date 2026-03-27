import type { AuthenticatedUser, UserRole } from "./auth";

export type AdminUserRead = AuthenticatedUser;

export type AdminUserListRead = {
  items: AdminUserRead[];
};

export type AdminUserPatchPayload = {
  is_active?: boolean;
  api_access_enabled?: boolean;
};

export type AdminUserRoleFilter = "all" | UserRole;
export type AdminUserActivityFilter = "all" | "active" | "inactive";
export type AdminUserApiAccessFilter = "all" | "enabled" | "disabled";

export type AdminUserFilters = {
  role: AdminUserRoleFilter;
  is_active: AdminUserActivityFilter;
  api_access_enabled: AdminUserApiAccessFilter;
};
