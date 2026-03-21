import type { ReactNode } from "react";

import { Button } from "@/components";
import { UserNavbar } from "@/features/navigation/components/UserNavbar";
import { logoutAction } from "@/lib/server/auth-actions";
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
