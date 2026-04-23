"use client";

import { PageShell } from "@/components";
import { HealthStatusCard } from "@/features/health/components/HealthStatusCard";
import { useHealthStatus } from "@/features/health/hooks/useHealthStatus";

export default function AdminPage() {
  const { health, statusText } = useHealthStatus();

  return (
    <PageShell size="wide">
      <section>
        <HealthStatusCard statusText={statusText} health={health} />
      </section>
    </PageShell>
  );
}
