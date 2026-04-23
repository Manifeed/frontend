"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import {
  Button,
  EmptyState,
  EnabledToggle,
  Field,
  HeadPanel,
  Notice,
  PageShell,
  PopInfo,
  SearchBar,
  SidePanel,
  Surface,
  Table,
  type PopInfoType,
} from "@/components";
import { CompanyCard } from "@/features/rss/components/CompanyCard";
import {
  listRssCompanies,
  listRssFeeds,
  syncRssFeeds,
  updateRssCompanyEnabled,
  updateRssFeedEnabled,
} from "@/services/api/rss.service";
import type { AdminRssCompany, AdminRssFeed, RssSyncRead } from "@/types/rss";

import styles from "./page.module.css";

type PopInfoState = {
  id: number;
  title: string;
  text: string;
  type: PopInfoType;
};

function parseCompanyId(rawValue: string | null): number | null {
  if (!rawValue)
    return null;

  const parsedValue = Number(rawValue);
  return Number.isInteger(parsedValue) && parsedValue > 0 ? parsedValue : null;
}

function formatSyncSummary(syncResult: RssSyncRead): string {
  const parts = [
    `action=${syncResult.repository_action}`,
    `mode=${syncResult.mode}`,
    `files=${syncResult.files_processed}`,
    `companies_removed=${syncResult.companies_removed}`,
    `feeds_removed=${syncResult.feeds_removed}`,
  ];

  if (syncResult.current_revision)
    parts.push(`revision=${syncResult.current_revision.slice(0, 8)}`);

  return parts.join(" | ");
}

export default function AdminRssPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentPathname = pathname ?? "/admin/rss";

  const selectedCompanyId = useMemo(
    () => parseCompanyId(searchParams?.get("companyId") ?? null),
    [searchParams],
  );

  const [companies, setCompanies] = useState<AdminRssCompany[]>([]);
  const [loadingCompanies, setLoadingCompanies] = useState<boolean>(true);
  const [companiesError, setCompaniesError] = useState<string | null>(null);
  const [feeds, setFeeds] = useState<AdminRssFeed[]>([]);
  const [loadingFeeds, setLoadingFeeds] = useState<boolean>(false);
  const [feedsError, setFeedsError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState<boolean>(false);
  const [forceSyncing, setForceSyncing] = useState<boolean>(false);
  const [popInfo, setPopInfo] = useState<PopInfoState | null>(null);

  const [searchQuery, setSearchQuery] = useState<string>("");

  const [toggleError, setToggleError] = useState<string | null>(null);
  const [togglingFeedIds, setTogglingFeedIds] = useState<Set<number>>(new Set());
  const [togglingCompanyId, setTogglingCompanyId] = useState<number | null>(null);

  const replaceSelectedCompanyId = useCallback(
    (companyId: number | null) => {
      const nextSearchParams = new URLSearchParams(
        typeof window === "undefined" ? "" : window.location.search,
      );

      if (companyId === null)
        nextSearchParams.delete("companyId");
      else
        nextSearchParams.set("companyId", String(companyId));

      const query = nextSearchParams.toString();
      router.replace(query.length > 0 ? `${currentPathname}?${query}` : currentPathname, {
        scroll: false,
      });
    },
    [currentPathname, router],
  );

  const loadCompanies = useCallback(
    async (selectionToValidate: number | null) => {
      setLoadingCompanies(true);
      setCompaniesError(null);

      try {
        const companiesPayload = await listRssCompanies();
        setCompanies(companiesPayload);

        if (companiesPayload.length === 0) {
          setFeeds([]);
          if (selectionToValidate !== null)
            replaceSelectedCompanyId(null);
          return;
        }

        const selectionStillExists =
          selectionToValidate !== null &&
          companiesPayload.some((company) => company.id === selectionToValidate);

        if (!selectionStillExists)
          replaceSelectedCompanyId(companiesPayload[0].id);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unexpected error while loading companies";
        setCompanies([]);
        setCompaniesError(message);
      } finally {
        setLoadingCompanies(false);
      }
    },
    [replaceSelectedCompanyId],
  );

  const loadFeeds = useCallback(async (companyId: number | null) => {
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
      const feedsPayload = await listRssFeeds({ companyId });
      setFeeds(feedsPayload);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unexpected error while loading feeds";
      setFeeds([]);
      setFeedsError(message);
    } finally {
      setLoadingFeeds(false);
    }
  }, []);

  const refreshRssData = useCallback(async () => {
    setLoadingCompanies(true);
    setLoadingFeeds(selectedCompanyId !== null);
    setCompaniesError(null);
    setFeedsError(null);
    setToggleError(null);

    try {
      const [companiesPayload, feedsPayload] = await Promise.all([
        listRssCompanies(),
        selectedCompanyId !== null
          ? listRssFeeds({ companyId: selectedCompanyId })
          : Promise.resolve<AdminRssFeed[]>([]),
      ]);

      setCompanies(companiesPayload);
      setFeeds(feedsPayload);

      if (companiesPayload.length === 0) {
        if (selectedCompanyId !== null)
          replaceSelectedCompanyId(null);
        return;
      }

      const selectionStillExists =
        selectedCompanyId !== null &&
        companiesPayload.some((company) => company.id === selectedCompanyId);

      if (!selectionStillExists)
        replaceSelectedCompanyId(companiesPayload[0].id);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unexpected error while loading RSS data";
      setCompanies([]);
      setFeeds([]);
      setCompaniesError(message);
      setFeedsError(message);
    } finally {
      setLoadingCompanies(false);
      setLoadingFeeds(false);
    }
  }, [replaceSelectedCompanyId, selectedCompanyId]);

  useEffect(() => {
    const initialSelectedCompanyId =
      typeof window === "undefined"
        ? null
        : parseCompanyId(new URLSearchParams(window.location.search).get("companyId"));

    void loadCompanies(initialSelectedCompanyId);
  }, [loadCompanies]);

  useEffect(() => {
    void loadFeeds(selectedCompanyId);
  }, [loadFeeds, selectedCompanyId]);

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
      if (force)
        setForceSyncing(true);
      else
        setSyncing(true);

      try {
        const payload = await syncRssFeeds(force);
        showPopInfo(
          force ? "Last force sync result" : "Last sync result",
          formatSyncSummary(payload),
          "info",
        );
        await refreshRssData();
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unexpected error during sync";
        showPopInfo(force ? "Force sync error" : "Sync error", message, "alert");
      } finally {
        if (force)
          setForceSyncing(false);
        else
          setSyncing(false);
      }
    },
    [refreshRssData, showPopInfo],
  );

  const handleSync = useCallback(() => {
    void runSync(false);
  }, [runSync]);

  const handleForceSync = useCallback(() => {
    void runSync(true);
  }, [runSync]);

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

  const handleCompanyEnabledToggle = useCallback(
    async (companyId: number, nextEnabled: boolean) => {
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
    },
    [],
  );

  const selectedCompany = useMemo(
    () => companies.find((company) => company.id === selectedCompanyId) ?? null,
    [companies, selectedCompanyId],
  );

  const filteredSelectedFeeds = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return feeds.filter((feed) => {
      if (!normalizedQuery)
        return true;

      const searchable = [feed.url, feed.section]
        .filter((value): value is string => Boolean(value))
        .join(" ")
        .toLowerCase();

      return searchable.includes(normalizedQuery);
    });
  }, [feeds, searchQuery]);

  const isRefreshing = loadingCompanies || loadingFeeds;
  const headerTitle = selectedCompany !== null ? `${feeds.length} feeds` : `${companies.length} companies`;

  return (
    <PageShell className={styles.main}>
      <HeadPanel>
        <h2 className={styles.syncTitle}>{headerTitle}</h2>

        <div className={styles.syncActions}>
          <Button variant="primary" onClick={handleSync} disabled={syncing || forceSyncing}>
            {syncing ? "Syncing..." : "Sync RSS"}
          </Button>
          <Button
            variant="secondary"
            onClick={handleForceSync}
            disabled={forceSyncing || syncing}
          >
            {forceSyncing ? "Force syncing..." : "Force sync RSS"}
          </Button>
          <Button onClick={refreshRssData} disabled={isRefreshing}>
            {isRefreshing ? "Refreshing..." : "Refresh feeds"}
          </Button>
        </div>
      </HeadPanel>

      {popInfo ? (
        <PopInfo
          key={popInfo.id}
          title={popInfo.title}
          text={popInfo.text}
          type={popInfo.type}
          onClose={closePopInfo}
        />
      ) : null}

      <section className={styles.workspace}>
        <SidePanel
          as="aside"
          className={styles.companyPanel}
          bodyClassName={styles.companyRail}
          padding="sm"
        >
          {companiesError ? <Notice tone="danger">Company load error: {companiesError}</Notice> : null}
          {!companiesError && loadingCompanies ? <Notice>Loading companies...</Notice> : null}
          {!companiesError && !loadingCompanies && companies.length === 0 ? (
            <Notice>No companies found.</Notice>
          ) : null}
          {companies.map((company) => (
            <CompanyCard
              key={company.id}
              className={styles.companyCardItem}
              companyName={company.name}
              companyIconUrl={company.icon_url}
              isSelected={company.id === selectedCompanyId}
              onSelect={() => replaceSelectedCompanyId(company.id)}
            />
          ))}
        </SidePanel>

        <div className={styles.workspaceContent}>
          {feedsError ? (
            <Surface className={styles.feedPanel}>
              <Notice tone="danger">Feed load error: {feedsError}</Notice>
            </Surface>
          ) : loadingFeeds ? (
            <Surface className={styles.feedPanel}>
              <Notice className={styles.loadingNotice}>Loading feed cards...</Notice>
            </Surface>
          ) : !selectedCompany ? (
            <Surface className={styles.feedPanel}>
              <EmptyState
                title="No company detected"
                description="Run a refresh or sync to load feeds."
              />
            </Surface>
          ) : (
            <Table
              className={styles.feedPanel}
              minWidth="820px"
              header={
                <>
                  <header className={styles.feedPanelHeader}>
                    <h2>{selectedCompany.name}</h2>
                    <EnabledToggle
                      enabled={selectedCompany.enabled}
                      loading={selectedCompany.id === togglingCompanyId}
                      ariaLabel={`Toggle company ${selectedCompany.name}`}
                      onChange={(nextEnabled) =>
                        handleCompanyEnabledToggle(selectedCompany.id, nextEnabled)
                      }
                    />
                  </header>

                  <div className={styles.feedToolbar}>
                    <Field htmlFor="rss-search" className={styles.feedSearchField}>
                      <SearchBar
                        id="rss-search"
                        value={searchQuery}
                        onChange={(event) => setSearchQuery(event.target.value)}
                        placeholder="URL, section..."
                        enableShortcut
                        shortcutHint="Cmd + K"
                      />
                    </Field>
                  </div>

                  {toggleError ? <Notice tone="danger">Toggle error: {toggleError}</Notice> : null}
                </>
              }
            >
              {filteredSelectedFeeds.length === 0 ? (
                <tbody>
                  <tr>
                    <td colSpan={6} className={styles.feedEmptyCell}>
                      <EmptyState
                        title="No matching feeds"
                        description="Adjust the filters for the selected company."
                      />
                    </td>
                  </tr>
                </tbody>
              ) : (
                <>
                  <thead>
                    <tr>
                      <th>Section</th>
                      <th>FP</th>
                      <th>Errors</th>
                      <th>Last error</th>
                      <th>URL</th>
                      <th className={styles.feedEnabledCell}>Enabled</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSelectedFeeds.map((feed) => {
                      const sectionValue = feed.section ?? "";
                      const section =
                        sectionValue.length === 0
                          ? "No section"
                          : sectionValue.length < 30
                            ? sectionValue
                            : sectionValue.slice(0, 27) + "...";
                      const url = feed.url.length > 70 ? feed.url.slice(0, 67) + "..." : feed.url;
                      const companyDisabled = feed.company?.enabled === false;

                      return (
                        <tr key={feed.id}>
                          <td className={styles.feedSectionCell}>{section}</td>
                          <td className={styles.feedMetricCell}>{feed.fetchprotection}</td>
                          <td className={styles.feedMetricCell}>
                            {feed.consecutive_error_count}
                          </td>
                          <td className={styles.feedMetricCell}>
                            {feed.last_error_code ?? "-"}
                          </td>
                          <td className={styles.feedUrlCell}>
                            <a
                              href={feed.url}
                              target="_blank"
                              rel="noreferrer"
                              className={styles.feedUrlLink}
                            >
                              {url}
                            </a>
                          </td>
                          <td
                            className={styles.feedEnabledCell}
                            data-sort-value={feed.enabled ? "enabled" : "disabled"}
                          >
                            <EnabledToggle
                              enabled={feed.enabled}
                              loading={togglingFeedIds.has(feed.id)}
                              disabled={companyDisabled}
                              ariaLabel={`Toggle ${feed.url}`}
                              onChange={(nextEnabled) =>
                                handleFeedEnabledToggle(feed.id, nextEnabled)
                              }
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </>
              )}
            </Table>
          )}
        </div>
      </section>
    </PageShell>
  );
}
