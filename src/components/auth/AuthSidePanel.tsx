"use client";

import { designSystem } from "@/config/design-system";
import { cn } from "@/lib/utils";

type Variant = "login" | "register";

const CONTENT: Record<
  Variant,
  { heading: string; bullets: [string, string, string] }
> = {
  login: {
    heading: "Performance Elevated",
    bullets: [
      "Track training loads",
      "Monitor athlete progress",
      "Analyze performance insights",
    ],
  },
  register: {
    heading: "Create your account",
    bullets: [
      "Centralized athlete data",
      "Assign training programs",
      "Streamline communication",
    ],
  },
};

export function AuthSidePanel({
  variant,
  className,
}: {
  variant: Variant;
  className?: string;
}) {
  const content = CONTENT[variant];

  return (
    <aside
      className={cn(
        "flex h-full flex-col justify-between bg-gradient-to-br from-sidebar to-sidebar/80 px-10 py-12 text-white",
        className,
      )}
    >
      <div className={designSystem.spacing.section}>
        <div className="text-sm font-semibold tracking-wide text-white/90">
          PEAKFLOW
        </div>
        <h1 className="text-3xl font-semibold tracking-tight text-white">
          {content.heading}
        </h1>
        <ul className="mt-6 space-y-3 text-sm text-white/85">
          {content.bullets.map((item) => (
            <li key={item} className="flex gap-3">
              <span className="mt-1 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-primaryLight" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="text-xs text-white/70">
        {designSystem.name} • Training, onboarding, and invitations in one place
      </div>
    </aside>
  );
}

