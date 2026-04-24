"use client";

import { useEffect, useState } from "react";

import {
  Button,
  Notice,
  PageShell,
  SourceCard,
  SourceModal,
  Surface,
} from "@/components";
import { getUserSourceById, listUserSources } from "@/services/api/user-sources.service";
import type { UserSourceDetail, UserSourcePageRead } from "@/types/sources";

import styles from "./page.module.css";

const PAGE_SIZE = 24;

export default function SourcesPage() {
  const [sourcesPage, setSourcesPage] = useState<UserSourcePageRead>({
    items: [],
    total: 0,
    limit: PAGE_SIZE,
    offset: 0,
  });
  const [loadingSources, setLoadingSources] = useState(true);
  const [sourcesError, setSourcesError] = useState<string | null>(null);
  const [selectedSourceId, setSelectedSourceId] = useState<number | null>(null);
  const [selectedSourceDetail, setSelectedSourceDetail] = useState<UserSourceDetail | null>(null);
  const [loadingSourceDetail, setLoadingSourceDetail] = useState(false);
  const [sourceDetailError, setSourceDetailError] = useState<string | null>(null);

  async function loadSources(offset: number) {
    setLoadingSources(true);
    setSourcesError(null);

    try {
      const payload = await listUserSources({ limit: PAGE_SIZE, offset });
      setSourcesPage(payload);
    } catch (error) {
      setSourcesError(
        error instanceof Error ? error.message : "Unexpected error while loading sources",
      );
    } finally {
      setLoadingSources(false);
    }
  }

  useEffect(() => {
    void loadSources(0);
  }, []);

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

  const hasPreviousPage = sourcesPage.offset > 0;
  const hasNextPage = sourcesPage.offset + sourcesPage.items.length < sourcesPage.total;
  const rangeLabel =
    sourcesPage.total === 0
      ? "0 sources"
      : `${sourcesPage.offset + 1}-${sourcesPage.offset + sourcesPage.items.length} of ${sourcesPage.total} sources`;

  return (
    <PageShell size="wide" className={styles.main}>
      <Surface className={styles.summaryPanel} tone="soft" padding="md">
        <div className={styles.summaryCopy}>
          <h2>Your feed snapshot</h2>
          <p>
            <strong>{rangeLabel}</strong>
          </p>
        </div>

        <div className={styles.pagination}>
          <Button
            variant="ghost"
            size="sm"
            disabled={!hasPreviousPage || loadingSources}
            onClick={() => void loadSources(Math.max(0, sourcesPage.offset - PAGE_SIZE))}
          >
            Previous
          </Button>
          <Button
            variant="ghost"
            size="sm"
            disabled={!hasNextPage || loadingSources}
            onClick={() => void loadSources(sourcesPage.offset + PAGE_SIZE)}
          >
            Next
          </Button>
        </div>
      </Surface>

      {sourcesError ? <Notice tone="danger">Source load error: {sourcesError}</Notice> : null}

      <Surface className={styles.gridPanel} tone="soft" padding="lg">
        {loadingSources && sourcesPage.items.length === 0 ? (
          <p className={styles.statusText}>Loading sources...</p>
        ) : null}

        {!loadingSources && !sourcesError && sourcesPage.items.length === 0 ? (
          <p className={styles.statusText}>No sources available right now.</p>
        ) : null}

        {sourcesPage.items.length > 0 ? (
          <div className={styles.grid}>
            {sourcesPage.items.map((source) => (
              <SourceCard
                key={source.id}
                sourceId={source.id}
                title={source.title}
                imageUrl={null}
                companyNames={source.company_names}
                authors={source.authors}
                publishedAt={source.published_at}
                onClick={setSelectedSourceId}
              />
            ))}
          </div>
        ) : null}
      </Surface>

      {selectedSourceId !== null ? (
        <SourceModal
          sourceDetail={selectedSourceDetail}
          loading={loadingSourceDetail}
          error={sourceDetailError}
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
