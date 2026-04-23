import Link from "next/link";

import { Surface } from "@/components";

import styles from "./LandingPage.module.css";

export default function LandingPage() {
  return (
    <main className={styles.hero}>
      <div className={styles.frame}>
        <section className={styles.content}>
          <div>
            <p className={styles.eyebrow}>Manifeed control surface</p>
            <h1 className={styles.title}>Run feeds, jobs, users, and workers from one secured hub.</h1>
          </div>

          <p className={styles.lead}>
            The edge now routes browser pages, web APIs, and worker APIs cleanly, while FastAPI
            stays the source of truth for application auth and error payloads.
          </p>

          <div className={styles.actions}>
            <Link href="/login">Sign in</Link>
            <Link href="/signup">Create account</Link>
          </div>

          <div className={styles.stats}>
            <Surface tone="soft" padding="md">
              <p className={styles.statValue}>Edge</p>
              <p className={styles.statLabel}>Thin reverse proxy with custom edge-only errors.</p>
            </Surface>
            <Surface tone="soft" padding="md">
              <p className={styles.statValue}>Roles</p>
              <p className={styles.statLabel}>Public, user, API-enabled, and admin access split cleanly.</p>
            </Surface>
            <Surface tone="soft" padding="md">
              <p className={styles.statValue}>Keys</p>
              <p className={styles.statLabel}>Workers authenticate through dedicated /workers/api routes.</p>
            </Surface>
          </div>
        </section>

        <Surface className={styles.sideCard} tone="gradient" padding="lg">
          <h2>What changed</h2>
          <p className={styles.sideCopy}>
            Public signup creates a standard account. Admins can activate API access and manage
            account activity from the admin area.
          </p>
          <div className={styles.sideList}>
            <div className={styles.sideItem}>
              <strong>Users</strong>
              Profile, password, API keys, and personal worker visibility.
            </div>
            <div className={styles.sideItem}>
              <strong>Admins</strong>
              RSS, sources, jobs, worker monitoring, and user oversight.
            </div>
            <div className={styles.sideItem}>
              <strong>Workers</strong>
              API-key auth only, simpler runtime ownership, cleaner backend joins.
            </div>
          </div>
        </Surface>
      </div>
    </main>
  );
}
