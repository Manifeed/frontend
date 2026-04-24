export type UserRole = "user" | "admin";

export type AuthenticatedUser = {
  id: number;
  email: string;
  pseudo: string;
  pp_id: number;
  role: UserRole;
  is_active: boolean;
  api_access_enabled: boolean;
  created_at: string;
  updated_at: string;
};

export type AuthSessionRead = {
  expires_at: string;
  user: AuthenticatedUser;
};

export type AuthLoginRead = {
  expires_at: string;
  user: AuthenticatedUser;
};

export type AuthRegisterRead = {
  user: AuthenticatedUser;
};

export type AuthLogoutRead = {
  ok: boolean;
};
