import { PageHeader, PageShell } from "@/components";
import { AdminUsersPanel } from "@/features/user/components/AdminUsersPanel";

export default function AdminUsersPage() {
  return (
    <PageShell size="wide">
      <PageHeader
        title="Users"
        description="Manage roles, account activity, and API access activation."
      />
      <AdminUsersPanel />
    </PageShell>
  );
}
