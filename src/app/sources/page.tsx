import { PublicSourcesCatalog } from "@/features/sources/components/PublicSourcesCatalog";
import { getOptionalSession } from "@/lib/server/backend";

export default async function SourcesPage() {
  const session = await getOptionalSession();

  return <PublicSourcesCatalog sessionRole={session?.user.role ?? "public"} />;
}
