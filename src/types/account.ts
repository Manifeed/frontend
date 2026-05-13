import type { AuthenticatedUser } from "./auth";

export type WorkerTypeKind = "rss_scrapper";

export type AccountMeRead = {
  user: AuthenticatedUser;
};

export type AccountProfileUpdateRequest = {
  pseudo?: string;
  pp_id?: number;
};

export type AccountProfileUpdateRead = {
  user: AuthenticatedUser;
};

export type AccountPasswordUpdateRead = {
  ok: boolean;
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
