import { cookies } from "next/headers";

import type { ApiErrorPayload } from "@/types/api";
import type { AuthSessionRead } from "@/types/auth";

const SESSION_COOKIE_NAME = "manifeed_session";

export class BackendRequestError extends Error {
  readonly status: number;
  readonly payload: unknown;

  constructor(message: string, status: number, payload: unknown) {
    super(message);
    this.name = "BackendRequestError";
    this.status = status;
    this.payload = payload;
  }
}

function getBackendBaseUrl(): string {
  const value = process.env.BACKEND_INTERNAL_URL?.trim();
  if (!value)
    throw new Error("Missing BACKEND_INTERNAL_URL");
  return value.replace(/\/+$/, "");
}

function getPayloadMessage(payload: unknown): string | null {
  if (!payload || typeof payload !== "object")
    return null;

  const typedPayload = payload as ApiErrorPayload;
  if (typeof typedPayload.message === "string")
    return typedPayload.message;
  if (typeof typedPayload.detail === "string")
    return typedPayload.detail;
  return null;
}

async function parsePayload(response: Response): Promise<unknown> {
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

export async function getSessionToken(): Promise<string | null> {
  return cookies().get(SESSION_COOKIE_NAME)?.value ?? null;
}

export async function backendRequest<T>(
  path: string,
  init?: RequestInit,
  options?: { sessionToken?: string | null },
): Promise<T> {
  const headers = new Headers(init?.headers);
  if (init?.body && !headers.has("Content-Type"))
    headers.set("Content-Type", "application/json");

  const sessionToken =
    options?.sessionToken === undefined ? await getSessionToken() : options.sessionToken;
  if (sessionToken)
    headers.set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

  const response = await fetch(`${getBackendBaseUrl()}${path}`, {
    ...init,
    headers,
    cache: "no-store",
  });
  const payload = await parsePayload(response);

  if (!response.ok) {
    throw new BackendRequestError(
      getPayloadMessage(payload) ?? `Backend request failed with status ${response.status}`,
      response.status,
      payload,
    );
  }

  return payload as T;
}

export async function getOptionalSession(): Promise<AuthSessionRead | null> {
  const sessionToken = await getSessionToken();
  if (!sessionToken)
    return null;

  try {
    return await backendRequest<AuthSessionRead>("/api/auth/session", undefined, {
      sessionToken,
    });
  } catch (error) {
    if (
      error instanceof BackendRequestError &&
      (error.status === 401 || error.status === 403 || error.status === 404)
    )
      return null;
    throw error;
  }
}
