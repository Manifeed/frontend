import type { ApiErrorPayload } from "@/types/api";

export function getApiPayloadMessage(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const typedPayload = payload as ApiErrorPayload;
  if (typeof typedPayload.message === "string") {
    return typedPayload.message;
  }

  if (typeof typedPayload.detail === "string") {
    return typedPayload.detail;
  }

  return null;
}

export async function parseApiResponsePayload(response: Response): Promise<unknown> {
  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    try {
      return await response.json();
    } catch {
      return null;
    }
  }

  const text = await response.text();
  return text.length > 0 ? { message: text } : null;
}

export function buildJsonRequestHeaders(init?: RequestInit): Headers {
  const headers = new Headers(init?.headers);
  if (init?.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  return headers;
}
