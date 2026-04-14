import { PageHeader, PageShell } from "@/components";
import { UserApiKeysPanel } from "@/features/user/components/UserApiKeysPanel";
import { requireApiEnabledSession } from "@/lib/server/session-guards";

export default async function ApiKeysPage() {
  await requireApiEnabledSession("/api-keys");

  return (
    <PageShell>
      <PageHeader
        title="API Keys"
        description="Create one key per worker installation and keep them scoped to a single worker type."
      />
      <UserApiKeysPanel />
    </PageShell>
  );
}
