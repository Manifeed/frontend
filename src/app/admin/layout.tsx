import type { ReactNode } from "react";

import { AdminNavbar } from "@/features/navigation/components/AdminNavbar";
import { LogoutButton } from "@/features/user/components/LogoutButton";
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
        <LogoutButton />
      </div>
      {children}
    </div>
  );
}
