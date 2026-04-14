"use client";

import { AppStatusPage } from "@/components";

type ErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function ErrorPage({ reset }: ErrorPageProps) {
  return (
    <AppStatusPage
      statusCode="500"
      title="Application Error"
      message="Something went wrong while rendering this page."
      primaryActionLabel="Retry"
      onPrimaryAction={reset}
      secondaryActionHref="/"
      secondaryActionLabel="Home"
    />
  );
}
