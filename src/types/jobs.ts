export type WorkerJobKind = "rss_scrape" | "source_embedding";
export type WorkerJobStatus =
  | "queued"
  | "processing"
  | "finalizing"
  | "completed"
  | "completed_with_errors"
  | "failed";
export type WorkerTaskStatus = "pending" | "processing" | "completed" | "failed";

export type JobOverviewItemRead = {
  job_id: string;
  job_kind: WorkerJobKind;
  status: WorkerJobStatus;
  requested_at: string;
  task_total: number;
  task_processed: number;
  item_success: number;
  item_error: number;
};

export type JobsOverviewRead = {
  generated_at: string;
  items: JobOverviewItemRead[];
};

export type JobStatusRead = JobOverviewItemRead & {
  worker_version: string | null;
  started_at: string | null;
  finished_at: string | null;
  item_total: number;
  finalized_at: string | null;
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

export type JobEnqueueRead = {
  job_id: string;
  job_kind: WorkerJobKind;
  status: WorkerJobStatus;
  worker_version: string | null;
  tasks_total: number;
  items_total: number;
};

export type JobAutomationRead = {
  enabled: boolean;
  interval_minutes: number;
  status: string;
  message: string;
  connected_workers: number;
  connected_rss_workers: number;
  connected_embedding_workers: number;
  last_cycle_started_at: string | null;
  next_run_at: string | null;
  current_ingest_job_id: string | null;
  current_ingest_status: string | null;
  current_embed_job_id: string | null;
  current_embed_status: string | null;
};
