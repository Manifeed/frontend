import Link from "next/link";

import { Surface } from "@/components";
import { redirectIfAuthenticated } from "@/lib/server/session-guards";

import styles from "./landing.module.css";

export default async function LandingPage() {
  await redirectIfAuthenticated();

  return (
    <main className={styles.hero}>
      <div className={styles.frame}>
        <section className={styles.content}>
          <div>
            <p className={styles.eyebrow}>Manifeed control surface</p>
            <h1 className={styles.title}>Run feeds, jobs, users, and workers from one secured hub.</h1>
          </div>

          <p className={styles.lead}>
            The web app now routes sensitive traffic through the Next.js server, keeps sessions in
            HTTP-only cookies, and separates public access, user workspaces, and the admin control
            room.
          </p>

          <div className={styles.actions}>
            <Link href="/login">Sign in</Link>
            <Link href="/signup">Create account</Link>
          </div>

          <div className={styles.stats}>
            <Surface tone="soft" padding="md">
              <p className={styles.statValue}>BFF</p>
              <p className={styles.statLabel}>No direct browser to backend calls.</p>
            </Surface>
            <Surface tone="soft" padding="md">
              <p className={styles.statValue}>Roles</p>
              <p className={styles.statLabel}>Public, user, and admin routes split cleanly.</p>
            </Surface>
            <Surface tone="soft" padding="md">
              <p className={styles.statValue}>Keys</p>
              <p className={styles.statLabel}>Workers authenticate with user-owned API keys.</p>
            </Surface>
          </div>
        </section>

        <Surface className={styles.sideCard} tone="gradient" padding="lg">
          <h2>What changed</h2>
          <p className={styles.sideCopy}>
            Public signup creates a standard account. Admins can activate API access and manage
            operator privileges from the admin area.
          </p>
          <div className={styles.sideList}>
            <div className={styles.sideItem}>
              <strong>Users</strong>
              Profile, password, API keys, and personal worker visibility.
            </div>
            <div className={styles.sideItem}>
              <strong>Admins</strong>
              RSS, sources, jobs, worker monitoring, and user governance.
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
