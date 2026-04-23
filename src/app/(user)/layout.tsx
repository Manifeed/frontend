import type { ReactNode } from "react";

import { NavbarUser } from "@/features/navigation/components/NavbarUser";
import { getOptionalSession } from "@/lib/server/backend";

type UserLayoutProps = {
  children: ReactNode;
};

export default async function UserLayout({ children }: UserLayoutProps) {
  const session = await getOptionalSession();

  if (!session) {
    return children;
  }

  return (
    <>
      <NavbarUser user={session.user} />
      {children}
    </>
  );
}
