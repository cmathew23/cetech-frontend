"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";

type Variant = "login" | "register";

function AuthHeroPanel() {
  return (
    <div className="relative h-full w-full bg-black">
      <Image
        src="/branding/peakflow-signin-hero.png"
        alt="PEAKFLOW — Plan Better. Coach Better. Perform Better."
        fill
        priority
        className="object-contain"
        sizes="(min-width: 768px) 40vw, 0px"
      />
    </div>
  );
}

export function AuthSidePanel({
  variant: _variant,
  className,
}: {
  variant: Variant;
  className?: string;
}) {
  return (
    <aside
      className={cn("flex h-full flex-col bg-black text-white", className)}
    >
      <AuthHeroPanel />
    </aside>
  );
}

