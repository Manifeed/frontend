export type UserRole = "user" | "admin";

export type AuthenticatedUser = {
  id: number;
  email: string;
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
  session_token: string;
  expires_at: string;
  user: AuthenticatedUser;
};
