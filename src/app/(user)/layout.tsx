import type { ReactNode } from "react";

import { UserNavbar } from "@/features/navigation/components/UserNavbar";
import { LogoutButton } from "@/features/user/components/LogoutButton";
import { getOptionalSession } from "@/lib/server/backend";

import styles from "./layout.module.css";

type AppLayoutProps = {
  children: ReactNode;
};

function buildUserNavItems(apiAccessEnabled: boolean) {
  return [
    { href: "/profile", label: "Profile" },
    ...(apiAccessEnabled
      ? [
          { href: "/workers", label: "Workers" },
          { href: "/api-keys", label: "API Keys" },
        ]
      : []),
  ];
}

export default async function AppLayout({ children }: AppLayoutProps) {
  const session = await getOptionalSession();
  const apiAccessEnabled = session?.user.api_access_enabled ?? false;

  return (
    <div className={styles.shell}>
      <UserNavbar items={buildUserNavItems(apiAccessEnabled)} />
      {session ? (
        <div className={styles.toolbar}>
          <LogoutButton />
        </div>
      ) : null}
      {children}
    </div>
  );
}
