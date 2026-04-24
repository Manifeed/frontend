import { apiRequest } from "@/services/api/client";
import type { AdminStatsRead } from "@/types/admin";
import type { HealthRead } from "@/types/health";

export async function getAdminHealth(): Promise<HealthRead> {
  return apiRequest<HealthRead>("/api/admin/health/");
}

export async function getAdminStats(): Promise<AdminStatsRead> {
  return apiRequest<AdminStatsRead>("/api/admin/stats");
}
