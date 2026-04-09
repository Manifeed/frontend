import Link from "next/link";

import { Notice, PageHeader, PageShell, Surface } from "@/components";
import { WorkerInstallerPanel } from "@/features/user/components/WorkerInstallerPanel";
import { BackendRequestError, backendRequest } from "@/lib/server/backend";
import { requireSession } from "@/lib/server/session-guards";
import type { WorkerDesktopReleaseListRead } from "@/types/account";

export default async function WorkersPage() {
  const session = await requireSession();
  let releases: WorkerDesktopReleaseListRead["items"] = [];
  let manifestError: string | null = null;

  try {
    const payload = await backendRequest<WorkerDesktopReleaseListRead>(
      "/workers/releases/desktop",
      undefined,
      { sessionToken: null },
    );
    releases = payload.items;
  } catch (error) {
    if (error instanceof BackendRequestError) {
      manifestError = error.message;
    } else if (error instanceof Error) {
      manifestError = error.message;
    } else {
      manifestError = "Unable to load desktop releases.";
    }
  }

  return (
    <PageShell size="wide">
      <PageHeader
        title="Workers"
        description="Download the desktop app, then install RSS and Embedding bundles from inside the app with valid worker API keys."
      />
      {!session.user.api_access_enabled ? (
        <Notice tone="warning">
          API access is disabled on your account. Desktop worker connection tests and authenticated
          worker runs will fail until an admin enables worker API access.
        </Notice>
      ) : null}
      <Surface tone="gradient" padding="lg">
        <h2>API keys</h2>
        <p>
          Create one key per worker type from <Link href="/app/api-keys">API Keys</Link>, then use
          those keys inside the desktop app to install RSS and Embedding bundles.
        </p>
      </Surface>
      <WorkerInstallerPanel releases={releases} manifestError={manifestError} />
    </PageShell>
  );
}
