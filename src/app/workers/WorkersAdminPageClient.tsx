"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { Badge, Button, Notice, PageHeader, PageShell, Surface } from "@/components";
import { getWorkersOverview } from "@/services/api/workers.service";
import type {
  WorkerInstanceRead,
  WorkerTypeOverviewRead,
  WorkersOverviewRead,
} from "@/types/workers";
import { formatSourceDate } from "@/utils/date";

import styles from "./page.module.css";

const REFRESH_INTERVAL_MS = 15_000;

const WORKER_TYPE_LABELS: Record<WorkerTypeOverviewRead["worker_type"], string> = {
  rss_scrapper: "RSS Scrapper Worker",
  source_embedding: "Source Embedding Worker",
};

function formatInteger(value: number | null): string {
  if (value === null) {
    return "n/a";
  }
  return new Intl.NumberFormat("fr-FR").format(value);
}

function formatIdleDuration(idleMs: number): string {
  if (idleMs < 1000) {
    return `${idleMs} ms`;
  }
  if (idleMs < 60_000) {
    return `${(idleMs / 1000).toFixed(1)} s`;
  }
  return `${(idleMs / 60_000).toFixed(1)} min`;
}

function workerTypeLabel(workerType: WorkerTypeOverviewRead["worker_type"]): string {
  return WORKER_TYPE_LABELS[workerType] ?? workerType;
}

function formatWorkerState(value: string | null): string {
  if (value === null || value.trim().length === 0) {
    return "n/a";
  }
  return value;
}

function formatCurrentTask(worker: WorkerInstanceRead): string {
  if (worker.current_task_label) {
    return worker.current_task_label;
  }
  if (worker.current_task_id !== null) {
    return `Task #${worker.current_task_id}`;
  }
  return "n/a";
}

function formatCurrentFeed(worker: WorkerInstanceRead): string {
  if (worker.current_feed_url) {
    return worker.current_feed_url;
  }
  if (worker.current_feed_id !== null) {
    return `Feed #${worker.current_feed_id}`;
  }
  return "n/a";
}

function formatExecutionId(worker: WorkerInstanceRead): string {
  if (worker.current_execution_id === null) {
    return "n/a";
  }
  return `#${worker.current_execution_id}`;
}

export default function AdminWorkersPage() {
  const [overview, setOverview] = useState<WorkersOverviewRead | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const loadOverview = useCallback(async (silent: boolean) => {
    if (silent) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const payload = await getWorkersOverview();
      setOverview(payload);
    } catch (loadError) {
      const message =
        loadError instanceof Error ? loadError.message : "Unexpected error while loading workers";
      setError(message);
    } finally {
      if (silent) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
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

  const workerItems = overview?.items ?? [];
  const workerInstances = useMemo(
    () => workerItems.flatMap((workerType) => workerType.workers),
    [workerItems],
  );
  const connectedWorkersCount = useMemo(
    () => workerInstances.filter((worker) => worker.connected).length,
    [workerInstances],
  );
  const activeWorkersCount = useMemo(
    () => workerInstances.filter((worker) => worker.active).length,
    [workerInstances],
  );
  const claimedTasksCount = useMemo(
    () => workerInstances.reduce((sum, worker) => sum + worker.processing_tasks, 0),
    [workerInstances],
  );

  return (
    <PageShell size="wide" className={styles.main}>
      <PageHeader
        title="Workers"
        description="Visualisez la présence des workers, leurs claims actifs et la tâche courante remontée par le backend."
      />

      <Surface className={styles.toolbar} padding="sm">
        <div className={styles.meta}>
          <p>Types: {formatInteger(workerItems.length)}</p>
          <p>Instances: {formatInteger(workerInstances.length)}</p>
          <p>Connectés: {formatInteger(connectedWorkersCount)}</p>
          <p>Actifs: {formatInteger(activeWorkersCount)}</p>
          <p>Claims actifs: {formatInteger(claimedTasksCount)}</p>
          <p>Seuil connecté: {formatIdleDuration(overview?.connected_idle_threshold_ms ?? 0)}</p>
          <p>Seuil actif: {formatIdleDuration(overview?.active_idle_threshold_ms ?? 0)}</p>
          <p>
            Dernière mise à jour:{" "}
            <strong>{formatSourceDate(overview?.generated_at ?? null, "full")}</strong>
          </p>
        </div>
        <Button
          variant="secondary"
          onClick={() => void loadOverview(true)}
          disabled={loading || refreshing}
        >
          {refreshing ? "Actualisation..." : "Actualiser"}
        </Button>
      </Surface>

      {error ? <Notice tone="danger">{error}</Notice> : null}

      {loading && overview === null ? (
        <Surface padding="sm">
          <p className={styles.placeholder}>Chargement de l’état des workers...</p>
        </Surface>
      ) : null}

      <section className={styles.workerGrid}>
        {workerItems.map((worker) => (
          <Surface key={worker.worker_type} className={styles.workerCard}>
            <header className={styles.workerHeader}>
              <div className={styles.workerIdentity}>
                <h2>{workerTypeLabel(worker.worker_type)}</h2>
                <p>{worker.queue_name}</p>
              </div>
              <div className={styles.badgeRow}>
                <Badge tone={worker.connected ? "success" : "danger"} uppercase>
                  {worker.connected ? "Connected" : "Disconnected"}
                </Badge>
                <Badge tone={worker.active ? "accent" : "warning"} uppercase>
                  {worker.active ? "Active" : "Idle"}
                </Badge>
              </div>
            </header>

            <section className={styles.kpiGrid}>
              <article className={styles.kpiItem}>
                <p className={styles.kpiLabel}>Instances</p>
                <p className={styles.kpiValue}>{formatInteger(worker.worker_count)}</p>
              </article>
              <article className={styles.kpiItem}>
                <p className={styles.kpiLabel}>Queue length</p>
                <p className={styles.kpiValue}>{formatInteger(worker.queue_length)}</p>
              </article>
              <article className={styles.kpiItem}>
                <p className={styles.kpiLabel}>Queued tasks</p>
                <p className={styles.kpiValue}>{formatInteger(worker.queued_tasks)}</p>
              </article>
              <article className={styles.kpiItem}>
                <p className={styles.kpiLabel}>Claims actifs</p>
                <p className={styles.kpiValue}>{formatInteger(worker.processing_tasks)}</p>
              </article>
            </section>

            <section className={styles.sectionBlock}>
              <h3>Instances</h3>
              {worker.workers.length === 0 ? (
                <p className={styles.placeholder}>Aucun worker observé.</p>
              ) : (
                <div className={styles.tableWrap}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Version</th>
                        <th>Claims</th>
                        <th>Idle</th>
                        <th>Connection</th>
                        <th>Desired state</th>
                        <th>Current task</th>
                        <th>Execution</th>
                        <th>Current feed</th>
                        <th>Last error</th>
                      </tr>
                    </thead>
                    <tbody>
                      {worker.workers.map((workerInstance) => (
                        <tr key={workerInstance.name}>
                          <td>{workerInstance.name}</td>
                          <td>{workerInstance.worker_version ?? "n/a"}</td>
                          <td>{formatInteger(workerInstance.processing_tasks)}</td>
                          <td>{formatIdleDuration(workerInstance.idle_ms)}</td>
                          <td>
                            <div className={styles.stateCell}>
                              <Badge tone={workerInstance.connected ? "success" : "danger"}>
                                {workerInstance.connected ? "connected" : "disconnected"}
                              </Badge>
                              <span>{formatWorkerState(workerInstance.connection_state)}</span>
                            </div>
                          </td>
                          <td>
                            <div className={styles.stateCell}>
                              <Badge tone={workerInstance.active ? "accent" : "warning"}>
                                {workerInstance.active ? "active" : "idle"}
                              </Badge>
                              <span>{formatWorkerState(workerInstance.desired_state)}</span>
                            </div>
                          </td>
                          <td className={styles.detailCell}>{formatCurrentTask(workerInstance)}</td>
                          <td>{formatExecutionId(workerInstance)}</td>
                          <td className={styles.detailCell}>{formatCurrentFeed(workerInstance)}</td>
                          <td className={styles.detailCell}>{workerInstance.last_error ?? "n/a"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </Surface>
        ))}
      </section>
    </PageShell>
  );
}
