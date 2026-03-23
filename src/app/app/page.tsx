import { PageHeader, PageShell, Surface } from "@/components";
import { requireSession } from "@/lib/server/session-guards";

export default async function UserHomePage() {
  const session = await requireSession();

  return (
    <PageShell>
      <PageHeader
        title="Workspace"
        description="Your personal control surface for profile, worker keys, and owned worker runtime."
      />
      <Surface tone="gradient" padding="lg">
        <h2>{session.user.email}</h2>
        <p>Pseudo: {session.user.pseudo}</p>
        <p>Role: {session.user.role}</p>
        <p>API access: {session.user.api_access_enabled ? "enabled" : "disabled"}</p>
      </Surface>
    </PageShell>
  );
}
