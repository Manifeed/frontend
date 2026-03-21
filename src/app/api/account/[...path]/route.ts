import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { SESSION_COOKIE_NAME } from "@/lib/server/backend";

function getBackendBaseUrl(): string {
  const value = process.env.BACKEND_INTERNAL_URL?.trim();
  if (!value) {
    throw new Error("Missing BACKEND_INTERNAL_URL");
  }
  return value.replace(/\/+$/, "");
}

async function proxyAccountRequest(request: NextRequest, path: string[]): Promise<NextResponse> {
  const sessionToken = request.cookies.get(SESSION_COOKIE_NAME)?.value ?? null;
  const headers = new Headers();
  if (sessionToken) {
    headers.set("x-manifeed-session", sessionToken);
  }

  const contentType = request.headers.get("content-type");
  if (contentType) {
    headers.set("content-type", contentType);
  }

  const search = request.nextUrl.search;
  const backendResponse = await fetch(`${getBackendBaseUrl()}/account/${path.join("/")}${search}`, {
    method: request.method,
    headers,
    body: request.method === "GET" || request.method === "HEAD" ? undefined : await request.text(),
    cache: "no-store",
  });
  const responseContentType = backendResponse.headers.get("content-type") ?? "";
  if (responseContentType.includes("application/json")) {
    const payload = await backendResponse.json();
    return NextResponse.json(payload, { status: backendResponse.status });
  }

  const text = await backendResponse.text();
  return new NextResponse(text, {
    status: backendResponse.status,
    headers: responseContentType ? { "content-type": responseContentType } : undefined,
  });
}

export async function GET(request: NextRequest, context: { params: { path: string[] } }) {
  return proxyAccountRequest(request, context.params.path);
}

export async function POST(request: NextRequest, context: { params: { path: string[] } }) {
  return proxyAccountRequest(request, context.params.path);
}

export async function PATCH(request: NextRequest, context: { params: { path: string[] } }) {
  return proxyAccountRequest(request, context.params.path);
}

export async function DELETE(request: NextRequest, context: { params: { path: string[] } }) {
  return proxyAccountRequest(request, context.params.path);
}
