"use client";

import { Notice, Surface } from "@/components";
import type { WorkerDesktopReleaseRead } from "@/types/account";

import styles from "./WorkerInstallerPanel.module.css";

type Props = {
  releases: WorkerDesktopReleaseRead[];
  manifestError: string | null;
};

function normalizeReleaseUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return "#";
  }

  try {
    const parsed = trimmed.startsWith("/")
      ? new URL(trimmed, "http://localhost")
      : new URL(trimmed);
    const normalizedPath = parsed.pathname === "/app/workers" ? "/workers" : parsed.pathname;

    if (normalizedPath === "/workers" || normalizedPath.startsWith("/workers/")) {
      return `${normalizedPath}${parsed.search}${parsed.hash}`;
    }
  } catch {
    return trimmed;
  }

  return trimmed;
}

function formatPublishedAt(publishedAt: string) {
  const date = new Date(publishedAt);
  if (Number.isNaN(date.getTime())) {
    return publishedAt;
  }

  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  const hours = String(date.getUTCHours()).padStart(2, "0");
  const minutes = String(date.getUTCMinutes()).padStart(2, "0");

  return `${year}-${month}-${day} ${hours}:${minutes} UTC`;
}

export function WorkerInstallerPanel({
  releases,
  manifestError,
}: Props) {
  const [featuredRelease, ...otherReleases] = releases;

  return (
    <section className={styles.panel}>
      {manifestError ? <Notice tone="warning">{manifestError}</Notice> : null}

      {featuredRelease ? (
        <div className={styles.grid}>
          <Surface tone="gradient" padding="lg" className={styles.hero}>
            <p className={styles.eyebrow}>{featuredRelease.platform_label}</p>
            <h2 className={styles.title}>{featuredRelease.title}</h2>
            <p className={styles.description}>
              Download the desktop app, then install, update and remove RSS or Embedding directly
              from the desktop interface. Worker bundles keep using backend-provided releases.
            </p>
            <div className={styles.meta}>
              <span>Latest version: {featuredRelease.latest_version}</span>
              <span>
                Published:{" "}
                <time dateTime={featuredRelease.published_at}>
                  {formatPublishedAt(featuredRelease.published_at)}
                </time>
              </span>
            </div>
            <div className={styles.actions}>
              <a
                href={normalizeReleaseUrl(featuredRelease.download_url)}
                target="_blank"
                rel="noreferrer"
                className={styles.primaryLink}
              >
                {featuredRelease.download_label}
              </a>
              <a
                href={normalizeReleaseUrl(featuredRelease.release_notes_url)}
                target="_blank"
                rel="noreferrer"
                className={styles.secondaryLink}
              >
                Release notes
              </a>
            </div>
          </Surface>
        </div>
      ) : null}

      {otherReleases.length > 0 ? (
        <Surface tone="soft" padding="lg">
          <h3 className={styles.cardTitle}>More Desktop Variants</h3>
          <p className={styles.description}>
            Linux ships as a single desktop package. After installing the app, use the desktop
            catalogue to download and manage RSS and Embedding workers independently.
          </p>

          <div className={styles.packageGrid}>
            {otherReleases.map((release) => (
              <Surface
                key={release.artifact_name}
                tone="soft"
                padding="lg"
                className={styles.packageCard}
              >
                <p className={styles.eyebrow}>{release.platform_label}</p>
                <h4 className={styles.cardTitle}>{release.title}</h4>
                <p className={styles.description}>
                  Install one package, launch `manifeed-workers`, then manage RSS and Embedding
                  from the desktop UI.
                </p>
                <div className={styles.actions}>
                  <a
                    href={normalizeReleaseUrl(release.download_url)}
                    target="_blank"
                    rel="noreferrer"
                    className={styles.primaryLink}
                  >
                    {release.download_label}
                  </a>
                  <a
                    href={normalizeReleaseUrl(release.release_notes_url)}
                    target="_blank"
                    rel="noreferrer"
                    className={styles.secondaryLink}
                  >
                    Release notes
                  </a>
                </div>
                {release.install_command ? (
                  <pre className={styles.command}>{release.install_command}</pre>
                ) : null}
                <p className={styles.note}>
                  The desktop app downloads worker bundles itself. RSS and Embedding bundles remain
                  protected and require valid worker API keys inside the desktop app.
                </p>
              </Surface>
            ))}
          </div>
        </Surface>
      ) : null}
    </section>
  );
}
