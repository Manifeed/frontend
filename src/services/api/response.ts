import type { ApiErrorPayload } from "@/types/api";

function isHtmlResponse(contentType: string, text: string): boolean {
  const normalizedContentType = contentType.toLowerCase();
  const trimmedText = text.trimStart().toLowerCase();

  return (
    normalizedContentType.includes("text/html") ||
    trimmedText.startsWith("<!doctype html") ||
    trimmedText.startsWith("<html") ||
    /<html[\s>]/i.test(text)
  );
}

function getHtmlErrorMessage(status: number): string {
  switch (status) {
    case 400:
      return "Request rejected. Please check and try again.";
    case 401:
      return "Session expired. Please sign in again.";
    case 403:
      return "Access denied.";
    case 404:
      return "Resource not found.";
    case 408:
      return "Request timed out.";
    case 413:
      return "Request too large.";
    case 429:
      return "Too many requests. Please wait and try again.";
    case 500:
      return "Internal server error.";
    case 502:
      return "Gateway error.";
    case 503:
      return "Service temporarily unavailable. Please try again later.";
    case 504:
      return "Service timeout. Please try again later.";
    default:
      if (status >= 400 && status < 500) {
        return `Request failed (HTTP ${status}).`;
      }
      if (status >= 500) {
        return `Server error (HTTP ${status}).`;
      }
      return `Service error (HTTP ${status}).`;
  }
}

function toDisplayableMessage(message: string, contentType = "", status?: number): string | null {
  const trimmedMessage = message.trim();
  if (!trimmedMessage) {
    return null;
  }

  if (isHtmlResponse(contentType, trimmedMessage)) {
    return typeof status === "number"
      ? getHtmlErrorMessage(status)
      : "Service error.";
  }

  return trimmedMessage;
}

export function getApiPayloadMessage(payload: unknown, status?: number): string | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const typedPayload = payload as ApiErrorPayload;
  if (typeof typedPayload.message === "string") {
    return toDisplayableMessage(typedPayload.message, "", status);
  }

  if (typeof typedPayload.detail === "string") {
    return toDisplayableMessage(typedPayload.detail, "", status);
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
  const message = toDisplayableMessage(text, contentType, response.status);
  return message ? { message } : null;
}

export function buildJsonRequestHeaders(init?: RequestInit): Headers {
  const headers = new Headers(init?.headers);
  if (init?.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  return headers;
}
