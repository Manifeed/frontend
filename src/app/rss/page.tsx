import { redirectLegacyAdminRoute } from "@/lib/server/session-guards";

export default async function LegacyRssPage() {
  await redirectLegacyAdminRoute("/admin/rss");
}
