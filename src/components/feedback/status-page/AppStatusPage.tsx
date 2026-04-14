import Link from "next/link";

import styles from "./StatusPage.module.css";

type AppStatusPageProps = {
  statusCode: string;
  title: string;
  message: string;
  primaryActionHref?: string;
  primaryActionLabel?: string;
  onPrimaryAction?: () => void;
  secondaryActionHref?: string;
  secondaryActionLabel?: string;
};

export function AppStatusPage({
  statusCode,
  title,
  message,
  primaryActionHref = "/",
  primaryActionLabel = "Home",
  onPrimaryAction,
  secondaryActionHref,
  secondaryActionLabel,
}: AppStatusPageProps) {
  return (
    <main className={styles.page}>
      <section className={styles.panel} aria-labelledby="status-page-title">
        <p className={styles.eyebrow}>{statusCode}</p>
        <h1 id="status-page-title" className={styles.title}>
          {title}
        </h1>
        <p className={styles.message}>{message}</p>
        <div className={styles.actions}>
          {onPrimaryAction ? (
            <button type="button" className={styles.primaryAction} onClick={onPrimaryAction}>
              {primaryActionLabel}
            </button>
          ) : (
            <Link href={primaryActionHref} className={styles.primaryAction}>
              {primaryActionLabel}
            </Link>
          )}
          {secondaryActionHref && secondaryActionLabel ? (
            <Link href={secondaryActionHref} className={styles.secondaryAction}>
              {secondaryActionLabel}
            </Link>
          ) : null}
        </div>
      </section>
    </main>
  );
}
