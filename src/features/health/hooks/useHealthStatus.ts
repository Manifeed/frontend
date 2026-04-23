import { useCallback, useEffect, useState } from "react";

import { ApiRequestError, apiRequest } from "@/services/api/client";
import type { HealthRead } from "@/types/health";

type UseHealthStatusResult = {
  health: HealthRead | null;
  statusText: string;
};

const DEFAULT_STATUS = "loading...";

function resolveErrorStatus(error: unknown): string {
  if (error instanceof ApiRequestError) {
    return `unreachable (${error.status})`;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "unreachable";
}

export function useHealthStatus(): UseHealthStatusResult {
  const [health, setHealth] = useState<HealthRead | null>(null);
  const [statusText, setStatusText] = useState<string>(DEFAULT_STATUS);

  const refresh = useCallback(async () => {
    try {
      const payload = await apiRequest<HealthRead>("/api/admin/health/");
      setHealth(payload);
      setStatusText(payload.status);
    } catch (error) {
      setStatusText(resolveErrorStatus(error));
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    health,
    statusText,
  };
}
