"use client";

import { useEffect, useMemo, useState } from "react";

import { Notice, PageHeader, PageShell, Surface } from "@/components";
import { CompanyCard } from "@/features/rss/components/CompanyCard";
import {
  buildRssIconUrl,
  getRssCatalogSummary,
  listRssCompanies,
  listRssFeeds,
} from "@/services/api/rss.service";
import type { UserRole } from "@/types/auth";
import type { RssCatalogSummary, RssCompany, RssFeed } from "@/types/rss";


type PublicRssCatalogProps = {
  sessionRole: UserRole | "public";
};


function resolveDescription(sessionRole: UserRole | "public"): string {
  if (sessionRole === "admin") {
    return "The full company catalog is public, and your admin session can inspect every feed of a selected company.";
  }
  if (sessionRole === "user") {
    return "The full company catalog is public, and your session can inspect all feeds of the selected company.";
  }
  return "Public access exposes the full company catalog and icons. Sign in to inspect every feed of a company.";
}


export function PublicRssCatalog({ sessionRole }: PublicRssCatalogProps) {
  const [summary, setSummary] = useState<RssCatalogSummary | null>(null);
  const [companies, setCompanies] = useState<RssCompany[]>([]);
  const [feeds, setFeeds] = useState<RssFeed[]>([]);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [feedsError, setFeedsError] = useState<string | null>(null);
  const [pendingCatalog, setPendingCatalog] = useState(true);
  const [pendingFeeds, setPendingFeeds] = useState(false);
  const [selectedCompanyId, setSelectedCompanyId] = useState<number | null>(null);

  const canReadFeeds = sessionRole === "user" || sessionRole === "admin";

  useEffect(() => {
    let cancelled = false;

    async function loadCatalog() {
      setPendingCatalog(true);
      setCatalogError(null);
      try {
        const [nextSummary, nextCompanies] = await Promise.all([
          getRssCatalogSummary(),
          listRssCompanies(),
        ]);
        if (!cancelled) {
          setSummary(nextSummary);
          setCompanies(nextCompanies);
          setSelectedCompanyId((current) => current ?? nextCompanies[0]?.id ?? null);
        }
      } catch (loadError) {
        if (!cancelled) {
          setCatalogError(loadError instanceof Error ? loadError.message : "Unable to load RSS companies");
        }
      } finally {
        if (!cancelled) {
          setPendingCatalog(false);
        }
      }
    }

    void loadCatalog();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!canReadFeeds || selectedCompanyId === null) {
      setFeeds([]);
      setPendingFeeds(false);
      setFeedsError(null);
      return;
    }

    const companyId = selectedCompanyId;
    let cancelled = false;

    async function loadFeedsForCompany() {
      setPendingFeeds(true);
      setFeedsError(null);
      try {
        const nextFeeds = await listRssFeeds({ companyId });
        if (!cancelled) {
          setFeeds(nextFeeds);
        }
      } catch (loadError) {
        if (!cancelled) {
          setFeedsError(loadError instanceof Error ? loadError.message : "Unable to load company feeds");
        }
      } finally {
        if (!cancelled) {
          setPendingFeeds(false);
        }
      }
    }

    void loadFeedsForCompany();
    return () => {
      cancelled = true;
    };
  }, [canReadFeeds, selectedCompanyId]);

  const selectedCompany = useMemo(
    () => companies.find((company) => company.id === selectedCompanyId) ?? null,
    [companies, selectedCompanyId],
  );

  return (
    <PageShell size="wide">
      <PageHeader
        title="RSS Catalog"
        description={resolveDescription(sessionRole)}
        sideContent={
          <div style={{ textAlign: "right" }}>
            <div><strong>{summary?.companies_total ?? 0}</strong> companies</div>
            <div><strong>{summary?.feeds_total ?? 0}</strong> feeds</div>
          </div>
        }
      />

      {catalogError ? <Notice tone="danger">{catalogError}</Notice> : null}
      {pendingCatalog ? <Notice tone="info">Loading RSS companies...</Notice> : null}
      {!pendingCatalog && companies.length === 0 ? (
        <Notice tone="info">No RSS companies are available yet.</Notice>
      ) : null}

      <div
        style={{
          display: "grid",
          gap: "1rem",
          gridTemplateColumns: "repeat(auto-fit, minmax(88px, 1fr))",
          marginTop: "1rem",
        }}
      >
        {companies.map((company) => (
          <div key={company.id} style={{ display: "flex", flexDirection: "column", gap: "0.5rem", alignItems: "center" }}>
            <CompanyCard
              companyName={company.name}
              companyIconUrl={company.icon_url}
              isSelected={company.id === selectedCompanyId}
              onSelect={() => setSelectedCompanyId(company.id)}
            />
            <div style={{ textAlign: "center", fontSize: "0.85rem" }}>
              <strong>{company.name}</strong>
              <div style={{ opacity: 0.72 }}>{company.feed_count} feeds</div>
            </div>
          </div>
        ))}
      </div>

      {!canReadFeeds ? (
        <Surface padding="lg" tone="default" style={{ marginTop: "1rem" }}>
          <Notice tone="info">
            Sign in to inspect every feed of a selected company. Public access only exposes the global counts, the full company list and the icon assets.
          </Notice>
        </Surface>
      ) : null}

      {canReadFeeds ? (
        <div
          style={{
            display: "grid",
            gap: "1rem",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            marginTop: "1rem",
          }}
        >
          {feedsError ? <Notice tone="danger">{feedsError}</Notice> : null}
          {pendingFeeds ? <Notice tone="info">Loading company feeds...</Notice> : null}
          {!pendingFeeds && selectedCompany && feeds.length === 0 ? (
            <Notice tone="info">No feeds are attached to {selectedCompany.name}.</Notice>
          ) : null}
          {feeds.map((feed) => {
            const iconUrl = buildRssIconUrl(feed.company?.icon_url ?? null);
            return (
              <Surface key={feed.id} padding="lg" tone="default">
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.75rem" }}>
                  {iconUrl ? (
                    <img
                      src={iconUrl}
                      alt={feed.company?.name ?? "RSS icon"}
                      width={28}
                      height={28}
                      style={{ flexShrink: 0 }}
                    />
                  ) : null}
                  <div>
                    <strong>{selectedCompany?.name ?? feed.company?.name ?? "Unknown company"}</strong>
                    <div style={{ fontSize: "0.9rem", opacity: 0.72 }}>{feed.company?.language ?? "n/a"}</div>
                  </div>
                </div>
                <p style={{ margin: 0, wordBreak: "break-word" }}>{feed.url}</p>
                <div style={{ marginTop: "0.75rem", fontSize: "0.9rem", opacity: 0.72 }}>
                  Section: {feed.section ?? "General"} | Trust: {feed.trust_score.toFixed(2)}
                </div>
              </Surface>
            );
          })}
        </div>
      ) : null}
    </PageShell>
  );
}
