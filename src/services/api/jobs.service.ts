import { apiRequest } from "@/services/api/client";
import type {
  JobAutomationRead,
  JobEnqueueRead,
  JobsOverviewRead,
  JobStatusRead,
  JobTaskRead,
} from "@/types/jobs";

export async function getJobsOverview(limit: number = 200): Promise<JobsOverviewRead> {
  return apiRequest<JobsOverviewRead>(`/api/admin/jobs?limit=${encodeURIComponent(String(limit))}`);
}

export async function getJobStatus(jobId: string): Promise<JobStatusRead> {
  return apiRequest<JobStatusRead>(`/api/admin/jobs/${encodeURIComponent(jobId)}`);
}

export async function getJobTasks(jobId: string): Promise<JobTaskRead[]> {
  return apiRequest<JobTaskRead[]>(`/api/admin/jobs/${encodeURIComponent(jobId)}/tasks`);
}

export async function createRssScrapeJob(feedIds?: number[]): Promise<JobEnqueueRead> {
  return apiRequest<JobEnqueueRead>("/api/admin/jobs/rss-scrape", {
    method: "POST",
    body: JSON.stringify({
      feed_ids: feedIds ?? [],
    }),
  });
}

export async function createSourceEmbeddingJob(
  reembedModelMismatches: boolean = false,
): Promise<JobEnqueueRead> {
  return apiRequest<JobEnqueueRead>("/api/admin/jobs/source-embedding", {
    method: "POST",
    body: JSON.stringify({
      reembed_model_mismatches: reembedModelMismatches,
    }),
  });
}

export async function getJobAutomation(): Promise<JobAutomationRead> {
  return apiRequest<JobAutomationRead>("/api/admin/jobs/automation");
}

export async function updateJobAutomation(enabled: boolean): Promise<JobAutomationRead> {
  return apiRequest<JobAutomationRead>("/api/admin/jobs/automation", {
    method: "PATCH",
    body: JSON.stringify({ enabled }),
  });
}
