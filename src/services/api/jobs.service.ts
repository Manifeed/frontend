import { apiRequest } from "@/services/api/client";
import type {
  EmbeddingJobResultRead,
  JobDeleteRead,
  JobsOverviewRead,
  JobStatusRead,
  JobTaskRead,
  RssJobFeedRead,
  RssJobSourceRead,
} from "@/types/jobs";

type PageOptions = {
  limit?: number;
  offset?: number;
};

function buildPageQuery(options?: PageOptions): string {
  const params = new URLSearchParams();
  if (typeof options?.limit === "number") {
    params.set("limit", String(options.limit));
  }
  if (typeof options?.offset === "number") {
    params.set("offset", String(options.offset));
  }
  const query = params.toString();
  return query.length > 0 ? `?${query}` : "";
}

export async function getJobsOverview(limit: number = 200): Promise<JobsOverviewRead> {
  return apiRequest<JobsOverviewRead>(`/jobs?limit=${encodeURIComponent(String(limit))}`);
}

export async function getJobStatus(jobId: string): Promise<JobStatusRead> {
  return apiRequest<JobStatusRead>(`/jobs/${encodeURIComponent(jobId)}`);
}

export async function getJobTasks(jobId: string, options?: PageOptions): Promise<JobTaskRead[]> {
  return apiRequest<JobTaskRead[]>(
    `/jobs/${encodeURIComponent(jobId)}/tasks${buildPageQuery(options)}`,
  );
}

export async function getJobFeeds(jobId: string, options?: PageOptions): Promise<RssJobFeedRead[]> {
  return apiRequest<RssJobFeedRead[]>(
    `/jobs/${encodeURIComponent(jobId)}/feeds${buildPageQuery(options)}`,
  );
}

export async function getJobSources(jobId: string, options?: PageOptions): Promise<RssJobSourceRead[]> {
  return apiRequest<RssJobSourceRead[]>(
    `/jobs/${encodeURIComponent(jobId)}/sources${buildPageQuery(options)}`,
  );
}

export async function getJobEmbeddings(
  jobId: string,
  options?: PageOptions,
): Promise<EmbeddingJobResultRead[]> {
  return apiRequest<EmbeddingJobResultRead[]>(
    `/jobs/${encodeURIComponent(jobId)}/embeddings${buildPageQuery(options)}`,
  );
}

export async function deleteJob(jobId: string): Promise<JobDeleteRead> {
  return apiRequest<JobDeleteRead>(`/jobs/${encodeURIComponent(jobId)}`, {
    method: "DELETE",
  });
}
