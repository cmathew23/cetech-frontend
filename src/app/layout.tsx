import type { Metadata } from "next";
import { designSystem } from "@/config/design-system";
import { RootShell } from "@/components/layout/RootShell";
import "./globals.css";

export const metadata: Metadata = {
  title: "PEAKFLOW",
  description: "Athlete Management System (AMS)",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className={designSystem.layout.rootBody}>
        <RootShell>{children}</RootShell>
      </body>
    </html>
  );
}
