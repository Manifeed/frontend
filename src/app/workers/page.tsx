import { redirectLegacyAdminRoute } from "@/lib/server/session-guards";

export default async function LegacyWorkersPage() {
  await redirectLegacyAdminRoute("/admin/workers");
}
