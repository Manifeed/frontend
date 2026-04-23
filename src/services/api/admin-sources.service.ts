import { apiRequest } from "@/services/api/client";
import type { AdminSourceDetail, AdminSourcePageRead } from "@/types/sources";

type ListAdminSourcesParams = {
  limit?: number;
  offset?: number;
  feedId?: number | null;
  companyId?: number | null;
  authorId?: number | null;
};

function buildListAdminSourcesPath(params?: ListAdminSourcesParams): string {
  const limit = params?.limit ?? 50;
  const offset = params?.offset ?? 0;
  const feedId = params?.feedId;
  const companyId = params?.companyId;
  const authorId = params?.authorId;

  let path = "/api/admin/sources/";
  if (typeof feedId === "number") {
    path = `/api/admin/sources/feeds/${feedId}`;
  } else if (typeof companyId === "number") {
    path = `/api/admin/sources/companies/${companyId}`;
  }

  const searchParams = new URLSearchParams({
    limit: String(limit),
    offset: String(offset),
  });
  if (typeof authorId === "number") {
    searchParams.set("author_id", String(authorId));
  }

  return `${path}?${searchParams.toString()}`;
}

export async function listAdminSources(
  params?: ListAdminSourcesParams,
): Promise<AdminSourcePageRead> {
  return apiRequest<AdminSourcePageRead>(buildListAdminSourcesPath(params));
}

export async function getAdminSourceById(sourceId: number): Promise<AdminSourceDetail> {
  return apiRequest<AdminSourceDetail>(`/api/admin/sources/${sourceId}`);
}
