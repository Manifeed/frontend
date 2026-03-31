export type WorkerJobKind = "rss_scrape" | "source_embedding";
export type WorkerJobStatus =
  | "queued"
  | "processing"
  | "finalizing"
  | "completed"
  | "completed_with_errors"
  | "failed";
export type WorkerTaskStatus = "pending" | "processing" | "completed" | "failed";

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

export type JobEnqueueRead = {
  job_id: string;
  job_kind: WorkerJobKind;
  status: WorkerJobStatus;
  worker_version: string | null;
  tasks_total: number;
  items_total: number;
};
