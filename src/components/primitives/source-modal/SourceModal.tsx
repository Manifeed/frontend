import type { SourceAuthor, SourceModalDetail } from "@/types/sources";
import { formatSourceDate } from "@/utils/date";

import { Notice } from "../../feedback/notice";
import { Button } from "../button";
import { Modal } from "../modal";
import styles from "./SourceModal.module.css";

type SourceModalProps = {
  sourceDetail: SourceModalDetail | null;
  loading: boolean;
  error: string | null;
  onClose: () => void;
  onAuthorSelect?: (author: SourceAuthor) => void;
};

function getCompanyName(companyNames: string[]): string {
  if (companyNames.length === 0)
    return "Unknown company";
  return companyNames.join(", ");
}

function formatCompanyLabel(companyNames: string[]): string {
  const candidate = getCompanyName(companyNames).trim();
  if (candidate.endsWith("."))
    return candidate;
  return `${candidate}.`;
}

export function SourceModal({
  sourceDetail,
  loading,
  error,
  onClose,
  onAuthorSelect,
}: SourceModalProps) {
  const publishedAt = sourceDetail ? formatSourceDate(sourceDetail.published_at, "full") : "n/a";

  return (
    <Modal
      open={Boolean(sourceDetail || loading || error)}
      onClose={onClose}
      ariaLabel="Source detail"
      size="lg"
      className={styles.panel}
      bodyClassName={styles.modalBody}
    >
      {loading || error ? (
        <div className={styles.statePanel}>
          {loading ? <Notice className={styles.emptyText}>Loading source detail...</Notice> : null}
          {error ? <Notice tone="danger">Source detail error: {error}</Notice> : null}
        </div>
      ) : null}

      {!loading && !error && sourceDetail ? (
        <article className={styles.content}>
          {sourceDetail.image_url ? (
            <div className={styles.banner}>
              <img
                src={sourceDetail.image_url}
                alt={sourceDetail.title}
                loading="lazy"
                decoding="async"
              />
            </div>
          ) : null}

          <div className={styles.body}>
            <p className={styles.company}>{formatCompanyLabel(sourceDetail.company_names)}</p>
            <h3>{sourceDetail.title}</h3>
            <p className={styles.summary}>{sourceDetail.summary ?? "No summary available."}</p>

            <section className={styles.sectionBlock}>
              <h4>Authors</h4>
              {sourceDetail.authors.length === 0 ? (
                <p className={styles.emptyText}>Unknown author.</p>
              ) : (
                <div className={styles.authorTags}>
                  {sourceDetail.authors.map((author) => (
                    onAuthorSelect ? (
                      <Button
                        key={author.id}
                        variant="chip"
                        size="sm"
                        className={styles.authorButton}
                        onClick={() => onAuthorSelect(author)}
                      >
                        {author.name}
                      </Button>
                    ) : (
                      <span key={author.id} className={styles.authorTag}>
                        {author.name}
                      </span>
                    )
                  ))}
                </div>
              )}
            </section>

            <section className={styles.sectionBlock}>
              <h4>Feed sections</h4>
              {sourceDetail.feed_sections.length === 0 ? (
                <p className={styles.emptyText}>No section available.</p>
              ) : (
                <div className={styles.sectionTags}>
                  {sourceDetail.feed_sections.map((section) => (
                    <span key={section}>{section}</span>
                  ))}
                </div>
              )}
            </section>

            <footer className={styles.footer}>
              <a href={sourceDetail.url} target="_blank" rel="noreferrer" className={styles.urlLink}>
                Open article
              </a>
              <time className={styles.publishedAt} dateTime={sourceDetail.published_at ?? undefined}>
                {publishedAt}
              </time>
            </footer>
          </div>
        </article>
      ) : null}
    </Modal>
  );
}
