"use client";

import { AuthSidePanel } from "@/components/auth/AuthSidePanel";
import { cn } from "@/lib/utils";

export function AuthLayout({
  sidePanelVariant,
  children,
  className,
}: {
  sidePanelVariant: "login" | "register";
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex min-h-screen w-full min-w-0 items-center bg-bg", className)}>
      <div className="mx-auto w-full min-w-0 max-w-6xl px-4 py-10 sm:px-6">
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          <div className="grid min-w-0 grid-cols-1 md:grid-cols-5">
            <div className="h-[210px] min-w-0 overflow-hidden md:col-span-2 md:h-auto md:min-h-[480px]">
              <AuthSidePanel variant={sidePanelVariant} className="h-full" />
            </div>
            <div className="min-w-0 md:col-span-3">{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
