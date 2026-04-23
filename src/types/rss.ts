export type AdminRssCompany = {
  id: number;
  name: string;
  icon_url: string | null;
  enabled: boolean;
};

export type AdminRssFeed = {
  id: number;
  url: string;
  section: string | null;
  enabled: boolean;
  trust_score: number;
  fetchprotection: number;
  consecutive_error_count: number;
  last_error_code: number | null;
  company: AdminRssCompany | null;
};

export type RssFeedEnabledToggleRead = {
  feed_id: number;
  enabled: boolean;
};

export type RssCompanyEnabledToggleRead = {
  company_id: number;
  enabled: boolean;
};

export type RssRepositoryAction = "cloned" | "update" | "up_to_date";
export type RssSyncMode = "noop" | "full_reconcile";

export type RssSyncRead = {
  repository_action: RssRepositoryAction;
  mode: RssSyncMode;
  current_revision: string | null;
  applied_from_revision: string | null;
  files_processed: number;
  companies_removed: number;
  feeds_removed: number;
};

export type RssFeedCheckResultRead = {
  feed_id: number;
  url: string;
  error: string;
  fetchprotection: number | null;
};

export type RssFeedCheckRead = RssFeedCheckResultRead[];
