import { useCallback, useEffect, useState } from "react";

import { getAdminHealth, getAdminStats } from "@/services/api/admin-dashboard.service";
import { getJobAutomation, updateJobAutomation } from "@/services/api/jobs.service";
import type { AdminStatsRead } from "@/types/admin";
import type { HealthRead } from "@/types/health";
import type { JobAutomationRead } from "@/types/jobs";

const POLL_INTERVAL_MS = 15_000;

type UseAdminDashboardResult = {
  automation: JobAutomationRead | null;
  health: HealthRead | null;
  loading: boolean;
  error: string | null;
  refreshing: boolean;
  stats: AdminStatsRead | null;
  togglePending: boolean;
  refresh: () => Promise<void>;
  setAutomationEnabled: (nextEnabled: boolean) => Promise<void>;
};

function resolveErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "Unable to load the admin dashboard";
}

export function useAdminDashboard(): UseAdminDashboardResult {
  const [health, setHealth] = useState<HealthRead | null>(null);
  const [stats, setStats] = useState<AdminStatsRead | null>(null);
  const [automation, setAutomation] = useState<JobAutomationRead | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [togglePending, setTogglePending] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const refreshData = useCallback(async (silent: boolean) => {
    if (silent) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const [healthPayload, statsPayload, automationPayload] = await Promise.all([
        getAdminHealth(),
        getAdminStats(),
        getJobAutomation(),
      ]);
      setHealth(healthPayload);
      setStats(statsPayload);
      setAutomation(automationPayload);
      setError(null);
    } catch (refreshError) {
      setError(resolveErrorMessage(refreshError));
    } finally {
      if (silent) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    void refreshData(false);

    const intervalId = window.setInterval(() => {
      void refreshData(true);
    }, POLL_INTERVAL_MS);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [refreshData]);

  const refresh = useCallback(async () => {
    await refreshData(true);
  }, [refreshData]);

  const setAutomationEnabled = useCallback(
    async (nextEnabled: boolean) => {
      setTogglePending(true);
      try {
        const payload = await updateJobAutomation(nextEnabled);
        setAutomation(payload);
        setError(null);
      } catch (toggleError) {
        setError(resolveErrorMessage(toggleError));
      } finally {
        setTogglePending(false);
      }
      await refreshData(true);
    },
    [refreshData],
  );

  return {
    automation,
    health,
    loading,
    error,
    refreshing,
    stats,
    togglePending,
    refresh,
    setAutomationEnabled,
  };
}
