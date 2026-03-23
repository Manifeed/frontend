import type { AuthenticatedUser } from "./auth";
import type { WorkerTypeKind } from "./workers";

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
  revoked_at: string | null;
  created_at: string;
};

export type UserApiKeyListRead = {
  items: UserApiKeyRead[];
};

export type UserApiKeyCreateRead = {
  api_key: string;
  api_key_info: UserApiKeyRead;
};

export type AccountWorkerRead = {
  api_key_id: number;
  label: string;
  worker_type: WorkerTypeKind;
  worker_name: string;
  worker_version: string | null;
  processing_tasks: number;
  idle_ms: number;
  connected: boolean;
  active: boolean;
  last_seen_at: string | null;
  connection_state: string | null;
  desired_state: string | null;
  current_task_id: number | null;
  current_execution_id: number | null;
  last_error: string | null;
  last_used_at: string | null;
};

export type AccountWorkerListRead = {
  items: AccountWorkerRead[];
};
