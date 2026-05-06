"use client";

import { designSystem } from "@/config/design-system";
import { cn } from "@/lib/utils";
import { useEffect } from "react";
import { createPortal } from "react-dom";

export function Modal({ children, className = "", ...rest }) {
  useEffect(() => {
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, []);

  const content = (
    <div
      className={cn(designSystem.modal.backdrop)}
      role="presentation"
    >
      <div
        className={cn(designSystem.modal.panel, className)}
        role="dialog"
        aria-modal="true"
        {...rest}
      >
        {children}
      </div>
    </div>
  );

  if (typeof document === "undefined") return content;

  return createPortal(content, document.body);
}
