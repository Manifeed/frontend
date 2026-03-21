import type { AuthenticatedUser } from "./auth";

export type AdminUserRead = AuthenticatedUser;

export type AdminUserListRead = {
  items: AdminUserRead[];
};
