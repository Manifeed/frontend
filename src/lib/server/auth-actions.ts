"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { backendRequest, SESSION_COOKIE_NAME } from "@/lib/server/backend";
import type { AuthLoginRead } from "@/types/auth";

type AuthFormState = {
  error: string | null;
};

function resolveRedirectTarget(nextValue: string | null, role: "user" | "admin"): string {
  if (nextValue && nextValue.startsWith("/")) {
    return nextValue;
  }
  return role === "admin" ? "/admin" : "/app";
}

export async function loginAction(
  _previousState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const nextPath = String(formData.get("next") ?? "") || null;

  try {
    const payload = await backendRequest<AuthLoginRead>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }, { sessionToken: null });
    cookies().set(SESSION_COOKIE_NAME, payload.session_token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      expires: new Date(payload.expires_at),
    });
    redirect(resolveRedirectTarget(nextPath, payload.user.role));
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Unable to sign in",
    };
  }
}

export async function signupAction(
  _previousState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  try {
    await backendRequest("/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }, { sessionToken: null });
    redirect("/login?registered=1");
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Unable to create account",
    };
  }
}

export async function logoutAction(): Promise<void> {
  const sessionToken = cookies().get(SESSION_COOKIE_NAME)?.value ?? null;
  if (sessionToken) {
    try {
      await backendRequest("/auth/logout", { method: "POST" }, { sessionToken });
    } catch {
      // Best effort logout.
    }
  }
  cookies().delete(SESSION_COOKIE_NAME);
  redirect("/login");
}
