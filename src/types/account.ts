import type { AuthenticatedUser } from "./auth";

export type WorkerTypeKind = "rss_scrapper" | "source_embedding";
export type WorkerInstallComponent = "rss" | "embedding";
export type WorkerReleaseFamily = "desktop" | "rss" | "embedding";
export type WorkerArtifactKind =
  | "desktop_app"
  | "deb_package"
  | "worker_bundle";
export type WorkerReleaseDownloadAuth = "public" | "worker_bearer";
export type WorkerRuntimeBundle = "none" | "cuda12" | "webgpu" | "coreml";

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

export type WorkerReleaseManifestRead = {
  artifact_name: string;
  family: WorkerReleaseFamily;
  product: string;
  platform: string;
  arch: string;
  latest_version: string;
  minimum_supported_version: string;
  worker_version: string | null;
  artifact_kind: WorkerArtifactKind;
  sha256: string;
  runtime_bundle: WorkerRuntimeBundle | null;
  download_auth: WorkerReleaseDownloadAuth;
  download_url: string;
  release_notes_url: string;
  published_at: string;
};

export type WorkerDesktopReleaseRead = WorkerReleaseManifestRead & {
  title: string;
  platform_label: string;
  download_label: string;
  install_command: string | null;
};

export type WorkerDesktopReleaseListRead = {
  items: WorkerDesktopReleaseRead[];
};
