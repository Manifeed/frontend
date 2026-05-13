import { headers } from "next/headers";

import { PageShell, Surface } from "@/components";
import { requireApiEnabledSession } from "@/lib/server/session-guards";

import { CopyableCommand } from "./CopyableCommand";
import styles from "./page.module.css";

const GITHUB_REPO_URL = "https://github.com/Manifeed/workers";
const GITHUB_RELEASES_URL = `${GITHUB_REPO_URL}/releases`;
const GITHUB_LATEST_API_URL = "https://api.github.com/repos/Manifeed/workers/releases/latest";

type LatestRelease = {
  tag: string;
  url: string;
  publishedAt: string;
};

async function fetchLatestRelease(): Promise<LatestRelease | null> {
  try {
    const response = await fetch(GITHUB_LATEST_API_URL, {
      headers: { "User-Agent": "manifeed-frontend", Accept: "application/vnd.github+json" },
      next: { revalidate: 3600 },
    });
    if (!response.ok) return null;
    const data = (await response.json()) as {
      tag_name?: string;
      html_url?: string;
      published_at?: string;
    };
    if (!data.tag_name || !data.published_at) return null;
    return {
      tag: data.tag_name,
      url: data.html_url ?? GITHUB_RELEASES_URL,
      publishedAt: data.published_at,
    };
  } catch {
    return null;
  }
}

async function resolveInstallUrl(): Promise<string> {
  const headerStore = await headers();
  const host = headerStore.get("x-forwarded-host") ?? headerStore.get("host") ?? "app.example";
  const proto = headerStore.get("x-forwarded-proto") ?? "https";
  return `${proto}://${host}/install/`;
}

function formatReleaseDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default async function WorkersPage() {
  await requireApiEnabledSession("/workers");

  const [release, installUrl] = await Promise.all([fetchLatestRelease(), resolveInstallUrl()]);

  const installCommand = `curl -fsSL ${installUrl} | sh`;
  const configureCommand = `crawler_rss set --api-key "mk_..." --concurrency 10`;
  const runCommand = `crawler_rss`;
  const updateCommand = `crawler_rss update`;

  return (
    <PageShell size="wide">
      <section className={styles.panel}>
        <Surface tone="gradient" padding="lg" className={styles.hero}>
          <p className={styles.eyebrow}>crawler_rss</p>
          <h2 className={styles.title}>Run an RSS worker in 4 steps.</h2>
          <p className={styles.tagline}>Built in Rust. Updates itself. Verifies every release.</p>
          <div className={styles.metaRow}>
            <a className={styles.githubLink} href={GITHUB_REPO_URL} target="_blank" rel="noreferrer">
              <GithubIcon />
              <span>github.com/Manifeed/workers</span>
            </a>
            {release ? (
              <a
                className={styles.releaseBadge}
                href={release.url}
                target="_blank"
                rel="noreferrer"
                title={`Released ${formatReleaseDate(release.publishedAt)}`}
              >
                <span className={styles.releaseTag}>{release.tag}</span>
                <span className={styles.releaseDate}>{formatReleaseDate(release.publishedAt)}</span>
              </a>
            ) : (
              <span className={styles.releaseBadge} aria-label="Latest release unavailable">
                <span className={styles.releaseTag}>latest</span>
                <span className={styles.releaseDate}>—</span>
              </span>
            )}
          </div>
        </Surface>

        <Surface tone="soft" padding="lg" className={styles.steps}>
          <Step index={1} title="Install" caption="One line. Linux, macOS, Windows, Raspberry Pi.">
            <CopyableCommand command={installCommand} />
          </Step>

          <Step index={2} title="Configure" caption="Plug in your worker API key.">
            <CopyableCommand command={configureCommand} />
          </Step>

          <Step index={3} title="Run" caption="Boot the worker and start claiming tasks.">
            <CopyableCommand command={runCommand} />
          </Step>

          <Step index={4} title="Update" caption="Pull the latest signed release.">
            <CopyableCommand command={updateCommand} />
          </Step>
        </Surface>
      </section>
    </PageShell>
  );
}

type StepProps = {
  index: number;
  title: string;
  caption: string;
  children: React.ReactNode;
};

function Step({ index, title, caption, children }: StepProps) {
  return (
    <article className={styles.step}>
      <header className={styles.stepHeader}>
        <span className={styles.stepIndex} aria-hidden>
          {index}
        </span>
        <div className={styles.stepText}>
          <h3 className={styles.stepTitle}>{title}</h3>
          <p className={styles.stepCaption}>{caption}</p>
        </div>
      </header>
      {children}
    </article>
  );
}

function GithubIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.1.79-.25.79-.56v-2.18c-3.2.7-3.88-1.37-3.88-1.37-.52-1.33-1.27-1.69-1.27-1.69-1.04-.71.08-.69.08-.69 1.15.08 1.76 1.18 1.76 1.18 1.02 1.75 2.68 1.24 3.34.95.1-.74.4-1.24.72-1.53-2.55-.29-5.24-1.28-5.24-5.7 0-1.26.45-2.29 1.18-3.1-.12-.29-.51-1.46.11-3.04 0 0 .97-.31 3.18 1.18a11.04 11.04 0 0 1 5.8 0c2.21-1.49 3.18-1.18 3.18-1.18.62 1.58.23 2.75.12 3.04.74.81 1.18 1.84 1.18 3.1 0 4.43-2.7 5.4-5.27 5.69.41.35.78 1.04.78 2.1v3.11c0 .31.21.67.8.55C20.21 21.39 23.5 17.08 23.5 12 23.5 5.65 18.35.5 12 .5z" />
    </svg>
  );
}
