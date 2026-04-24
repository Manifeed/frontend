import { Badge, Surface } from "@/components";
import type { HealthRead } from "@/types/health";

import styles from "./HealthStatusCard.module.css";

type HealthStatusCardProps = {
  health: HealthRead | null;
  loading?: boolean;
};

function resolveTone(status: string | null | undefined) {
  if (!status) {
    return "neutral" as const;
  }

  if (status.toLowerCase() === "ok") {
    return "success" as const;
  }

  if (status.toLowerCase() === "degraded") {
    return "warning" as const;
  }

  return "danger" as const;
}

export function HealthStatusCard({ health, loading = false }: HealthStatusCardProps) {
  const services = Object.entries(health?.services ?? {});
  const onlineServices = services.filter(([, service]) => service.status === "ok").length;
  const badgeTone = resolveTone(health?.status);

  return (
    <Surface className={styles.card} padding="lg">
      <header className={styles.header}>
        <div className={styles.titleBlock}>
          <p className={styles.kicker}>Platform Health</p>
          <h2>Backend dependencies</h2>
        </div>
        <Badge tone={badgeTone} uppercase>
          {health?.status ?? (loading ? "loading" : "unknown")}
        </Badge>
      </header>

      <div className={styles.summaryGrid}>
        <article className={styles.metric}>
          <span>API status</span>
          <strong>{health?.status ?? (loading ? "loading..." : "unknown")}</strong>
        </article>
        <article className={styles.metric}>
          <span>PostgreSQL cluster</span>
          <strong>{health?.database ?? "unknown"}</strong>
        </article>
        <article className={styles.metric}>
          <span>Services online</span>
          <strong>
            {onlineServices}/{services.length || 5}
          </strong>
        </article>
      </div>

      <div className={styles.serviceGrid}>
        {services.map(([serviceKey, service]) => (
          <article key={serviceKey} className={styles.serviceCard}>
            <div className={styles.serviceHeader}>
              <strong>{service.name.replaceAll("_", " ")}</strong>
              <Badge tone={service.status === "ok" ? "success" : "danger"} style="minimal">
                {service.status}
              </Badge>
            </div>
            <p className={styles.serviceLatency}>
              {service.latency_ms !== null ? `${service.latency_ms} ms` : "No latency"}
            </p>
          </article>
        ))}
      </div>
    </Surface>
  );
}
