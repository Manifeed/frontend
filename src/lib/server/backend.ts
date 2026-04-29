import { cookies } from "next/headers";

import {
  buildJsonRequestHeaders,
  getApiPayloadMessage,
  parseApiResponsePayload,
} from "@/services/api/response";
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

export async function getSessionToken(): Promise<string | null> {
  return (await cookies()).get(SESSION_COOKIE_NAME)?.value ?? null;
}

export async function backendRequest<T>(
  path: string,
  init?: RequestInit,
  options?: { sessionToken?: string | null },
): Promise<T> {
  const headers = buildJsonRequestHeaders(init);

  const sessionToken =
    options?.sessionToken === undefined ? await getSessionToken() : options.sessionToken;
  if (sessionToken)
    headers.set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

  const response = await fetch(`${getBackendBaseUrl()}${path}`, {
    ...init,
    headers,
    cache: "no-store",
  });
  const payload = await parseApiResponsePayload(response);

  if (!response.ok) {
    throw new BackendRequestError(
      getApiPayloadMessage(payload) ?? `Backend request failed with status ${response.status}`,
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
