"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { Notice, PageHeader, PageShell, PopInfo, Surface, type PopInfoType } from "@/components";
import { CompanyCard } from "@/features/rss/components/CompanyCard";
import { FeedPanel } from "@/features/rss/components/FeedPanel";
import {
  FeedToolbar,
  type EnabledFilter,
  type SortMode,
} from "@/features/rss/components/FeedToolbar";
import { RssSyncPanel } from "@/features/rss/components/RssSyncPanel";
import { createRssScrapeJob } from "@/services/api/jobs.service";
import {
  getRssCatalogSummary,
  listRssCompanies,
  listRssFeeds,
  syncRssFeeds,
  updateRssCompanyEnabled,
  updateRssFeedEnabled,
} from "@/services/api/rss.service";
import type { JobEnqueueRead } from "@/types/jobs";
import type { RssCatalogSummary, RssCompany, RssFeed, RssSyncRead } from "@/types/rss";

import styles from "./page.module.css";

type PopInfoState = {
  id: number;
  title: string;
  text: string;
  type: PopInfoType;
};

function sortFeeds(feeds: RssFeed[], sortMode: SortMode): RssFeed[] {
  const nextFeeds = [...feeds];

  nextFeeds.sort((left, right) => {
    if (sortMode === "trust_desc") {
      return right.trust_score - left.trust_score;
    }

    if (sortMode === "trust_asc") {
      return left.trust_score - right.trust_score;
    }

    if (sortMode === "url_desc") {
      return right.url.localeCompare(left.url);
    }

    return left.url.localeCompare(right.url);
  });

  return nextFeeds;
}

function formatSyncSummary(syncResult: RssSyncRead): string {
  const parts = [
    `action=${syncResult.repository_action}`,
    `mode=${syncResult.mode}`,
    `files=${syncResult.files_processed}`,
    `companies_removed=${syncResult.companies_removed}`,
    `feeds_removed=${syncResult.feeds_removed}`,
  ];

  if (syncResult.current_revision) {
    parts.push(`revision=${syncResult.current_revision.slice(0, 8)}`);
  }

  return parts.join(" | ");
}

function formatIngestSummary(ingestResult: JobEnqueueRead): string {
  return [
    `job=${ingestResult.job_id.slice(0, 8)}`,
    `kind=${ingestResult.job_kind}`,
    `status=${ingestResult.status}`,
    `tasks=${ingestResult.tasks_total}`,
    `items=${ingestResult.items_total}`,
    "mode=ingest",
  ].join(" | ");
}

export default function AdminRssPage() {
  const [summary, setSummary] = useState<RssCatalogSummary | null>(null);
  const [companies, setCompanies] = useState<RssCompany[]>([]);
  const [feeds, setFeeds] = useState<RssFeed[]>([]);
  const [loadingCatalog, setLoadingCatalog] = useState<boolean>(true);
  const [loadingFeeds, setLoadingFeeds] = useState<boolean>(false);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [feedsError, setFeedsError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState<boolean>(false);
  const [forceSyncing, setForceSyncing] = useState<boolean>(false);
  const [ingesting, setIngesting] = useState<boolean>(false);
  const [popInfo, setPopInfo] = useState<PopInfoState | null>(null);

  const [searchQuery, setSearchQuery] = useState<string>("");
  const [enabledFilter, setEnabledFilter] = useState<EnabledFilter>("all");
  const [sortMode, setSortMode] = useState<SortMode>("trust_desc");

  const [toggleError, setToggleError] = useState<string | null>(null);
  const [togglingFeedIds, setTogglingFeedIds] = useState<Set<number>>(new Set());
  const [togglingCompanyId, setTogglingCompanyId] = useState<number | null>(null);
  const [selectedCompanyId, setSelectedCompanyId] = useState<number | null>(null);

  const loadCatalog = useCallback(
    async (preferredCompanyId?: number | null): Promise<number | null> => {
      setLoadingCatalog(true);
      setCatalogError(null);

      try {
        const [nextSummary, nextCompanies] = await Promise.all([
          getRssCatalogSummary(),
          listRssCompanies(),
        ]);
        const nextSelectedCompanyId =
          preferredCompanyId !== null &&
          preferredCompanyId !== undefined &&
          nextCompanies.some((company) => company.id === preferredCompanyId)
            ? preferredCompanyId
            : nextCompanies[0]?.id ?? null;

        setSummary(nextSummary);
        setCompanies(nextCompanies);
        setSelectedCompanyId(nextSelectedCompanyId);
        return nextSelectedCompanyId;
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unexpected error while loading RSS companies";
        setCatalogError(message);
        setSummary(null);
        setCompanies([]);
        setSelectedCompanyId(null);
        return null;
      } finally {
        setLoadingCatalog(false);
      }
    },
    [],
  );

  const loadCompanyFeeds = useCallback(async (companyId: number | null) => {
    if (companyId === null) {
      setFeeds([]);
      setFeedsError(null);
      setLoadingFeeds(false);
      return;
    }

    setLoadingFeeds(true);
    setFeedsError(null);
    setToggleError(null);

    try {
      const payload = await listRssFeeds({ companyId });
      setFeeds(payload);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unexpected error while loading company feeds";
      setFeedsError(message);
      setFeeds([]);
    } finally {
      setLoadingFeeds(false);
    }
  }, []);

  const refreshWorkspace = useCallback(
    async (preferredCompanyId?: number | null) => {
      const nextCompanyId = await loadCatalog(preferredCompanyId ?? selectedCompanyId);
      await loadCompanyFeeds(nextCompanyId);
    },
    [loadCatalog, loadCompanyFeeds, selectedCompanyId],
  );

  useEffect(() => {
    void loadCatalog(null);
  }, [loadCatalog]);

  useEffect(() => {
    if (selectedCompanyId === null) {
      setFeeds([]);
      setFeedsError(null);
      return;
    }

    void loadCompanyFeeds(selectedCompanyId);
  }, [loadCompanyFeeds, selectedCompanyId]);

  const closePopInfo = useCallback(() => {
    setPopInfo(null);
  }, []);

  const showPopInfo = useCallback((title: string, text: string, type: PopInfoType) => {
    setPopInfo((current) => ({
      id: (current?.id ?? 0) + 1,
      title,
      text,
      type,
    }));
  }, []);

  const runSync = useCallback(
    async (force: boolean) => {
      if (force) {
        setForceSyncing(true);
      } else {
        setSyncing(true);
      }

      try {
        const payload = await syncRssFeeds(force);
        showPopInfo(
          force ? "Last force sync result" : "Last sync result",
          formatSyncSummary(payload),
          "info",
        );
        await refreshWorkspace(selectedCompanyId);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unexpected error during sync";
        showPopInfo(force ? "Force sync error" : "Sync error", message, "alert");
      } finally {
        if (force) {
          setForceSyncing(false);
        } else {
          setSyncing(false);
        }
      }
    },
    [refreshWorkspace, selectedCompanyId, showPopInfo],
  );

  const handleSync = useCallback(() => {
    void runSync(false);
  }, [runSync]);

  const handleForceSync = useCallback(() => {
    void runSync(true);
  }, [runSync]);

  const handleIngest = useCallback(async () => {
    setIngesting(true);

    try {
      const payload = await createRssScrapeJob();
      showPopInfo("Last ingest result", formatIngestSummary(payload), "info");
      await refreshWorkspace(selectedCompanyId);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unexpected error during ingest";
      showPopInfo("Ingest error", message, "alert");
    } finally {
      setIngesting(false);
    }
  }, [refreshWorkspace, selectedCompanyId, showPopInfo]);

  const handleFeedEnabledToggle = useCallback(async (feedId: number, nextEnabled: boolean) => {
    setToggleError(null);
    setTogglingFeedIds((currentIds) => {
      const nextIds = new Set(currentIds);
      nextIds.add(feedId);
      return nextIds;
    });

    try {
      const updatedFeed = await updateRssFeedEnabled(feedId, nextEnabled);
      setFeeds((currentFeeds) =>
        currentFeeds.map((feed) =>
          feed.id === updatedFeed.feed_id ? { ...feed, enabled: updatedFeed.enabled } : feed,
        ),
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to toggle feed";
      setToggleError(message);
    } finally {
      setTogglingFeedIds((currentIds) => {
        const nextIds = new Set(currentIds);
        nextIds.delete(feedId);
        return nextIds;
      });
    }
  }, []);

  const handleCompanyEnabledToggle = useCallback(async (companyId: number, nextEnabled: boolean) => {
    setToggleError(null);
    setTogglingCompanyId(companyId);

    try {
      const updatedCompany = await updateRssCompanyEnabled(companyId, nextEnabled);
      setCompanies((currentCompanies) =>
        currentCompanies.map((company) =>
          company.id === updatedCompany.company_id
            ? { ...company, enabled: updatedCompany.enabled }
            : company,
        ),
      );
      setFeeds((currentFeeds) =>
        currentFeeds.map((feed) => ({
          ...feed,
          company:
            feed.company !== null && feed.company.id === updatedCompany.company_id
              ? {
                  ...feed.company,
                  enabled: updatedCompany.enabled,
                }
              : feed.company,
        })),
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to toggle company";
      setToggleError(message);
    } finally {
      setTogglingCompanyId(null);
    }
  }, []);

  const selectedCompany = useMemo(
    () => companies.find((company) => company.id === selectedCompanyId) ?? null,
    [companies, selectedCompanyId],
  );

  const filteredSelectedFeeds = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    const nextFeeds = feeds.filter((feed) => {
      if (enabledFilter === "enabled" && !feed.enabled) {
        return false;
      }

      if (enabledFilter === "disabled" && feed.enabled) {
        return false;
      }

      if (!normalizedQuery) {
        return true;
      }

      const searchable = [feed.url, feed.section]
        .filter((value): value is string => Boolean(value))
        .join(" ")
        .toLowerCase();

      return searchable.includes(normalizedQuery);
    });

    return sortFeeds(nextFeeds, sortMode);
  }, [enabledFilter, feeds, searchQuery, sortMode]);

  return (
    <PageShell className={styles.main}>
      <PageHeader
        title="RSS Company Workspace"
        description="Browse the full company list, then inspect the feeds of the selected company."
      />

      <RssSyncPanel
        syncing={syncing}
        forceSyncing={forceSyncing}
        ingesting={ingesting}
        loadingFeeds={loadingCatalog || loadingFeeds}
        feedCount={summary?.feeds_total ?? 0}
        onSync={handleSync}
        onForceSync={handleForceSync}
        onIngest={handleIngest}
        onRefresh={() => {
          void refreshWorkspace(selectedCompanyId);
        }}
      />

      {popInfo ? (
        <PopInfo
          key={popInfo.id}
          title={popInfo.title}
          text={popInfo.text}
          type={popInfo.type}
          onClose={closePopInfo}
        />
      ) : null}

      {catalogError ? <Notice tone="danger">{catalogError}</Notice> : null}

      <section className={styles.workspace}>
        <Surface as="aside" className={styles.companyPanel} padding="sm">
          {loadingCatalog ? <Notice tone="info">Loading RSS companies...</Notice> : null}
          {!loadingCatalog && companies.length === 0 ? (
            <Notice tone="info">No RSS companies are available yet.</Notice>
          ) : null}
          <div className={styles.companyRail}>
            {companies.map((company) => (
              <CompanyCard
                key={company.id}
                className={styles.companyCardItem}
                companyName={company.name}
                companyIconUrl={company.icon_url}
                isSelected={company.id === selectedCompanyId}
                onSelect={() => setSelectedCompanyId(company.id)}
              />
            ))}
          </div>
        </Surface>

        <div className={styles.workspaceContent}>
          <FeedToolbar
            searchQuery={searchQuery}
            enabledFilter={enabledFilter}
            sortMode={sortMode}
            onSearchQueryChange={setSearchQuery}
            onEnabledFilterChange={setEnabledFilter}
            onSortModeChange={setSortMode}
          />

          <FeedPanel
            feeds={filteredSelectedFeeds}
            feedsError={feedsError}
            toggleError={toggleError}
            loadingFeeds={loadingCatalog || loadingFeeds}
            selectedCompanyName={selectedCompany?.name ?? ""}
            selectedCompanyId={selectedCompany?.id ?? null}
            selectedCompanyEnabled={selectedCompany?.enabled ?? true}
            companyToggling={selectedCompany?.id === togglingCompanyId}
            togglingFeedIds={togglingFeedIds}
            onToggleFeedEnabled={handleFeedEnabledToggle}
            onToggleCompanyEnabled={handleCompanyEnabledToggle}
          />
        </div>
      </section>
    </PageShell>
  );
}
