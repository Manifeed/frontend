import { PageHeader, PageShell } from "@/components";
import { requireSession } from "@/lib/server/session-guards";
import { UserApiKeysPanel } from "@/features/user/components/UserApiKeysPanel";

export default async function ApiKeysPage() {
  const session = await requireSession();

  return (
    <PageShell>
      <PageHeader
        title="API Keys"
        description="Create one key per worker installation and keep them scoped to a single worker type."
      />
      <UserApiKeysPanel apiAccessEnabled={session.user.api_access_enabled} />
    </PageShell>
  );
}
