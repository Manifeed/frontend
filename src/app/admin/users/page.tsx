import { PageHeader, PageShell } from "@/components";
import { AdminUsersPanel } from "@/features/user/components/AdminUsersPanel";

export default function AdminUsersPage() {
  return (
    <PageShell size="wide">
      <PageHeader
        title="Users"
        description="Filter users by role and status, then manage account activity and API access."
      />
      <AdminUsersPanel />
    </PageShell>
  );
}
