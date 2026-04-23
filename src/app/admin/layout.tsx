import type { ReactNode } from "react";

import { NavbarAdmin } from "@/features/navigation/components/NavbarAdmin";
import { requireAdminSession } from "@/lib/server/session-guards";

type AdminLayoutProps = {
  children: ReactNode;
};

export default async function AdminLayout({ children }: AdminLayoutProps) {
  const session = await requireAdminSession();

  return (
    <>
      <NavbarAdmin user={session.user} />
      {children}
    </>
  );
}
