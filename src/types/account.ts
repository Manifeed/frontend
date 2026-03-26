import type { AuthenticatedUser } from "./auth";

export type WorkerTypeKind = "rss_scrapper" | "source_embedding";

export type AccountMeRead = {
  user: AuthenticatedUser;
};

export type AccountProfileUpdateRequest = {
  pseudo: string;
};

export type AccountProfileUpdateRead = {
  user: AuthenticatedUser;
};

export type UserApiKeyRead = {
  id: number;
  label: string;
  worker_type: WorkerTypeKind;
  worker_name: string;
  key_prefix: string;
  last_used_at: string | null;
  created_at: string;
};

export type UserApiKeyListRead = {
  items: UserApiKeyRead[];
};

export type UserApiKeyCreateRead = {
  api_key: string;
  api_key_info: UserApiKeyRead;
};
