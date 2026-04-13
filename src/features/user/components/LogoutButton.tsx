"use client";

import { useState } from "react";

import { Button } from "@/components";


type LogoutButtonProps = {
  redirectTo?: string;
};


export function LogoutButton({ redirectTo = "/login" }: LogoutButtonProps) {
  const [pending, setPending] = useState(false);

  async function handleLogout() {
    setPending(true);
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "same-origin",
      });
    } finally {
      window.location.assign(redirectTo);
    }
  }

  return (
    <Button variant="ghost" size="sm" type="button" disabled={pending} onClick={handleLogout}>
      {pending ? "Signing out..." : "Sign out"}
    </Button>
  );
}
