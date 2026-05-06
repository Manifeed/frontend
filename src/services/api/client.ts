import { buildLoginHref } from "@/lib/auth/redirects";

import {
  buildJsonRequestHeaders,
  getApiPayloadMessage,
  parseApiResponsePayload,
} from "./response";

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
  const headers = buildJsonRequestHeaders(init);
  const method = init?.method?.toUpperCase() ?? "GET";
  if (method !== "GET" && method !== "HEAD" && !headers.has("X-Requested-With")) {
    headers.set("X-Requested-With", "XMLHttpRequest");
  }

  const response = await fetch(requestUrl, {
    ...init,
    credentials: /^https?:\/\//i.test(requestUrl) ? "include" : "same-origin",
    headers,
  });

  const payload = await parseApiResponsePayload(response);

  if (!response.ok) {
    handleBrowserApiFailure(response.status);
    const message =
      getApiPayloadMessage(payload, response.status) ?? `Request failed with status ${response.status}`;
    throw new ApiRequestError(message, response.status, payload);
  }

  return payload as T;
}
