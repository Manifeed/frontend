"use client";

import {
  Badge,
  EnabledToggle,
  Notice,
  PageShell,
  Surface,
} from "@/components";
import { useAdminDashboard } from "@/features/admin/hooks/useAdminDashboard";
import { HealthStatusCard } from "@/features/health/components/HealthStatusCard";

import styles from "./page.module.css";

function formatInteger(value: number | null | undefined): string {
  if (value === null || value === undefined) {
    return "n/a";
  }

  return new Intl.NumberFormat("fr-FR").format(value);
}

function formatDateTime(value: string | null): string {
  if (!value) {
    return "Not scheduled";
  }

  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(parsedDate);
}

function resolveAutomationTone(status: string | null | undefined) {
  switch (status) {
    case "disabled":
      return "neutral" as const;
    case "ready":
    case "ready_for_embed":
      return "success" as const;
    case "running_ingest":
    case "running_embed":
      return "accent" as const;
    case "waiting_interval":
    case "waiting_rss_workers":
    case "waiting_embedding_workers":
    case "waiting_ingest_job":
    case "waiting_embedding_job":
      return "warning" as const;
    default:
      return "neutral" as const;
  }
}

export default function AdminPage() {
  const {
    automation,
    health,
    loading,
    error,
    stats,
    togglePending,
    setAutomationEnabled,
  } = useAdminDashboard();

  return (
    <PageShell size="wide">
      <div className={styles.page}>
        {error ? <Notice tone="danger">Dashboard error: {error}</Notice> : null}

        <div className={styles.layout}>
          <div className={styles.mainColumn}>
            <HealthStatusCard health={health} loading={loading} />

            <Surface className={styles.statsCard} padding="lg">
              <header className={styles.sectionHeader}>
                <div>
                  <p className={styles.sectionKicker}>Live Stats</p>
                  <h2>Usage snapshot</h2>
                </div>
              </header>

              <div className={styles.statsGrid}>
                <article className={styles.statBlock}>
                  <span>Connected users</span>
                  <strong>{formatInteger(stats?.connected_users)}</strong>
                </article>
                <article className={styles.statBlock}>
                  <span>Total users</span>
                  <strong>{formatInteger(stats?.total_users)}</strong>
                </article>
                <article className={styles.statBlock}>
                  <span>Connected workers</span>
                  <strong>{formatInteger(stats?.connected_workers)}</strong>
                </article>
                <article className={styles.statBlock}>
                  <span>Total sources</span>
                  <strong>{formatInteger(stats?.total_sources)}</strong>
                </article>
              </div>
            </Surface>
          </div>

          <aside className={styles.sideColumn}>
            <Surface className={styles.automationCard} padding="lg" tone="gradient">
              <header className={styles.automationHeader}>
                <div>
                  <p className={styles.sectionKicker}>Automation</p>
                  <h2>Ingest then embed</h2>
                </div>
                <EnabledToggle
                  enabled={automation?.enabled ?? false}
                  ariaLabel="Toggle automatic ingest and embed"
                  loading={togglePending}
                  onChange={setAutomationEnabled}
                />
              </header>

              <div className={styles.automationMeta}>
                <Badge tone={resolveAutomationTone(automation?.status)}>
                  {automation?.status ?? "unknown"}
                </Badge>
                <p className={styles.automationMessage}>
                  {automation?.message ?? "Automation state unavailable."}
                </p>
              </div>

              <div className={styles.automationGrid}>
                <article className={styles.metaBlock}>
                  <span>Interval</span>
                  <strong>{automation?.interval_minutes ?? 30} min</strong>
                </article>
                <article className={styles.metaBlock}>
                  <span>Next cycle</span>
                  <strong>{formatDateTime(automation?.next_run_at ?? null)}</strong>
                </article>
                <article className={styles.metaBlock}>
                  <span>Last cycle</span>
                  <strong>{formatDateTime(automation?.last_cycle_started_at ?? null)}</strong>
                </article>
              </div>

              <div className={styles.workerGrid}>
                <article className={styles.metaBlock}>
                  <span>Workers online</span>
                  <strong>{formatInteger(automation?.connected_workers)}</strong>
                </article>
                <article className={styles.metaBlock}>
                  <span>RSS workers</span>
                  <strong>{formatInteger(automation?.connected_rss_workers)}</strong>
                </article>
              </div>
            </Surface>
          </aside>
        </div>
      </div>
    </PageShell>
  );
}
