import { PageHeader, PageShell, Surface } from "@/components";
import { requireSession } from "@/lib/server/session-guards";

export default async function ProfilePage() {
  const session = await requireSession();

  return (
    <PageShell>
      <PageHeader title="Profile" description="Account role and session-backed identity." />
      <Surface tone="soft" padding="lg">
        <p>Email: {session.user.email}</p>
        <p>Role: {session.user.role}</p>
        <p>Created: {session.user.created_at}</p>
      </Surface>
    </PageShell>
  );
}
