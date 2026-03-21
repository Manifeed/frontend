import { redirectLegacyAdminRoute } from "@/lib/server/session-guards";

export default async function LegacySourcesPage() {
  await redirectLegacyAdminRoute("/admin/sources");
}
