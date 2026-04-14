import { PageHeader, PageShell } from "@/components";
import { UserProfilePanel } from "@/features/user/components/UserProfilePanel";
import { requireSession } from "@/lib/server/session-guards";

export default async function ProfilePage() {
  const session = await requireSession("/profile");

  return (
    <PageShell>
      <PageHeader title="Profile" description="Account role and session-backed identity." />
      <UserProfilePanel user={session.user} />
    </PageShell>
  );
}
