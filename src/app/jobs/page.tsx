import { redirectLegacyAdminRoute } from "@/lib/server/session-guards";

export default async function LegacyJobsPage() {
  await redirectLegacyAdminRoute("/admin/jobs");
}
