import { PageHeader, PageShell } from "@/components";
import { UserWorkersPanel } from "@/features/user/components/UserWorkersPanel";

export default function UserWorkersPage() {
  return (
    <PageShell>
      <PageHeader
        title="My Workers"
        description="Visibility limited to runtimes attached to your own API keys."
      />
      <UserWorkersPanel />
    </PageShell>
  );
}
