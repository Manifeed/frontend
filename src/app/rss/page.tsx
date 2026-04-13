import { PublicRssCatalog } from "@/features/rss/components/PublicRssCatalog";
import { getOptionalSession } from "@/lib/server/backend";

export default async function RssPage() {
  const session = await getOptionalSession();

  return <PublicRssCatalog sessionRole={session?.user.role ?? "public"} />;
}
