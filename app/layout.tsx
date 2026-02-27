
import { AppProvider } from "@/components/Providers";
import LayoutWrapper from "@/components/LayoutWrapper";

import React from "react";
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "POE2 Genie | Path of Exile Build Intelligence",
  description: "Your hideout build strategist for Party, Stash, and Checklist.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-slate-50 text-slate-900 antialiased">
        <AppProvider>
          <LayoutWrapper>
            {children}
          </LayoutWrapper>
        </AppProvider>
      </body>
    </html>
  );
}
