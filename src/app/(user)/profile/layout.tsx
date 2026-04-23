import type { ReactNode } from "react";

import { requireSession } from "@/lib/server/session-guards";

type ProfileLayoutProps = {
  children: ReactNode;
};

export default async function ProfileLayout({ children }: ProfileLayoutProps) {
  await requireSession("/profile");

  return children;
}
