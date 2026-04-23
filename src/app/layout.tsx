import type { Metadata } from "next";
import type { CSSProperties, ReactNode } from "react";

import "./globals.css";

export const metadata: Metadata = {
  title: "Manifeed",
  description: "RSS feed manager",
};

type RootLayoutProps = {
  children: ReactNode;
};

const rootStyle = {
  "--font-body": '"Space Grotesk"',
  "--font-heading": '"Liberation Serif"',
} as CSSProperties;

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" style={rootStyle}>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="stylesheet" href="/fonts/fonts.css" />
        <link
          rel="preload"
          href="/fonts/SpaceGrotesk-VariableFont_wght.ttf"
          as="font"
          type="font/ttf"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="/fonts/LiberationSerif-Bold.ttf"
          as="font"
          type="font/ttf"
          crossOrigin="anonymous"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
