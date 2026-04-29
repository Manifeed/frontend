import { apiRequest } from "@/services/api/client";
import type {
  SimilarSourcesRead,
  UserSourceDetail,
  UserSourcePageRead,
} from "@/types/sources";

type ListUserSourcesParams = {
  limit?: number;
  offset?: number;
};

function buildListUserSourcesPath(params?: ListUserSourcesParams): string {
  const limit = params?.limit ?? 24;
  const offset = params?.offset ?? 0;
  const searchParams = new URLSearchParams({
    limit: String(limit),
    offset: String(offset),
  });

  return `/api/sources/?${searchParams.toString()}`;
}

export async function listUserSources(
  params?: ListUserSourcesParams,
): Promise<UserSourcePageRead> {
  return apiRequest<UserSourcePageRead>(buildListUserSourcesPath(params));
}

export async function getUserSourceById(sourceId: number): Promise<UserSourceDetail> {
  return apiRequest<UserSourceDetail>(`/api/sources/${sourceId}`);
}

export async function getSimilarSources(
  sourceId: number,
  params?: { limit?: number; workerVersion?: string },
): Promise<SimilarSourcesRead> {
  const searchParams = new URLSearchParams({
    limit: String(params?.limit ?? 10),
  });
  if (params?.workerVersion) {
    searchParams.set("worker_version", params.workerVersion);
  }
  return apiRequest<SimilarSourcesRead>(
    `/api/sources/${sourceId}/similar?${searchParams.toString()}`,
  );
}
