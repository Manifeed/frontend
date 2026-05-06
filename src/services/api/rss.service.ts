import { apiRequest } from "@/services/api/client";
import type {
  AdminRssCompany,
  AdminRssFeed,
  RssCompanyEnabledToggleRead,
  RssFeedEnabledToggleRead,
  RssSyncRead,
} from "@/types/rss";

function encodeIconPath(iconUrl: string): string {
  return iconUrl
    .split("/")
    .filter((segment) => segment.length > 0)
    .map((segment) => encodeURIComponent(segment))
    .join("/");
}

export function buildRssIconUrl(iconUrl: string | null): string | null {
  if (!iconUrl) {
    return null;
  }

  const encodedPath = encodeIconPath(iconUrl);
  if (!encodedPath) {
    return null;
  }

  return `/logo/${encodedPath}`;
}

type ListRssFeedsParams = {
  companyId?: number | null;
};

export async function listRssCompanies(): Promise<AdminRssCompany[]> {
  return apiRequest<AdminRssCompany[]>("/api/admin/rss/companies");
}

export async function listRssFeeds(params?: ListRssFeedsParams): Promise<AdminRssFeed[]> {
  const searchParams = new URLSearchParams();
  if (typeof params?.companyId === "number") {
    searchParams.set("company_id", String(params.companyId));
  }

  const query = searchParams.toString();
  const path = query.length > 0 ? `/api/admin/rss/?${query}` : "/api/admin/rss/";
  return apiRequest<AdminRssFeed[]>(path);
}

export async function syncRssFeeds(force = false): Promise<RssSyncRead> {
  const path = force ? "/api/admin/rss/sync?force=true" : "/api/admin/rss/sync";
  return apiRequest<RssSyncRead>(path, {
    method: "POST",
  });
}

export async function updateRssFeedEnabled(
  feedId: number,
  enabled: boolean,
): Promise<RssFeedEnabledToggleRead> {
  return apiRequest<RssFeedEnabledToggleRead>(`/api/admin/rss/feeds/${feedId}/enabled`, {
    method: "PATCH",
    body: JSON.stringify({ enabled }),
  });
}

export async function updateRssCompanyEnabled(
  companyId: number,
  enabled: boolean,
): Promise<RssCompanyEnabledToggleRead> {
  return apiRequest<RssCompanyEnabledToggleRead>(`/api/admin/rss/companies/${companyId}/enabled`, {
    method: "PATCH",
    body: JSON.stringify({ enabled }),
  });
}
