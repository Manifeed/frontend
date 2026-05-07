import { apiRequest } from "@/services/api/client";
import type {
  SimilarSourcesRead,
  UserSourceDetail,
  UserSourcePageRead,
  UserSourceSearchPageRead,
} from "@/types/sources";

type ListUserSourcesParams = {
  limit?: number;
  offset?: number;
};

export type SearchUserSourcesParams = {
  q?: string;
  limit?: number;
  offset?: number;
  language?: string;
  publisherId?: number;
  authorId?: number;
  publishedFrom?: string;
  publishedTo?: string;
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

function buildSearchUserSourcesPath(params?: SearchUserSourcesParams): string {
  const searchParams = new URLSearchParams({
    limit: String(params?.limit ?? 24),
    offset: String(params?.offset ?? 0),
  });
  if (params?.q?.trim()) {
    searchParams.set("q", params.q.trim());
  }
  if (params?.language?.trim()) {
    searchParams.set("language", params.language.trim());
  }
  if (params?.publisherId) {
    searchParams.set("publisher_id", String(params.publisherId));
  }
  if (params?.authorId) {
    searchParams.set("author_id", String(params.authorId));
  }
  if (params?.publishedFrom?.trim()) {
    searchParams.set("published_from", params.publishedFrom.trim());
  }
  if (params?.publishedTo?.trim()) {
    searchParams.set("published_to", params.publishedTo.trim());
  }

  return `/api/sources/search?${searchParams.toString()}`;
}

export async function searchUserSources(
  params?: SearchUserSourcesParams,
): Promise<UserSourceSearchPageRead> {
  return apiRequest<UserSourceSearchPageRead>(buildSearchUserSourcesPath(params));
}

export async function getUserSourceById(sourceId: number): Promise<UserSourceDetail> {
  return apiRequest<UserSourceDetail>(`/api/sources/${sourceId}`);
}

export async function getSimilarSources(
  sourceId: number,
  params?: { limit?: number },
): Promise<SimilarSourcesRead> {
  const searchParams = new URLSearchParams({
    limit: String(params?.limit ?? 10),
  });
  return apiRequest<SimilarSourcesRead>(
    `/api/sources/${sourceId}/similar?${searchParams.toString()}`,
  );
}
