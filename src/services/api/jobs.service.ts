import { apiRequest } from "@/services/api/client";
import type {
  JobsOverviewRead,
  JobStatusRead,
  JobTaskRead,
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
  return apiRequest<JobsOverviewRead>(`/api/admin/jobs?limit=${encodeURIComponent(String(limit))}`);
}

export async function getJobStatus(jobId: string): Promise<JobStatusRead> {
  return apiRequest<JobStatusRead>(`/api/admin/jobs/${encodeURIComponent(jobId)}`);
}

export async function getJobTasks(jobId: string, options?: PageOptions): Promise<JobTaskRead[]> {
  return apiRequest<JobTaskRead[]>(
    `/api/admin/jobs/${encodeURIComponent(jobId)}/tasks${buildPageQuery(options)}`,
  );
}
