import { apiRequest } from "@/services/api/client";
import type {
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
  country?: string;
  companyId?: number;
  authorId?: number;
  period?: string;
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
  if (params?.country?.trim()) {
    searchParams.set("country", params.country.trim());
  }
  if (params?.companyId) {
    searchParams.set("company_id", String(params.companyId));
  }
  if (params?.authorId) {
    searchParams.set("author_id", String(params.authorId));
  }
  if (params?.period?.trim() && params.period.trim() !== "all") {
    searchParams.set("period", params.period.trim());
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
