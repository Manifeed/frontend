export type HealthServiceRead = {
  name: string;
  kind: string;
  status: string;
  detail: string | null;
  latency_ms: number | null;
};

export type HealthRead = {
  status: string;
  database: string;
  services: Record<string, HealthServiceRead>;
};
