"use client";

import { useEffect, useMemo, useState } from "react";

import { Notice, PageHeader, PageShell } from "@/components";
import { SourceCard } from "@/components/primitives/source-card/SourceCard";
import { listRssSources } from "@/services/api/sources.service";
import type { UserRole } from "@/types/auth";
import type { RssSourcePageRead } from "@/types/sources";


type PublicSourcesCatalogProps = {
  sessionRole: UserRole | "public";
};


function resolvePageLimit(sessionRole: UserRole | "public"): number {
  if (sessionRole === "admin") {
    return 1000;
  }
  if (sessionRole === "user") {
    return 100;
  }
  return 10;
}


function resolveDescription(sessionRole: UserRole | "public"): string {
  if (sessionRole === "admin") {
    return "Admin sessions can inspect a much larger slice of the consolidated sources feed.";
  }
  if (sessionRole === "user") {
    return "Signed-in users get a broader catalog while keeping the same public schema.";
  }
  return "Public access stays available with a smaller slice of the source catalog and a stricter quota.";
}


export function PublicSourcesCatalog({ sessionRole }: PublicSourcesCatalogProps) {
  const [payload, setPayload] = useState<RssSourcePageRead | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(true);

  const limit = useMemo(() => resolvePageLimit(sessionRole), [sessionRole]);

  useEffect(() => {
    let cancelled = false;

    async function loadSources() {
      setPending(true);
      setError(null);
      try {
        const nextPayload = await listRssSources({ limit, offset: 0 });
        if (!cancelled) {
          setPayload(nextPayload);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "Unable to load sources");
        }
      } finally {
        if (!cancelled) {
          setPending(false);
        }
      }
    }

    void loadSources();
    return () => {
      cancelled = true;
    };
  }, [limit]);

  return (
    <PageShell size="wide">
      <PageHeader
        title="Sources"
        description={resolveDescription(sessionRole)}
        sideContent={<strong>{limit}</strong>}
      />

      {error ? <Notice tone="danger">{error}</Notice> : null}
      {pending ? <Notice tone="info">Loading sources...</Notice> : null}
      {!pending && payload && payload.items.length === 0 ? (
        <Notice tone="info">No sources are available yet.</Notice>
      ) : null}

      <div
        style={{
          display: "grid",
          gap: "1rem",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          marginTop: "1rem",
        }}
      >
        {payload?.items.map((source) => (
          <SourceCard
            key={source.id}
            sourceId={source.id}
            title={source.title}
            summary={source.summary}
            imageUrl={source.image_url}
            companyNames={source.company_names}
            publishedAt={source.published_at}
            onClick={() => window.open(source.url, "_blank", "noopener,noreferrer")}
          />
        ))}
      </div>
    </PageShell>
  );
}
