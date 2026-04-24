import { buildLoginHref } from "@/lib/auth/redirects";
import type { ApiErrorPayload } from "@/types/api";

export class ApiRequestError extends Error {
  readonly status: number;
  readonly payload: unknown;

  constructor(message: string, status: number, payload: unknown) {
    super(message);
    this.name = "ApiRequestError";
    this.status = status;
    this.payload = payload;
  }
}

function getBrowserCurrentPath(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  const { pathname, search } = window.location;
  return `${pathname}${search}`;
}

function resolveMaskedNotFoundRedirect(status: number): string | null {
  if (typeof window === "undefined" || status !== 404) {
    return null;
  }

  const { pathname } = window.location;
  if (pathname.startsWith("/admin")) {
    return "/admin/__not_found__";
  }
  if (pathname === "/workers" || pathname === "/api-keys") {
    return "/";
  }
  return null;
}

function handleBrowserApiFailure(status: number): void {
  if (typeof window === "undefined") {
    return;
  }

  if (status === 401) {
    window.location.assign(buildLoginHref(getBrowserCurrentPath()));
    return;
  }

  const maskedRedirectTarget = resolveMaskedNotFoundRedirect(status);
  if (maskedRedirectTarget) {
    window.location.assign(maskedRedirectTarget);
  }
}

function getPayloadMessage(payload: unknown): string | null {
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

async function parseResponsePayload(response: Response): Promise<unknown> {
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

function buildRequestHeaders(init?: RequestInit): Headers {
  const headers = new Headers(init?.headers);
  if (init?.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  return headers;
}

function resolveApiRequestUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  const configuredBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();
  if (configuredBaseUrl) {
    return `${configuredBaseUrl.replace(/\/+$/, "")}${path}`;
  }

  return path;
}

export async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const requestUrl = resolveApiRequestUrl(path);
  const response = await fetch(requestUrl, {
    ...init,
    credentials: /^https?:\/\//i.test(requestUrl) ? "include" : "same-origin",
    headers: buildRequestHeaders(init),
  });

  const payload = await parseResponsePayload(response);

  if (!response.ok) {
    handleBrowserApiFailure(response.status);
    const message = getPayloadMessage(payload) ?? `Request failed with status ${response.status}`;
    throw new ApiRequestError(message, response.status, payload);
  }

  return payload as T;
}
