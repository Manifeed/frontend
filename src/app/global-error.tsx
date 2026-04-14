"use client";

import { AppStatusPage } from "@/components";

type GlobalErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function GlobalErrorPage({ reset }: GlobalErrorPageProps) {
  return (
    <html lang="en">
      <body>
        <AppStatusPage
          statusCode="500"
          title="Critical Error"
          message="The application hit an unrecoverable error while loading."
          primaryActionLabel="Retry"
          onPrimaryAction={reset}
          secondaryActionHref="/"
          secondaryActionLabel="Home"
        />
      </body>
    </html>
  );
}
