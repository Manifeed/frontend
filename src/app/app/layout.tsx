import type { ReactNode } from "react";

import { UserNavbar } from "@/features/navigation/components/UserNavbar";
import { LogoutButton } from "@/features/user/components/LogoutButton";
import { requireSession } from "@/lib/server/session-guards";

import styles from "./layout.module.css";

type AppLayoutProps = {
  children: ReactNode;
};

export default async function AppLayout({ children }: AppLayoutProps) {
  await requireSession();

  return (
    <div className={styles.shell}>
      <UserNavbar />
      <div className={styles.toolbar}>
        <LogoutButton />
      </div>
      {children}
    </div>
  );
}
