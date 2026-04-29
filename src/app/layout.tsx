import type { Metadata } from "next";
import type { ReactNode } from "react";
import { headers } from "next/headers";

import "./globals.css";

export const metadata: Metadata = {
  title: "Manifeed",
  description: "RSS feed manager",
};

type RootLayoutProps = {
  children: ReactNode;
};

export default async function RootLayout({ children }: RootLayoutProps) {
  // Force dynamic document rendering so Next can propagate CSP nonces.
  await headers();

  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
      </head>
      <body>{children}</body>
    </html>
  );
}
