import type { Metadata } from "next";
import { designSystem } from "@/config/design-system";
import { RootShell } from "@/components/layout/RootShell";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

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
    <html
      lang="en"
      className={`${inter.variable} h-full antialiased`}
    >
      <body className={designSystem.layout.rootBody}>
        <RootShell>{children}</RootShell>
      </body>
    </html>
  );
}
