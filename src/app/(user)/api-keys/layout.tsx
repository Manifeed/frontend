import type { ReactNode } from "react";

import { requireApiEnabledSession } from "@/lib/server/session-guards";

type ApiKeysLayoutProps = {
  children: ReactNode;
};

export default async function ApiKeysLayout({ children }: ApiKeysLayoutProps) {
  await requireApiEnabledSession("/api-keys");

  return children;
}
