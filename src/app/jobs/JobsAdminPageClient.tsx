"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { Badge, Button, Notice, PageHeader, PageShell, Surface } from "@/components";
import {
  deleteJob,
  getJobEmbeddings,
  getJobFeeds,
  getJobsOverview,
  getJobSources,
  getJobStatus,
  getJobTasks,
} from "@/services/api/jobs.service";
import type {
  EmbeddingJobResultRead,
  JobDeleteRead,
  JobsOverviewRead,
  JobStatusRead,
  JobTaskRead,
  RssJobFeedRead,
  RssJobSourceRead,
  WorkerJobKind,
  WorkerJobStatus,
  WorkerTaskStatus,
} from "@/types/jobs";
import { formatSourceDate } from "@/utils/date";

import styles from "./page.module.css";

const REFRESH_INTERVAL_MS = 15_000;
const JOB_OVERVIEW_LIMIT = 100;
const JOB_PAGE_SIZE = 100;

type JobKindFilter = "all" | WorkerJobKind;
type JobStatusFilter = "all" | "running" | "completed" | "errors";
type JobTab = "tasks" | "feeds" | "sources" | "embeddings";

type PageState<T> = {
  items: T[];
  offset: number;
  hasNext: boolean;
  initialized: boolean;
  loading: boolean;
  error: string | null;
};

function createPageState<T>(): PageState<T> {
  return {
    items: [],
    offset: 0,
    hasNext: false,
    initialized: false,
    loading: false,
    error: null,
  };
}

function formatInteger(value: number | null): string {
  if (value === null) {
    return "n/a";
  }
  return new Intl.NumberFormat("fr-FR").format(value);
}

function formatPercent(value: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "percent",
    maximumFractionDigits: value >= 0.99 ? 0 : 1,
  }).format(value);
}

function clampPercentage(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.max(0, Math.min(100, value));
}

function resolveProgress(processed: number, total: number): number {
  if (total <= 0) {
    return 0;
  }
  return clampPercentage((processed / total) * 100);
}

function formatPageWindow(offset: number, count: number): string {
  if (count <= 0) {
    return "0 ligne";
  }
  return `${formatInteger(offset + 1)}-${formatInteger(offset + count)}`;
}

function jobKindLabel(jobKind: WorkerJobKind): string {
  if (jobKind === "rss_scrape") {
    return "RSS scrape";
  }
  return "Source embedding";
}

function jobStatusLabel(status: WorkerJobStatus): string {
  switch (status) {
    case "queued":
      return "Queued";
    case "processing":
      return "Processing";
    case "finalizing":
      return "Finalizing";
    case "completed":
      return "Completed";
    case "completed_with_errors":
      return "Completed with errors";
    case "failed":
      return "Failed";
    default:
      return status;
  }
}

function taskStatusLabel(status: WorkerTaskStatus): string {
  switch (status) {
    case "pending":
      return "Pending";
    case "processing":
      return "Processing";
    case "completed":
      return "Completed";
    case "failed":
      return "Failed";
    default:
      return status;
  }
}

function statusTone(status: WorkerJobStatus): "neutral" | "accent" | "success" | "warning" | "danger" {
  switch (status) {
    case "queued":
      return "neutral";
    case "processing":
      return "accent";
    case "finalizing":
      return "warning";
    case "completed":
      return "success";
    case "completed_with_errors":
      return "warning";
    case "failed":
      return "danger";
    default:
      return "neutral";
  }
}

function taskTone(status: WorkerTaskStatus): "neutral" | "accent" | "success" | "warning" | "danger" {
  switch (status) {
    case "pending":
      return "neutral";
    case "processing":
      return "accent";
    case "completed":
      return "success";
    case "failed":
      return "danger";
    default:
      return "neutral";
  }
}

function rssItemTone(
  status: "pending" | "success" | "not_modified" | "error",
): "neutral" | "success" | "warning" | "danger" {
  switch (status) {
    case "pending":
      return "neutral";
    case "success":
      return "success";
    case "not_modified":
      return "warning";
    case "error":
      return "danger";
    default:
      return "neutral";
  }
}

function isRunningStatus(status: WorkerJobStatus): boolean {
  return status === "queued" || status === "processing" || status === "finalizing";
}

function matchesStatusFilter(job: JobStatusRead, filter: JobStatusFilter): boolean {
  if (filter === "all") {
    return true;
  }
  if (filter === "running") {
    return isRunningStatus(job.status);
  }
  if (filter === "completed") {
    return job.status === "completed";
  }
  return job.status === "completed_with_errors" || job.status === "failed";
}

function buildDeleteMessage(job: JobStatusRead): string {
  return [
    `Supprimer définitivement le job '${job.job_id}' ?`,
    "",
    "Cette action supprime le job, ses tasks, ses task items et ses résultats bruts associés.",
    "Les données métiers déjà fusionnées par les finalizers ne sont pas retirées.",
  ].join("\n");
}

function resolveAvailableTabs(jobKind: WorkerJobKind): JobTab[] {
  if (jobKind === "rss_scrape") {
    return ["tasks", "feeds", "sources"];
  }
  return ["tasks", "embeddings"];
}

function tabLabel(tab: JobTab): string {
  switch (tab) {
    case "tasks":
      return "Tasks";
    case "feeds":
      return "Feeds";
    case "sources":
      return "Sources";
    case "embeddings":
      return "Embeddings";
    default:
      return tab;
  }
}

export default function AdminJobsPage() {
  const [overview, setOverview] = useState<JobsOverviewRead | null>(null);
  const [loadingOverview, setLoadingOverview] = useState<boolean>(true);
  const [refreshingOverview, setRefreshingOverview] = useState<boolean>(false);
  const [overviewError, setOverviewError] = useState<string | null>(null);

  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const selectedJobIdRef = useRef<string | null>(null);
  const [jobStatus, setJobStatus] = useState<JobStatusRead | null>(null);
  const [loadingJobStatus, setLoadingJobStatus] = useState<boolean>(false);
  const [refreshingJobStatus, setRefreshingJobStatus] = useState<boolean>(false);
  const [jobStatusError, setJobStatusError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<JobTab>("tasks");
  const [taskPage, setTaskPage] = useState<PageState<JobTaskRead>>(() => createPageState<JobTaskRead>());
  const [feedPage, setFeedPage] = useState<PageState<RssJobFeedRead>>(
    () => createPageState<RssJobFeedRead>(),
  );
  const [sourcePage, setSourcePage] = useState<PageState<RssJobSourceRead>>(
    () => createPageState<RssJobSourceRead>(),
  );
  const [embeddingPage, setEmbeddingPage] = useState<PageState<EmbeddingJobResultRead>>(
    () => createPageState<EmbeddingJobResultRead>(),
  );

  const [kindFilter, setKindFilter] = useState<JobKindFilter>("all");
  const [statusFilter, setStatusFilter] = useState<JobStatusFilter>("all");
  const [deletingJobId, setDeletingJobId] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<{
    id: number;
    tone: "info" | "danger";
    message: string;
  } | null>(null);

  useEffect(() => {
    selectedJobIdRef.current = selectedJobId;
  }, [selectedJobId]);

  const loadOverview = useCallback(async (silent: boolean) => {
    if (silent) {
      setRefreshingOverview(true);
    } else {
      setLoadingOverview(true);
    }
    setOverviewError(null);

    try {
      const payload = await getJobsOverview(JOB_OVERVIEW_LIMIT);
      setOverview(payload);
    } catch (loadError) {
      const message =
        loadError instanceof Error ? loadError.message : "Unexpected error while loading jobs";
      setOverviewError(message);
    } finally {
      if (silent) {
        setRefreshingOverview(false);
      } else {
        setLoadingOverview(false);
      }
    }
  }, []);

  const loadJobStatus = useCallback(async (jobId: string, silent: boolean) => {
    if (silent) {
      setRefreshingJobStatus(true);
    } else {
      setLoadingJobStatus(true);
    }
    setJobStatusError(null);

    try {
      const payload = await getJobStatus(jobId);
      if (selectedJobIdRef.current !== jobId) {
        return;
      }
      setJobStatus(payload);
    } catch (loadError) {
      if (selectedJobIdRef.current !== jobId) {
        return;
      }
      const message =
        loadError instanceof Error ? loadError.message : "Unexpected error while loading job";
      setJobStatusError(message);
      setJobStatus(null);
    } finally {
      if (selectedJobIdRef.current !== jobId) {
        return;
      }
      if (silent) {
        setRefreshingJobStatus(false);
      } else {
        setLoadingJobStatus(false);
      }
    }
  }, []);

  const loadTaskPage = useCallback(async (jobId: string, offset: number) => {
    setTaskPage((current) => ({
      ...current,
      loading: true,
      error: null,
    }));

    try {
      const items = await getJobTasks(jobId, {
        limit: JOB_PAGE_SIZE,
        offset,
      });
      if (selectedJobIdRef.current !== jobId) {
        return;
      }
      setTaskPage((current) =>
        items.length === 0 && offset > 0
          ? {
              ...current,
              hasNext: false,
              initialized: true,
              loading: false,
              error: null,
            }
          : {
              items,
              offset,
              hasNext: items.length === JOB_PAGE_SIZE,
              initialized: true,
              loading: false,
              error: null,
            },
      );
    } catch (loadError) {
      if (selectedJobIdRef.current !== jobId) {
        return;
      }
      const message =
        loadError instanceof Error ? loadError.message : "Unexpected error while loading tasks";
      setTaskPage((current) => ({
        ...current,
        loading: false,
        error: message,
      }));
    }
  }, []);

  const loadFeedPage = useCallback(async (jobId: string, offset: number) => {
    setFeedPage((current) => ({
      ...current,
      loading: true,
      error: null,
    }));

    try {
      const items = await getJobFeeds(jobId, {
        limit: JOB_PAGE_SIZE,
        offset,
      });
      if (selectedJobIdRef.current !== jobId) {
        return;
      }
      setFeedPage((current) =>
        items.length === 0 && offset > 0
          ? {
              ...current,
              hasNext: false,
              initialized: true,
              loading: false,
              error: null,
            }
          : {
              items,
              offset,
              hasNext: items.length === JOB_PAGE_SIZE,
              initialized: true,
              loading: false,
              error: null,
            },
      );
    } catch (loadError) {
      if (selectedJobIdRef.current !== jobId) {
        return;
      }
      const message =
        loadError instanceof Error ? loadError.message : "Unexpected error while loading feeds";
      setFeedPage((current) => ({
        ...current,
        loading: false,
        error: message,
      }));
    }
  }, []);

  const loadSourcePage = useCallback(async (jobId: string, offset: number) => {
    setSourcePage((current) => ({
      ...current,
      loading: true,
      error: null,
    }));

    try {
      const items = await getJobSources(jobId, {
        limit: JOB_PAGE_SIZE,
        offset,
      });
      if (selectedJobIdRef.current !== jobId) {
        return;
      }
      setSourcePage((current) =>
        items.length === 0 && offset > 0
          ? {
              ...current,
              hasNext: false,
              initialized: true,
              loading: false,
              error: null,
            }
          : {
              items,
              offset,
              hasNext: items.length === JOB_PAGE_SIZE,
              initialized: true,
              loading: false,
              error: null,
            },
      );
    } catch (loadError) {
      if (selectedJobIdRef.current !== jobId) {
        return;
      }
      const message =
        loadError instanceof Error ? loadError.message : "Unexpected error while loading sources";
      setSourcePage((current) => ({
        ...current,
        loading: false,
        error: message,
      }));
    }
  }, []);

  const loadEmbeddingPage = useCallback(async (jobId: string, offset: number) => {
    setEmbeddingPage((current) => ({
      ...current,
      loading: true,
      error: null,
    }));

    try {
      const items = await getJobEmbeddings(jobId, {
        limit: JOB_PAGE_SIZE,
        offset,
      });
      if (selectedJobIdRef.current !== jobId) {
        return;
      }
      setEmbeddingPage((current) =>
        items.length === 0 && offset > 0
          ? {
              ...current,
              hasNext: false,
              initialized: true,
              loading: false,
              error: null,
            }
          : {
              items,
              offset,
              hasNext: items.length === JOB_PAGE_SIZE,
              initialized: true,
              loading: false,
              error: null,
            },
      );
    } catch (loadError) {
      if (selectedJobIdRef.current !== jobId) {
        return;
      }
      const message =
        loadError instanceof Error ? loadError.message : "Unexpected error while loading embeddings";
      setEmbeddingPage((current) => ({
        ...current,
        loading: false,
        error: message,
      }));
    }
  }, []);

  useEffect(() => {
    void loadOverview(false);
  }, [loadOverview]);

  useEffect(() => {
    const timerId = window.setInterval(() => {
      void loadOverview(true);
    }, REFRESH_INTERVAL_MS);

    return () => {
      window.clearInterval(timerId);
    };
  }, [loadOverview]);

  const jobs = overview?.items ?? [];
  const filteredJobs = useMemo(
    () =>
      jobs.filter((job) => {
        if (kindFilter !== "all" && job.job_kind !== kindFilter) {
          return false;
        }
        return matchesStatusFilter(job, statusFilter);
      }),
    [jobs, kindFilter, statusFilter],
  );

  const runningJobsCount = useMemo(
    () => jobs.filter((job) => isRunningStatus(job.status)).length,
    [jobs],
  );
  const errorJobsCount = useMemo(
    () => jobs.filter((job) => job.status === "completed_with_errors" || job.status === "failed").length,
    [jobs],
  );

  useEffect(() => {
    if (filteredJobs.length === 0) {
      setSelectedJobId(null);
      setJobStatus(null);
      return;
    }

    if (!selectedJobId || !filteredJobs.some((job) => job.job_id === selectedJobId)) {
      setSelectedJobId(filteredJobs[0].job_id);
    }
  }, [filteredJobs, selectedJobId]);

  useEffect(() => {
    if (!selectedJobId) {
      setJobStatus(null);
      setActiveTab("tasks");
      setTaskPage(createPageState<JobTaskRead>());
      setFeedPage(createPageState<RssJobFeedRead>());
      setSourcePage(createPageState<RssJobSourceRead>());
      setEmbeddingPage(createPageState<EmbeddingJobResultRead>());
      return;
    }

    setJobStatus(null);
    setJobStatusError(null);
    setActiveTab("tasks");
    setTaskPage(createPageState<JobTaskRead>());
    setFeedPage(createPageState<RssJobFeedRead>());
    setSourcePage(createPageState<RssJobSourceRead>());
    setEmbeddingPage(createPageState<EmbeddingJobResultRead>());
    void loadJobStatus(selectedJobId, false);
  }, [selectedJobId, loadJobStatus]);

  const selectedJob = useMemo(
    () => {
      if (jobStatus && jobStatus.job_id === selectedJobId) {
        return jobStatus;
      }
      return jobs.find((job) => job.job_id === selectedJobId) ?? null;
    },
    [jobStatus, jobs, selectedJobId],
  );

  const availableTabs = useMemo<JobTab[]>(
    () => (selectedJob ? resolveAvailableTabs(selectedJob.job_kind) : ["tasks"]),
    [selectedJob],
  );

  useEffect(() => {
    if (!selectedJob) {
      return;
    }
    if (!availableTabs.includes(activeTab)) {
      setActiveTab("tasks");
    }
  }, [activeTab, availableTabs, selectedJob]);

  useEffect(() => {
    if (!selectedJobId || !selectedJob) {
      return;
    }

    if (activeTab === "tasks" && !taskPage.initialized && !taskPage.loading) {
      void loadTaskPage(selectedJobId, 0);
      return;
    }

    if (selectedJob.job_kind === "rss_scrape") {
      if (activeTab === "feeds" && !feedPage.initialized && !feedPage.loading) {
        void loadFeedPage(selectedJobId, 0);
      }
      if (activeTab === "sources" && !sourcePage.initialized && !sourcePage.loading) {
        void loadSourcePage(selectedJobId, 0);
      }
      return;
    }

    if (activeTab === "embeddings" && !embeddingPage.initialized && !embeddingPage.loading) {
      void loadEmbeddingPage(selectedJobId, 0);
    }
  }, [
    activeTab,
    embeddingPage.initialized,
    embeddingPage.loading,
    feedPage.initialized,
    feedPage.loading,
    loadEmbeddingPage,
    loadFeedPage,
    loadSourcePage,
    loadTaskPage,
    selectedJob,
    selectedJobId,
    sourcePage.initialized,
    sourcePage.loading,
    taskPage.initialized,
    taskPage.loading,
  ]);

  useEffect(() => {
    if (!selectedJobId) {
      return;
    }

    const timerId = window.setInterval(() => {
      void loadJobStatus(selectedJobId, true);

      if (activeTab === "tasks" && taskPage.initialized) {
        void loadTaskPage(selectedJobId, taskPage.offset);
      }
      if (activeTab === "feeds" && feedPage.initialized) {
        void loadFeedPage(selectedJobId, feedPage.offset);
      }
      if (activeTab === "sources" && sourcePage.initialized) {
        void loadSourcePage(selectedJobId, sourcePage.offset);
      }
      if (activeTab === "embeddings" && embeddingPage.initialized) {
        void loadEmbeddingPage(selectedJobId, embeddingPage.offset);
      }
    }, REFRESH_INTERVAL_MS);

    return () => {
      window.clearInterval(timerId);
    };
  }, [
    activeTab,
    embeddingPage.initialized,
    embeddingPage.offset,
    feedPage.initialized,
    feedPage.offset,
    loadEmbeddingPage,
    loadFeedPage,
    loadJobStatus,
    loadSourcePage,
    loadTaskPage,
    selectedJobId,
    sourcePage.initialized,
    sourcePage.offset,
    taskPage.initialized,
    taskPage.offset,
  ]);

  const refreshSelectedJob = useCallback(async () => {
    if (!selectedJobId) {
      return;
    }

    await loadJobStatus(selectedJobId, true);

    if (activeTab === "tasks" && taskPage.initialized) {
      await loadTaskPage(selectedJobId, taskPage.offset);
    }
    if (activeTab === "feeds" && feedPage.initialized) {
      await loadFeedPage(selectedJobId, feedPage.offset);
    }
    if (activeTab === "sources" && sourcePage.initialized) {
      await loadSourcePage(selectedJobId, sourcePage.offset);
    }
    if (activeTab === "embeddings" && embeddingPage.initialized) {
      await loadEmbeddingPage(selectedJobId, embeddingPage.offset);
    }
  }, [
    activeTab,
    embeddingPage.initialized,
    embeddingPage.offset,
    feedPage.initialized,
    feedPage.offset,
    loadEmbeddingPage,
    loadFeedPage,
    loadJobStatus,
    loadSourcePage,
    loadTaskPage,
    selectedJobId,
    sourcePage.initialized,
    sourcePage.offset,
    taskPage.initialized,
    taskPage.offset,
  ]);

  const handleDeleteJob = useCallback(async () => {
    if (!selectedJob) {
      return;
    }

    const confirmed = window.confirm(buildDeleteMessage(selectedJob));
    if (!confirmed) {
      return;
    }

    setDeletingJobId(selectedJob.job_id);

    try {
      const result: JobDeleteRead = await deleteJob(selectedJob.job_id);
      setActionNotice({
        id: Date.now(),
        tone: "info",
        message:
          `Job '${result.job_id}' supprimé. ` +
          `Tasks=${result.deleted_task_count}, items=${result.deleted_item_count}, résultats=${result.deleted_result_count}.`,
      });
      if (selectedJobIdRef.current === selectedJob.job_id) {
        setSelectedJobId(null);
        setJobStatus(null);
      }
      await loadOverview(true);
    } catch (deleteError) {
      const message = deleteError instanceof Error ? deleteError.message : "Unable to delete job";
      setActionNotice({
        id: Date.now(),
        tone: "danger",
        message: `Suppression échouée pour '${selectedJob.job_id}': ${message}`,
      });
    } finally {
      setDeletingJobId(null);
    }
  }, [loadOverview, selectedJob]);

  const renderPageControls = (
    page: PageState<unknown>,
    onPrevious: () => void,
    onNext: () => void,
    onRefresh: () => void,
  ) => (
    <div className={styles.sectionActions}>
      <span className={styles.sectionMeta}>
        Fenêtre: <strong>{formatPageWindow(page.offset, page.items.length)}</strong> par lots de{" "}
        <strong>{formatInteger(JOB_PAGE_SIZE)}</strong>
      </span>
      <div className={styles.sectionButtons}>
        <Button variant="secondary" size="sm" onClick={onRefresh} disabled={page.loading}>
          {page.loading ? "Chargement..." : "Actualiser la tranche"}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onPrevious}
          disabled={page.loading || page.offset === 0}
        >
          Précédent
        </Button>
        <Button variant="ghost" size="sm" onClick={onNext} disabled={page.loading || !page.hasNext}>
          Suivant
        </Button>
      </div>
    </div>
  );

  const renderActiveTab = () => {
    if (!selectedJobId || !selectedJob) {
      return null;
    }

    if (activeTab === "tasks") {
      return (
        <Surface className={styles.section} padding="md">
          <div className={styles.panelHeader}>
            <h3>Tasks</h3>
            <span>{formatInteger(selectedJob.task_total)} total</span>
          </div>
          {renderPageControls(
            taskPage,
            () => void loadTaskPage(selectedJobId, Math.max(0, taskPage.offset - JOB_PAGE_SIZE)),
            () => void loadTaskPage(selectedJobId, taskPage.offset + JOB_PAGE_SIZE),
            () => void loadTaskPage(selectedJobId, taskPage.offset),
          )}
          {taskPage.error ? <Notice tone="danger">{taskPage.error}</Notice> : null}
          {!taskPage.initialized && taskPage.loading ? (
            <p className={styles.placeholder}>Chargement des tasks...</p>
          ) : null}
          {taskPage.initialized && taskPage.items.length === 0 ? (
            <p className={styles.placeholder}>Aucune task associée à ce job.</p>
          ) : null}
          {taskPage.items.length > 0 ? (
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Task</th>
                    <th>Status</th>
                    <th>Items</th>
                    <th>Success</th>
                    <th>Error</th>
                    <th>Pending</th>
                    <th>Claimed</th>
                    <th>Lease expires</th>
                    <th>Completed</th>
                  </tr>
                </thead>
                <tbody>
                  {taskPage.items.map((task) => {
                    const pendingItems = Math.max(task.item_total - task.item_success - task.item_error, 0);
                    return (
                      <tr key={task.task_id}>
                        <td>#{task.task_id}</td>
                        <td>
                          <Badge tone={taskTone(task.status)}>{taskStatusLabel(task.status)}</Badge>
                        </td>
                        <td>{formatInteger(task.item_total)}</td>
                        <td>{formatInteger(task.item_success)}</td>
                        <td>{formatInteger(task.item_error)}</td>
                        <td>{formatInteger(pendingItems)}</td>
                        <td>{formatSourceDate(task.claimed_at, "full")}</td>
                        <td>{formatSourceDate(task.claim_expires_at, "full")}</td>
                        <td>{formatSourceDate(task.completed_at, "full")}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : null}
        </Surface>
      );
    }

    if (activeTab === "feeds") {
      return (
        <Surface className={styles.section} padding="md">
          <div className={styles.panelHeader}>
            <h3>Feed results</h3>
            <span>Chargement progressif</span>
          </div>
          <Notice tone="info">
            Cette vue charge uniquement une tranche de {formatInteger(JOB_PAGE_SIZE)} lignes à la fois
            pour éviter les gels du navigateur sur les gros jobs.
          </Notice>
          {renderPageControls(
            feedPage,
            () => void loadFeedPage(selectedJobId, Math.max(0, feedPage.offset - JOB_PAGE_SIZE)),
            () => void loadFeedPage(selectedJobId, feedPage.offset + JOB_PAGE_SIZE),
            () => void loadFeedPage(selectedJobId, feedPage.offset),
          )}
          {feedPage.error ? <Notice tone="danger">{feedPage.error}</Notice> : null}
          {!feedPage.initialized && feedPage.loading ? (
            <p className={styles.placeholder}>Chargement des résultats feed...</p>
          ) : null}
          {feedPage.initialized && feedPage.items.length === 0 ? (
            <p className={styles.placeholder}>Aucun résultat feed pour ce job.</p>
          ) : null}
          {feedPage.items.length > 0 ? (
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Task</th>
                    <th>Feed</th>
                    <th>Status</th>
                    <th>HTTP</th>
                    <th>Fetchprotection</th>
                    <th>Last update</th>
                    <th>Last article</th>
                    <th>Error</th>
                  </tr>
                </thead>
                <tbody>
                  {feedPage.items.map((feed) => (
                    <tr key={`${feed.task_id}-${feed.feed_id}`}>
                      <td>#{feed.task_id}</td>
                      <td className={styles.detailCell}>{feed.feed_url}</td>
                      <td>
                        <Badge tone={rssItemTone(feed.status)}>{feed.status}</Badge>
                      </td>
                      <td>{feed.status_code ?? "n/a"}</td>
                      <td>
                        {feed.fetchprotection_used ?? "n/a"}
                        {feed.resolved_fetchprotection !== null
                          ? ` -> ${feed.resolved_fetchprotection}`
                          : ""}
                      </td>
                      <td>{formatSourceDate(feed.last_feed_update, "full")}</td>
                      <td>{formatSourceDate(feed.last_article_published_at, "full")}</td>
                      <td className={styles.detailCell}>{feed.error_message ?? "n/a"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </Surface>
      );
    }

    if (activeTab === "sources") {
      return (
        <Surface className={styles.section} padding="md">
          <div className={styles.panelHeader}>
            <h3>Sources</h3>
            <span>Chargement progressif</span>
          </div>
          <Notice tone="info">
            Cette vue charge une seule tranche à la fois. Utilisez la pagination pour inspecter les gros
            jobs sans saturer le navigateur.
          </Notice>
          {renderPageControls(
            sourcePage,
            () => void loadSourcePage(selectedJobId, Math.max(0, sourcePage.offset - JOB_PAGE_SIZE)),
            () => void loadSourcePage(selectedJobId, sourcePage.offset + JOB_PAGE_SIZE),
            () => void loadSourcePage(selectedJobId, sourcePage.offset),
          )}
          {sourcePage.error ? <Notice tone="danger">{sourcePage.error}</Notice> : null}
          {!sourcePage.initialized && sourcePage.loading ? (
            <p className={styles.placeholder}>Chargement des sources...</p>
          ) : null}
          {sourcePage.initialized && sourcePage.items.length === 0 ? (
            <p className={styles.placeholder}>Aucune source brute remontée pour ce job.</p>
          ) : null}
          {sourcePage.items.length > 0 ? (
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Task</th>
                    <th>Feed</th>
                    <th>Title</th>
                    <th>URL</th>
                    <th>Published</th>
                    <th>Author</th>
                  </tr>
                </thead>
                <tbody>
                  {sourcePage.items.map((source) => (
                    <tr key={`${source.result_feed_id}-${source.url}`}>
                      <td>#{source.task_id}</td>
                      <td className={styles.detailCell}>{source.feed_url}</td>
                      <td className={styles.detailCell}>{source.title}</td>
                      <td className={styles.detailCell}>{source.url}</td>
                      <td>{formatSourceDate(source.published_at, "full")}</td>
                      <td>{source.author ?? "n/a"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </Surface>
      );
    }

    return (
      <Surface className={styles.section} padding="md">
        <div className={styles.panelHeader}>
          <h3>Embedding results</h3>
          <span>Chargement progressif</span>
        </div>
        <Notice tone="info">
          La vue est paginée à {formatInteger(JOB_PAGE_SIZE)} lignes. Le backend n’expose pas encore le
          détail d’erreur par source pour les tasks embedding échouées.
        </Notice>
        {renderPageControls(
          embeddingPage,
          () => void loadEmbeddingPage(selectedJobId, Math.max(0, embeddingPage.offset - JOB_PAGE_SIZE)),
          () => void loadEmbeddingPage(selectedJobId, embeddingPage.offset + JOB_PAGE_SIZE),
          () => void loadEmbeddingPage(selectedJobId, embeddingPage.offset),
        )}
        {embeddingPage.error ? <Notice tone="danger">{embeddingPage.error}</Notice> : null}
        {!embeddingPage.initialized && embeddingPage.loading ? (
          <p className={styles.placeholder}>Chargement des embeddings...</p>
        ) : null}
        {embeddingPage.initialized && embeddingPage.items.length === 0 ? (
          <p className={styles.placeholder}>Aucun embedding brut disponible pour ce job.</p>
        ) : null}
        {embeddingPage.items.length > 0 ? (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Task</th>
                  <th>Source</th>
                  <th>Status</th>
                  <th>Model</th>
                  <th>Dimensions</th>
                  <th>Worker</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {embeddingPage.items.map((embedding) => (
                  <tr key={`${embedding.task_id}-${embedding.source_id}`}>
                    <td>#{embedding.task_id}</td>
                    <td className={styles.detailCell}>
                      <strong>{embedding.title}</strong>
                      <br />
                      <span>{embedding.source_url}</span>
                    </td>
                    <td>
                      <Badge tone={embedding.status === "success" ? "success" : "danger"}>
                        {embedding.status}
                      </Badge>
                    </td>
                    <td>{embedding.model_code}</td>
                    <td>{formatInteger(embedding.embedding_dimensions)}</td>
                    <td>{embedding.worker_id ?? "n/a"}</td>
                    <td>{formatSourceDate(embedding.created_at, "full")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </Surface>
    );
  };

  return (
    <PageShell size="wide" className={styles.main}>
      <PageHeader
        title="Jobs"
        description="Suivez les jobs RSS et embedding, voyez l’avancement task par task, inspectez les résultats sans charger des milliers de lignes d’un coup, et supprimez les exécutions obsolètes."
      />

      <Surface className={styles.toolbar} padding="sm">
        <div className={styles.meta}>
          <p>Jobs: {formatInteger(jobs.length)}</p>
          <p>En cours: {formatInteger(runningJobsCount)}</p>
          <p>Avec erreurs: {formatInteger(errorJobsCount)}</p>
          <p>
            Dernière mise à jour:{" "}
            <strong>{formatSourceDate(overview?.generated_at ?? null, "full")}</strong>
          </p>
        </div>
        <div className={styles.toolbarActions}>
          <Button
            variant="secondary"
            onClick={() => void loadOverview(true)}
            disabled={loadingOverview || refreshingOverview}
          >
            {refreshingOverview ? "Actualisation..." : "Actualiser"}
          </Button>
          <Button
            variant="ghost"
            onClick={() => void refreshSelectedJob()}
            disabled={!selectedJobId || loadingJobStatus || refreshingJobStatus}
          >
            {refreshingJobStatus ? "Reload..." : "Reload job"}
          </Button>
        </div>
      </Surface>

      <Surface className={styles.filters} padding="sm">
        <div className={styles.filterGroup}>
          <span className={styles.filterLabel}>Type</span>
          <Button variant="chip" size="sm" active={kindFilter === "all"} onClick={() => setKindFilter("all")}>
            Tous
          </Button>
          <Button
            variant="chip"
            size="sm"
            active={kindFilter === "rss_scrape"}
            onClick={() => setKindFilter("rss_scrape")}
          >
            RSS
          </Button>
          <Button
            variant="chip"
            size="sm"
            active={kindFilter === "source_embedding"}
            onClick={() => setKindFilter("source_embedding")}
          >
            Embedding
          </Button>
        </div>

        <div className={styles.filterGroup}>
          <span className={styles.filterLabel}>Statut</span>
          <Button variant="chip" size="sm" active={statusFilter === "all"} onClick={() => setStatusFilter("all")}>
            Tous
          </Button>
          <Button
            variant="chip"
            size="sm"
            active={statusFilter === "running"}
            onClick={() => setStatusFilter("running")}
          >
            En cours
          </Button>
          <Button
            variant="chip"
            size="sm"
            active={statusFilter === "completed"}
            onClick={() => setStatusFilter("completed")}
          >
            Terminés
          </Button>
          <Button
            variant="chip"
            size="sm"
            active={statusFilter === "errors"}
            onClick={() => setStatusFilter("errors")}
          >
            Avec erreurs
          </Button>
        </div>
      </Surface>

      {overviewError ? <Notice tone="danger">{overviewError}</Notice> : null}
      {jobStatusError ? <Notice tone="danger">{jobStatusError}</Notice> : null}
      {actionNotice ? (
        <Notice key={actionNotice.id} tone={actionNotice.tone}>
          {actionNotice.message}
        </Notice>
      ) : null}

      <section className={styles.workspace}>
        <Surface className={styles.listPanel} padding="md">
          <div className={styles.panelHeader}>
            <h2>Liste</h2>
            <span>{formatInteger(filteredJobs.length)} visibles</span>
          </div>

          {loadingOverview && overview === null ? (
            <p className={styles.placeholder}>Chargement des jobs...</p>
          ) : null}

          {filteredJobs.length === 0 ? (
            <p className={styles.placeholder}>Aucun job ne correspond aux filtres.</p>
          ) : (
            <div className={styles.jobList}>
              {filteredJobs.map((job) => {
                const progress = resolveProgress(job.task_processed, job.task_total);
                return (
                  <button
                    key={job.job_id}
                    type="button"
                    className={
                      selectedJobId === job.job_id
                        ? `${styles.jobCard} ${styles.jobCardActive}`
                        : styles.jobCard
                    }
                    onClick={() => setSelectedJobId(job.job_id)}
                  >
                    <div className={styles.jobCardTop}>
                      <div className={styles.jobIdentity}>
                        <strong>{job.job_id}</strong>
                        <span>{jobKindLabel(job.job_kind)}</span>
                      </div>
                      <Badge tone={statusTone(job.status)}>{jobStatusLabel(job.status)}</Badge>
                    </div>
                    <p className={styles.jobCardMeta}>
                      Demandé le {formatSourceDate(job.requested_at, "full")}
                    </p>
                    <div className={styles.progressMeta}>
                      <span>
                        Tasks {formatInteger(job.task_processed)} / {formatInteger(job.task_total)}
                      </span>
                      <span>{formatPercent(progress / 100)}</span>
                    </div>
                    <div className={styles.progressTrack} aria-hidden="true">
                      <div className={styles.progressBar} style={{ width: `${progress}%` }} />
                    </div>
                    <div className={styles.jobCounters}>
                      <span>OK {formatInteger(job.item_success)}</span>
                      <span>Errors {formatInteger(job.item_error)}</span>
                      <span>Total {formatInteger(job.item_total)}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </Surface>

        <div className={styles.detailStack}>
          {!selectedJob ? (
            <Surface padding="md">
              <p className={styles.placeholder}>Sélectionnez un job pour voir son détail.</p>
            </Surface>
          ) : (
            <>
              <Surface className={styles.detailHeader} padding="md">
                <div className={styles.detailIdentity}>
                  <div className={styles.detailTitleRow}>
                    <h2>{selectedJob.job_id}</h2>
                    <div className={styles.badgeRow}>
                      <Badge tone="neutral">{jobKindLabel(selectedJob.job_kind)}</Badge>
                      <Badge tone={statusTone(selectedJob.status)}>
                        {jobStatusLabel(selectedJob.status)}
                      </Badge>
                    </div>
                  </div>
                  <p>
                    Demandé: <strong>{formatSourceDate(selectedJob.requested_at, "full")}</strong>
                  </p>
                  <p>
                    Démarré: <strong>{formatSourceDate(selectedJob.started_at, "full")}</strong>
                  </p>
                  <p>
                    Fini: <strong>{formatSourceDate(selectedJob.finished_at, "full")}</strong>
                  </p>
                  <p>
                    Finalisé: <strong>{formatSourceDate(selectedJob.finalized_at, "full")}</strong>
                  </p>
                </div>

                <div className={styles.detailActions}>
                  <Button
                    variant="secondary"
                    onClick={() => void refreshSelectedJob()}
                    disabled={!selectedJobId || loadingJobStatus || refreshingJobStatus}
                  >
                    {refreshingJobStatus ? "Actualisation..." : "Actualiser ce job"}
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => void handleDeleteJob()}
                    disabled={deletingJobId === selectedJob.job_id}
                  >
                    {deletingJobId === selectedJob.job_id ? "Suppression..." : "Supprimer le job"}
                  </Button>
                </div>
              </Surface>

              <section className={styles.kpiGrid}>
                <Surface className={styles.kpiCard} padding="sm">
                  <p className={styles.kpiLabel}>Tasks</p>
                  <p className={styles.kpiValue}>
                    {formatInteger(selectedJob.task_processed)} / {formatInteger(selectedJob.task_total)}
                  </p>
                </Surface>
                <Surface className={styles.kpiCard} padding="sm">
                  <p className={styles.kpiLabel}>Items OK</p>
                  <p className={styles.kpiValue}>{formatInteger(selectedJob.item_success)}</p>
                </Surface>
                <Surface className={styles.kpiCard} padding="sm">
                  <p className={styles.kpiLabel}>Items erreur</p>
                  <p className={styles.kpiValue}>{formatInteger(selectedJob.item_error)}</p>
                </Surface>
                <Surface className={styles.kpiCard} padding="sm">
                  <p className={styles.kpiLabel}>Progression</p>
                  <p className={styles.kpiValue}>
                    {formatPercent(resolveProgress(selectedJob.task_processed, selectedJob.task_total) / 100)}
                  </p>
                </Surface>
              </section>

              <Surface className={styles.tabBar} padding="sm">
                {availableTabs.map((tab) => (
                  <Button
                    key={tab}
                    variant="chip"
                    size="sm"
                    active={activeTab === tab}
                    onClick={() => setActiveTab(tab)}
                  >
                    {tabLabel(tab)}
                  </Button>
                ))}
              </Surface>

              {loadingJobStatus && jobStatus === null ? (
                <Surface padding="md">
                  <p className={styles.placeholder}>Chargement du détail du job...</p>
                </Surface>
              ) : null}

              {renderActiveTab()}
            </>
          )}
        </div>
      </section>
    </PageShell>
  );
}
