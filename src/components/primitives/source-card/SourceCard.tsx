import { formatSourceDate } from "@/utils/date";
import { safeImageSrc } from "@/utils/public-url";

import styles from "./SourceCard.module.css";

type SourceCardProps = {
  sourceId: number;
  title: string;
  imageUrl: string | null;
  companyNames: string[];
  authors: Array<{ id: number; name: string }>;
  publishedAt: string | null;
  onClick: (sourceId: number) => void;
  className?: string;
};

function getCompanyName(companyNames: string[]): string {
  if (companyNames.length === 0) {
    return "Unknown company";
  }
  return companyNames.join(", ");
}

function joinClassNames(...classes: Array<string | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

export function SourceCard({
  sourceId,
  title,
  imageUrl,
  companyNames,
  authors,
  publishedAt,
  onClick,
  className,
}: SourceCardProps) {
  const displayCompanyName = getCompanyName(companyNames);
  const firstAuthor = authors[0]?.name;
  const publishedDate = formatSourceDate(publishedAt, "relative");
  const bannerUrl = safeImageSrc(imageUrl);
  const hasBanner = bannerUrl !== null;
  const cardClassName = joinClassNames(
    styles.card,
    hasBanner ? styles.cardWithBanner : styles.cardWithoutBanner,
    className,
  );

  return (
    <button type="button" className={cardClassName} onClick={() => onClick(sourceId)}>
      {hasBanner ? (
        <div className={styles.banner}>
          <img src={bannerUrl} alt={title} loading="lazy" decoding="async" />
        </div>
      ) : null}

      <div className={styles.body}>
        <p className={styles.company}>{displayCompanyName}.</p>
        <div className={styles.contentContainer}>
          <h3>{title}</h3>
        </div>
        <div className={styles.publishedAt}>
          <span>{publishedDate}</span>
          {firstAuthor ? <span className={styles.author}>by {firstAuthor}</span> : null}
        </div>
      </div>
    </button>
  );
}
