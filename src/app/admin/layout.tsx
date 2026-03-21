import type { ReactNode } from "react";

import { Button } from "@/components";
import { AdminNavbar } from "@/features/navigation/components/AdminNavbar";
import { logoutAction } from "@/lib/server/auth-actions";
import { requireAdminSession } from "@/lib/server/session-guards";

import styles from "./layout.module.css";

type AdminLayoutProps = {
  children: ReactNode;
};

export default async function AdminLayout({ children }: AdminLayoutProps) {
  await requireAdminSession();

  return (
    <div className={styles.shell}>
      <AdminNavbar />
      <div className={styles.toolbar}>
        <form action={logoutAction}>
          <Button variant="ghost" size="sm" type="submit">
            Sign out
          </Button>
        </form>
      </div>
      {children}
    </div>
  );
}
