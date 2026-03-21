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

export async function GET(
  request: NextRequest,
  context: { params: { iconUrl: string[] } },
) {
  const sessionToken = request.cookies.get(SESSION_COOKIE_NAME)?.value ?? null;
  const headers = new Headers();
  if (sessionToken) {
    headers.set("x-manifeed-session", sessionToken);
  }

  const backendResponse = await fetch(
    `${getBackendBaseUrl()}/rss/img/${context.params.iconUrl.join("/")}`,
    {
      headers,
      cache: "force-cache",
    },
  );
  const body = await backendResponse.arrayBuffer();
  return new NextResponse(body, {
    status: backendResponse.status,
    headers: {
      "content-type": backendResponse.headers.get("content-type") ?? "image/svg+xml",
      "cache-control": backendResponse.headers.get("cache-control") ?? "public, max-age=3600",
    },
  });
}
