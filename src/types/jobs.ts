export type WorkerJobKind = "rss_scrape" | "source_embedding";
export type WorkerJobStatus =
  | "queued"
  | "processing"
  | "finalizing"
  | "completed"
  | "completed_with_errors"
  | "failed";
export type WorkerTaskStatus = "pending" | "processing" | "completed" | "failed";
export type RssScrapeItemStatus = "pending" | "success" | "not_modified" | "error";
export type EmbeddingItemStatus = "pending" | "success" | "error";

export type JobStatusRead = {
  job_id: string;
  job_kind: WorkerJobKind;
  status: WorkerJobStatus;
  worker_version: string | null;
  requested_at: string;
  started_at: string | null;
  finished_at: string | null;
  task_total: number;
  task_processed: number;
  item_total: number;
  item_success: number;
  item_error: number;
  finalized_at: string | null;
};

export type JobsOverviewRead = {
  generated_at: string;
  items: JobStatusRead[];
};

export type JobTaskRead = {
  task_id: number;
  status: WorkerTaskStatus;
  claimed_at: string | null;
  completed_at: string | null;
  claim_expires_at: string | null;
  item_total: number;
  item_success: number;
  item_error: number;
};

export type RssJobFeedRead = {
  task_id: number;
  feed_id: number;
  feed_url: string;
  status: RssScrapeItemStatus;
  status_code: number | null;
  error_message: string | null;
  fetchprotection_used: number | null;
  resolved_fetchprotection: number | null;
  new_etag: string | null;
  last_feed_update: string | null;
  last_article_published_at: string | null;
};

export type RssJobSourceRead = {
  task_id: number;
  result_feed_id: number;
  feed_id: number;
  feed_url: string;
  published_at: string | null;
  url: string;
  title: string;
  summary: string | null;
  author: string | null;
  image_url: string | null;
};

export type EmbeddingJobResultRead = {
  task_id: number;
  source_id: number;
  item_no: number;
  source_url: string;
  title: string;
  summary: string | null;
  status: EmbeddingItemStatus;
  worker_version: string;
  worker_id: string | null;
  created_at: string | null;
  embedding_dimensions: number | null;
};

export type JobDeleteRead = {
  job_id: string;
  job_kind: WorkerJobKind;
  deleted: boolean;
  deleted_task_count: number;
  deleted_item_count: number;
  deleted_result_count: number;
  cleared_worker_claim_count: number;
};
