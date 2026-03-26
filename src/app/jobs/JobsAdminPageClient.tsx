"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  Badge,
  Button,
  Field,
  Notice,
  PageHeader,
  PageShell,
  SelectInput,
  Surface,
} from "@/components";
import { getJobsOverview, getJobStatus, getJobTasks } from "@/services/api/jobs.service";
import type {
  JobsOverviewRead,
  JobStatusRead,
  JobTaskRead,
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
  const [taskPage, setTaskPage] = useState<PageState<JobTaskRead>>(() => createPageState<JobTaskRead>());

  const [kindFilter, setKindFilter] = useState<JobKindFilter>("all");
  const [statusFilter, setStatusFilter] = useState<JobStatusFilter>("all");

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
    () =>
      jobs.filter((job) => job.status === "completed_with_errors" || job.status === "failed")
        .length,
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
      setTaskPage(createPageState<JobTaskRead>());
      return;
    }

    setJobStatus(null);
    setJobStatusError(null);
    setTaskPage(createPageState<JobTaskRead>());
    void loadJobStatus(selectedJobId, false);
  }, [selectedJobId, loadJobStatus]);

  const selectedJob = useMemo(() => {
    if (jobStatus && jobStatus.job_id === selectedJobId) {
      return jobStatus;
    }
    return jobs.find((job) => job.job_id === selectedJobId) ?? null;
  }, [jobStatus, jobs, selectedJobId]);

  useEffect(() => {
    if (!selectedJobId || !selectedJob) {
      return;
    }
    if (!taskPage.initialized && !taskPage.loading) {
      void loadTaskPage(selectedJobId, 0);
    }
  }, [loadTaskPage, selectedJob, selectedJobId, taskPage.initialized, taskPage.loading]);

  useEffect(() => {
    if (!selectedJobId) {
      return;
    }

    const timerId = window.setInterval(() => {
      void loadJobStatus(selectedJobId, true);
      if (taskPage.initialized) {
        void loadTaskPage(selectedJobId, taskPage.offset);
      }
    }, REFRESH_INTERVAL_MS);

    return () => {
      window.clearInterval(timerId);
    };
  }, [loadJobStatus, loadTaskPage, selectedJobId, taskPage.initialized, taskPage.offset]);

  const refreshSelectedJob = useCallback(async () => {
    if (!selectedJobId) {
      return;
    }
    await loadJobStatus(selectedJobId, true);
    if (taskPage.initialized) {
      await loadTaskPage(selectedJobId, taskPage.offset);
    }
  }, [loadJobStatus, loadTaskPage, selectedJobId, taskPage.initialized, taskPage.offset]);

  return (
    <PageShell size="wide" className={styles.main}>
      <PageHeader
        title="Jobs"
        description="Vue recentrée sur la queue d’ingestion: overview des jobs, statut détaillé et liste paginée des tasks."
      />

      <Surface className={styles.toolbar} padding="sm">
        <div className={styles.meta}>
          <p>Jobs: {formatInteger(jobs.length)}</p>
          <p>Running: {formatInteger(runningJobsCount)}</p>
          <p>With errors: {formatInteger(errorJobsCount)}</p>
          <p>
            Dernière mise à jour:{" "}
            <strong>{formatSourceDate(overview?.generated_at ?? null, "full")}</strong>
          </p>
        </div>
        <div className={styles.toolbarActions}>
          <Button variant="secondary" onClick={() => void loadOverview(true)} disabled={loadingOverview || refreshingOverview}>
            {refreshingOverview ? "Actualisation..." : "Actualiser"}
          </Button>
          <Button
            variant="ghost"
            onClick={() => void refreshSelectedJob()}
            disabled={!selectedJobId || loadingJobStatus || refreshingJobStatus}
          >
            {refreshingJobStatus ? "Mise à jour..." : "Rafraîchir le job"}
          </Button>
        </div>
      </Surface>

      <Surface className={styles.filters} padding="sm">
        <div className={styles.filterGroup}>
          <Field label="Job kind" htmlFor="job-kind-filter">
            <SelectInput
              id="job-kind-filter"
              value={kindFilter}
              onChange={(event) => setKindFilter(event.target.value as JobKindFilter)}
            >
              <option value="all">All</option>
              <option value="rss_scrape">RSS scrape</option>
              <option value="source_embedding">Source embedding</option>
            </SelectInput>
          </Field>
          <Field label="Status" htmlFor="job-status-filter">
            <SelectInput
              id="job-status-filter"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as JobStatusFilter)}
            >
              <option value="all">All</option>
              <option value="running">Running</option>
              <option value="completed">Completed</option>
              <option value="errors">With errors</option>
            </SelectInput>
          </Field>
        </div>
      </Surface>

      {overviewError ? <Notice tone="danger">{overviewError}</Notice> : null}

      <section className={styles.workspace}>
        <Surface className={styles.listPanel} padding="md">
          <div className={styles.panelHeader}>
            <h2>Jobs</h2>
            <span>{formatInteger(filteredJobs.length)} visible</span>
          </div>
          {loadingOverview && overview === null ? (
            <p className={styles.placeholder}>Chargement des jobs...</p>
          ) : null}
          {!loadingOverview && filteredJobs.length === 0 ? (
            <p className={styles.placeholder}>Aucun job ne correspond aux filtres courants.</p>
          ) : null}
          <div className={styles.jobList}>
            {filteredJobs.map((job) => {
              const isActive = job.job_id === selectedJobId;
              const progress = resolveProgress(job.task_processed, job.task_total);
              return (
                <button
                  key={job.job_id}
                  type="button"
                  className={isActive ? `${styles.jobCard} ${styles.jobCardActive}` : styles.jobCard}
                  onClick={() => setSelectedJobId(job.job_id)}
                >
                  <div className={styles.jobCardTop}>
                    <div className={styles.jobIdentity}>
                      <strong>{jobKindLabel(job.job_kind)}</strong>
                      <span>{job.job_id}</span>
                    </div>
                    <Badge tone={statusTone(job.status)}>{jobStatusLabel(job.status)}</Badge>
                  </div>
                  <p className={styles.jobCardMeta}>
                    Requested: {formatSourceDate(job.requested_at, "full")}
                  </p>
                  <div className={styles.progressTrack}>
                    <div className={styles.progressBar} style={{ width: `${progress}%` }} />
                  </div>
                  <div className={styles.progressMeta}>
                    <span>
                      Tasks {formatInteger(job.task_processed)} / {formatInteger(job.task_total)}
                    </span>
                    <span>
                      Items {formatInteger(job.item_success)} ok / {formatInteger(job.item_error)} err
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </Surface>

        <div className={styles.detailStack}>
          {!selectedJob ? (
            <Surface padding="md">
              <p className={styles.placeholder}>Sélectionnez un job pour afficher son statut et ses tasks.</p>
            </Surface>
          ) : (
            <>
              <Surface className={styles.detailHeader} padding="md">
                <div className={styles.detailIdentity}>
                  <h2>{jobKindLabel(selectedJob.job_kind)}</h2>
                  <p>{selectedJob.job_id}</p>
                  <p>Worker version: {selectedJob.worker_version ?? "n/a"}</p>
                </div>
                <div className={styles.badgeRow}>
                  <Badge tone={statusTone(selectedJob.status)} uppercase>
                    {jobStatusLabel(selectedJob.status)}
                  </Badge>
                </div>
              </Surface>

              {jobStatusError ? <Notice tone="danger">{jobStatusError}</Notice> : null}
              <Notice tone="info">
                Les vues détaillées feeds, sources et embeddings ont été retirées. Cette page expose
                uniquement l’état du job et la file de tasks encore supportés par l’API.
              </Notice>

              <Surface className={styles.section} padding="md">
                <div className={styles.panelHeader}>
                  <h3>Résumé</h3>
                  <span>{loadingJobStatus ? "Chargement..." : "Synchronisé"}</span>
                </div>
                <div className={styles.kpiGrid}>
                  <article className={styles.kpiCard}>
                    <p className={styles.kpiLabel}>Requested</p>
                    <p className={styles.kpiValue}>{formatSourceDate(selectedJob.requested_at, "full")}</p>
                  </article>
                  <article className={styles.kpiCard}>
                    <p className={styles.kpiLabel}>Started</p>
                    <p className={styles.kpiValue}>{formatSourceDate(selectedJob.started_at, "full")}</p>
                  </article>
                  <article className={styles.kpiCard}>
                    <p className={styles.kpiLabel}>Finished</p>
                    <p className={styles.kpiValue}>{formatSourceDate(selectedJob.finished_at, "full")}</p>
                  </article>
                  <article className={styles.kpiCard}>
                    <p className={styles.kpiLabel}>Tasks</p>
                    <p className={styles.kpiValue}>
                      {formatInteger(selectedJob.task_processed)} / {formatInteger(selectedJob.task_total)}
                    </p>
                  </article>
                  <article className={styles.kpiCard}>
                    <p className={styles.kpiLabel}>Items success</p>
                    <p className={styles.kpiValue}>{formatInteger(selectedJob.item_success)}</p>
                  </article>
                  <article className={styles.kpiCard}>
                    <p className={styles.kpiLabel}>Items error</p>
                    <p className={styles.kpiValue}>{formatInteger(selectedJob.item_error)}</p>
                  </article>
                </div>
              </Surface>

              <Surface className={styles.section} padding="md">
                <div className={styles.panelHeader}>
                  <h3>Tasks</h3>
                  <span>{formatInteger(selectedJob.task_total)} total</span>
                </div>
                <div className={styles.sectionActions}>
                  <span className={styles.sectionMeta}>
                    Fenêtre: <strong>{formatPageWindow(taskPage.offset, taskPage.items.length)}</strong> par lots de{" "}
                    <strong>{formatInteger(JOB_PAGE_SIZE)}</strong>
                  </span>
                  <div className={styles.sectionButtons}>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => void loadTaskPage(selectedJob.job_id, taskPage.offset)}
                      disabled={taskPage.loading}
                    >
                      {taskPage.loading ? "Chargement..." : "Actualiser la tranche"}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        void loadTaskPage(selectedJob.job_id, Math.max(0, taskPage.offset - JOB_PAGE_SIZE))
                      }
                      disabled={taskPage.loading || taskPage.offset === 0}
                    >
                      Précédent
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => void loadTaskPage(selectedJob.job_id, taskPage.offset + JOB_PAGE_SIZE)}
                      disabled={taskPage.loading || !taskPage.hasNext}
                    >
                      Suivant
                    </Button>
                  </div>
                </div>
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
            </>
          )}
        </div>
      </section>
    </PageShell>
  );
}
