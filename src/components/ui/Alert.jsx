"use client";

import { CircleAlert, CircleCheck, Info, TriangleAlert, X } from "lucide-react";
import { useState } from "react";

import { designSystem } from "@/config/design-system";
import { cn } from "@/lib/utils";

const ALERT_ICONS = {
  success: CircleCheck,
  warning: TriangleAlert,
  danger: CircleAlert,
  info: Info,
};

export function Alert({
  variant = "success",
  className = "",
  children,
  dismissible = false,
  ...props
}) {
  const v = variant ?? "success";
  const styles = {
    success: designSystem.alert.success,
    warning: designSystem.alert.warning,
    danger: designSystem.alert.danger,
    info: designSystem.alert.info,
  };

  if (!styles[v]) {
    throw new Error(`Invalid Alert variant: ${variant}`);
  }

  const [dismissed, setDismissed] = useState(false);
  const [contentStamp, setContentStamp] = useState(children);
  const [variantStamp, setVariantStamp] = useState(v);

  if (children !== contentStamp || v !== variantStamp) {
    setContentStamp(children);
    setVariantStamp(v);
    setDismissed(false);
  }

  if (dismissed) {
    return null;
  }

  const Icon = ALERT_ICONS[v];

  return (
    <div
      className={cn(designSystem.alert.base, styles[v], className)}
      role="alert"
      {...props}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <div className="min-w-0 flex-1">{children}</div>
      {dismissible ? (
        <button
          type="button"
          className="-mr-0.5 mt-0.5 shrink-0 rounded p-0.5 text-current/70 transition hover:bg-black/5 hover:text-current focus:outline-none focus-visible:ring-2 focus-visible:ring-current/30"
          aria-label="Dismiss"
          onClick={() => setDismissed(true)}
        >
          <X className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      ) : null}
    </div>
  );
}
