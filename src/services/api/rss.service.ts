import { apiRequest } from "@/services/api/client";
import type {
  RssCatalogSummary,
  RssCompanyEnabledToggleRead,
  RssCompany,
  RssFeed,
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

  return `/api/rss/img/${encodedPath}`;
}

type ListRssFeedsOptions = {
  companyId: number;
};

export async function getRssCatalogSummary(): Promise<RssCatalogSummary> {
  return apiRequest<RssCatalogSummary>("/api/rss/");
}

export async function listRssCompanies(): Promise<RssCompany[]> {
  return apiRequest<RssCompany[]>("/api/rss/companies");
}

export async function listRssFeeds(options: ListRssFeedsOptions): Promise<RssFeed[]> {
  return apiRequest<RssFeed[]>(`/api/rss/companies/${options.companyId}`);
}

export async function syncRssFeeds(force = false): Promise<RssSyncRead> {
  const path = force ? "/api/rss/sync?force=true" : "/api/rss/sync";
  return apiRequest<RssSyncRead>(path, {
    method: "POST",
  });
}

export async function updateRssFeedEnabled(
  feedId: number,
  enabled: boolean,
): Promise<RssFeedEnabledToggleRead> {
  return apiRequest<RssFeedEnabledToggleRead>(`/api/rss/feeds/${feedId}/enabled`, {
    method: "PATCH",
    body: JSON.stringify({ enabled }),
  });
}

export async function updateRssCompanyEnabled(
  companyId: number,
  enabled: boolean,
): Promise<RssCompanyEnabledToggleRead> {
  return apiRequest<RssCompanyEnabledToggleRead>(`/api/rss/companies/${companyId}/enabled`, {
    method: "PATCH",
    body: JSON.stringify({ enabled }),
  });
}
