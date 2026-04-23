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
