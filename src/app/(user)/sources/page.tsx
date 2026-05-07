import { requireSession } from "@/lib/server/session-guards";

import { SourcesClientPage } from "./SourcesClientPage";

export default async function SourcesPage() {
  await requireSession("/sources");
  return <SourcesClientPage />;
}
