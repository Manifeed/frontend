import { NextResponse } from "next/server";

import { backendRequest, BackendRequestError } from "@/lib/server/backend";
import type { AuthSessionRead } from "@/types/auth";

export async function GET() {
  try {
    const payload = await backendRequest<AuthSessionRead>("/auth/session");
    return NextResponse.json(payload);
  } catch (error) {
    if (error instanceof BackendRequestError) {
      return NextResponse.json(error.payload ?? { detail: error.message }, { status: error.status });
    }
    return NextResponse.json({ detail: "Unable to load session" }, { status: 500 });
  }
}
