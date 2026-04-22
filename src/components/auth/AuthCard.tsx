"use client";

import { cn } from "@/lib/utils";

export function AuthCard({
  title,
  subtitle,
  children,
  footer,
  className,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className="flex min-h-full items-center justify-center p-6 sm:p-8 md:p-10">
      <div
        className={cn(
          "w-full max-w-[440px] rounded-2xl border border-border bg-card p-8 shadow-sm",
          className,
        )}
      >
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold tracking-tight text-textPrimary">
            {title}
          </h2>
          {subtitle ? (
            <p className="text-sm text-textSecondary">{subtitle}</p>
          ) : null}
        </div>

        <div className="mt-6">{children}</div>

        {footer ? <div className="mt-6">{footer}</div> : null}
      </div>
    </div>
  );
}

