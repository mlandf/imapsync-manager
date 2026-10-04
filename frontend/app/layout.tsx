import type { Metadata } from "next";
import type { ReactNode } from "react";

import { AppHeader } from "@/components/layout/app-header";

import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "imapsync Manager",
  description: "IMAP-Postfächer zwischen Servern synchronisieren",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="de" suppressHydrationWarning>
      <body className="min-h-screen antialiased">
        <Providers>
          <AppHeader />
          <main className="mx-auto w-full max-w-6xl px-4 py-6">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
