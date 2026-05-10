"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import {
  Button,
  Field,
  Notice,
  PageShell,
  SearchBar,
  SelectInput,
  SourceModal,
  TextInput,
} from "@/components";
import {
  getUserSourceById,
  listUserSources,
  searchUserSources,
} from "@/services/api/user-sources.service";
import type {
  AppliedSearchFilter,
  SourceAuthor,
  UserSourceDetail,
  UserSourceListItem,
  UserSourceSearchItem,
} from "@/types/sources";
import { formatSourceDate } from "@/utils/date";

import styles from "./page.module.css";

const PAGE_SIZE = 24;

type SearchFilters = {
  country: string;
  companyId: string;
  authorId: string;
  period: string;
};

type DisplaySource = UserSourceListItem | UserSourceSearchItem;

const EMPTY_FILTERS: SearchFilters = {
  country: "",
  companyId: "",
  authorId: "",
  period: "all",
};

function readFilters(params: URLSearchParams): SearchFilters {
  return {
    country: params.get("country") ?? "",
    companyId: params.get("companyId") ?? params.get("company_id") ?? "",
    authorId: params.get("authorId") ?? params.get("author_id") ?? "",
    period: params.get("period") ?? "all",
  };
}

function hasActiveFilters(filters: SearchFilters): boolean {
  return (
    filters.country.trim().length > 0
    || filters.companyId.trim().length > 0
    || filters.authorId.trim().length > 0
    || filters.period !== "all"
  );
}

function toPositiveNumber(value: string): number | undefined {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return undefined;
  }
  return parsed;
}

function isSearchItem(source: DisplaySource): source is UserSourceSearchItem {
  return "score" in source;
}

function buildResultLabel(itemCount: number, isSearchActive: boolean): string {
  if (itemCount === 0) {
    return isSearchActive ? "No matching articles" : "No recent articles";
  }
  return isSearchActive ? `${itemCount} matching articles` : `${itemCount} recent articles`;
}

export function SourcesClientPage() {
  const router = useRouter();
  const pathname = usePathname() ?? "/sources";
  const searchParams = useSearchParams();
  const searchSignature = searchParams?.toString() ?? "";
  const requestSerial = useRef(0);

  const [draftQuery, setDraftQuery] = useState("");
  const [committedQuery, setCommittedQuery] = useState("");
  const [filters, setFilters] = useState<SearchFilters>(EMPTY_FILTERS);
  const [items, setItems] = useState<DisplaySource[]>([]);
  const [appliedFilters, setAppliedFilters] = useState<AppliedSearchFilter[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [loadingSources, setLoadingSources] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [sourcesError, setSourcesError] = useState<string | null>(null);
  const [selectedSourceId, setSelectedSourceId] = useState<number | null>(null);
  const [selectedSourceDetail, setSelectedSourceDetail] = useState<UserSourceDetail | null>(null);
  const [loadingSourceDetail, setLoadingSourceDetail] = useState(false);
  const [sourceDetailError, setSourceDetailError] = useState<string | null>(null);

  const isSearchActive = useMemo(
    () => committedQuery.trim().length > 0 || hasActiveFilters(filters),
    [committedQuery, filters],
  );

  function replaceUrl(nextQuery: string, nextFilters: SearchFilters) {
    const nextParams = new URLSearchParams();
    if (nextQuery.trim()) {
      nextParams.set("q", nextQuery.trim());
    }
    if (nextFilters.country.trim()) {
      nextParams.set("country", nextFilters.country.trim());
    }
    if (nextFilters.companyId.trim()) {
      nextParams.set("companyId", nextFilters.companyId.trim());
    }
    if (nextFilters.authorId.trim()) {
      nextParams.set("authorId", nextFilters.authorId.trim());
    }
    if (nextFilters.period !== "all") {
      nextParams.set("period", nextFilters.period);
    }
    const href = nextParams.toString() ? `${pathname}?${nextParams.toString()}` : pathname;
    if (`${pathname}${searchSignature ? `?${searchSignature}` : ""}` !== href) {
      router.replace(href, { scroll: false });
    }
  }

  async function loadSourcesPage(
    nextQuery: string,
    nextFilters: SearchFilters,
    options: { append: boolean },
  ) {
    const serial = ++requestSerial.current;
    const active = nextQuery.trim().length > 0 || hasActiveFilters(nextFilters);
    const { append } = options;
    const offset = append ? items.length : 0;

    if (append) {
      setLoadingMore(true);
    } else {
      setLoadingSources(true);
    }
    setSourcesError(null);

    try {
      if (active) {
        const payload = await searchUserSources({
          q: nextQuery,
          limit: PAGE_SIZE,
          offset,
          country: nextFilters.country || undefined,
          companyId: toPositiveNumber(nextFilters.companyId),
          authorId: toPositiveNumber(nextFilters.authorId),
          period: nextFilters.period,
        });
        if (serial !== requestSerial.current) {
          return;
        }
        setItems((currentItems) => (append ? [...currentItems, ...payload.items] : payload.items));
        setAppliedFilters(payload.applied_filters);
        setHasMore(payload.has_more);
      } else {
        const payload = await listUserSources({ limit: PAGE_SIZE, offset });
        if (serial !== requestSerial.current) {
          return;
        }
        setItems((currentItems) => (append ? [...currentItems, ...payload.items] : payload.items));
        setAppliedFilters([]);
        setHasMore(payload.offset + payload.items.length < payload.total);
      }
    } catch (error) {
      if (serial === requestSerial.current) {
        setSourcesError(
          error instanceof Error ? error.message : "Unexpected error while loading sources",
        );
      }
    } finally {
      if (serial === requestSerial.current) {
        setLoadingSources(false);
        setLoadingMore(false);
      }
    }
  }

  useEffect(() => {
    const params = new URLSearchParams(searchSignature);
    const nextQuery = params.get("q") ?? "";
    const nextFilters = readFilters(params);
    setDraftQuery(nextQuery);
    setCommittedQuery(nextQuery);
    setFilters(nextFilters);
    void loadSourcesPage(nextQuery, nextFilters, { append: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchSignature]);

  useEffect(() => {
    if (selectedSourceId === null) {
      return;
    }

    let isCancelled = false;
    setLoadingSourceDetail(true);
    setSourceDetailError(null);
    setSelectedSourceDetail(null);

    void getUserSourceById(selectedSourceId)
      .then((payload) => {
        if (!isCancelled) {
          setSelectedSourceDetail(payload);
        }
      })
      .catch((error: unknown) => {
        if (!isCancelled) {
          setSourceDetailError(
            error instanceof Error
              ? error.message
              : "Unexpected error while loading source detail",
          );
        }
      })
      .finally(() => {
        if (!isCancelled) {
          setLoadingSourceDetail(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [selectedSourceId]);

  useEffect(() => {
    if (selectedSourceId === null) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [selectedSourceId]);

  function updateFilter(field: keyof SearchFilters, value: string) {
    const nextFilters = { ...filters, [field]: value };
    setFilters(nextFilters);
    setCommittedQuery(draftQuery);
    replaceUrl(draftQuery, nextFilters);
  }

  function removeAppliedFilter(field: AppliedSearchFilter["field"]) {
    const nextFilters = {
      ...filters,
      ...(field === "country" ? { country: "" } : {}),
      ...(field === "company_id" ? { companyId: "" } : {}),
      ...(field === "author_id" ? { authorId: "" } : {}),
      ...(field === "published_period" ? { period: "all" } : {}),
    };
    setFilters(nextFilters);
    setCommittedQuery(draftQuery);
    replaceUrl(draftQuery, nextFilters);
  }

  function handleAuthorSelect(author: SourceAuthor) {
    const nextFilters = { ...filters, authorId: String(author.id) };
    setSelectedSourceId(null);
    setSelectedSourceDetail(null);
    setFilters(nextFilters);
    setCommittedQuery(draftQuery);
    replaceUrl(draftQuery, nextFilters);
  }

  function commitSearch() {
    setCommittedQuery(draftQuery);
    replaceUrl(draftQuery, filters);
  }

  const resultLabel = buildResultLabel(items.length, isSearchActive);

  return (
    <PageShell size="wide" className={styles.main}>
      <section className={styles.searchPanel}>
        <SearchBar
          value={draftQuery}
          onChange={(event) => setDraftQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              commitSearch();
            }
          }}
          placeholder="Search articles, publishers, authors or dates"
          shortcutHint="⌘K"
          enableShortcut
          aria-label="Search sources"
        />

        <div className={styles.filterGrid}>
          <Field label="Country" htmlFor="source-country" labelTone="regular">
            <TextInput
              id="source-country"
              appearance="subtle"
              value={filters.country}
              placeholder="fr"
              maxLength={2}
              onChange={(event) => updateFilter("country", event.target.value)}
            />
          </Field>
          <Field label="Period" htmlFor="source-period" labelTone="regular">
            <SelectInput
              id="source-period"
              value={filters.period}
              onChange={(event) => updateFilter("period", event.target.value)}
            >
              <option value="all">All</option>
              <option value="1h">1h</option>
              <option value="24h">24h</option>
              <option value="7d">7D</option>
              <option value="1m">1M</option>
              <option value="1y">1Y</option>
            </SelectInput>
          </Field>
        </div>

        {appliedFilters.length > 0 ? (
          <div className={styles.chips} aria-label="Applied filters">
            {appliedFilters.map((filter) => (
              <button
                key={`${filter.field}-${filter.value}`}
                type="button"
                className={styles.filterChip}
                onClick={() => removeAppliedFilter(filter.field)}
              >
                <span>{filter.label}</span>
                <span aria-hidden="true">×</span>
              </button>
            ))}
          </div>
        ) : null}
      </section>

      <section className={styles.resultsPanel}>
        <div className={styles.resultsHeader}>
          <h2>{resultLabel}</h2>
          {loadingSources ? <span>Loading...</span> : null}
        </div>

        {sourcesError ? <Notice tone="danger">Source load error: {sourcesError}</Notice> : null}

        {!loadingSources && !sourcesError && items.length === 0 ? (
          <p className={styles.statusText}>
            {isSearchActive ? "No source matches this search." : "No sources available right now."}
          </p>
        ) : null}

        {items.length > 0 ? (
          <div className={styles.resultList}>
            {items.map((source) => (
              <button
                key={source.id}
                type="button"
                className={styles.resultCard}
                onClick={() => setSelectedSourceId(source.id)}
              >
                <div className={styles.cardMeta}>
                  <span>{source.company_names.length ? source.company_names.join(", ") : "Unknown publisher"}</span>
                  <time dateTime={source.published_at ?? undefined}>
                    {formatSourceDate(source.published_at, "relative")}
                  </time>
                </div>
                <h3>{source.title}</h3>
                {isSearchItem(source) && source.summary ? (
                  <p className={styles.summary}>{source.summary}</p>
                ) : null}
                <div className={styles.cardFooter}>
                  <span>{source.authors[0]?.name ? `by ${source.authors[0].name}` : "Unknown author"}</span>
                  <span>{formatSourceDate(source.published_at, "day_month_year")}</span>
                </div>
                {isSearchItem(source) ? (
                  <div className={styles.matchTags}>
                    {source.feed_sections.slice(0, 3).map((section) => (
                      <span key={section}>{section}</span>
                    ))}
                    {source.matched_by.map((match) => (
                      <span key={match}>{match}</span>
                    ))}
                  </div>
                ) : null}
              </button>
            ))}
          </div>
        ) : null}

        {hasMore ? (
          <div className={styles.loadMoreRow}>
            <Button
              variant="secondary"
              disabled={loadingSources || loadingMore}
              onClick={() => void loadSourcesPage(committedQuery, filters, { append: true })}
            >
              {loadingMore ? "Loading..." : "Load more"}
            </Button>
          </div>
        ) : null}
      </section>

      {selectedSourceId !== null ? (
        <SourceModal
          sourceDetail={selectedSourceDetail}
          loading={loadingSourceDetail}
          error={sourceDetailError}
          onAuthorSelect={handleAuthorSelect}
          onClose={() => {
            setSelectedSourceId(null);
            setSelectedSourceDetail(null);
            setSourceDetailError(null);
            setLoadingSourceDetail(false);
          }}
        />
      ) : null}
    </PageShell>
  );
}
