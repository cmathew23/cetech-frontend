"use client";

import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

export function AuthButton({
  className,
  children,
  ...props
}: React.ComponentProps<typeof Button>) {
  return (
    <Button
      variant="primary"
      className={cn("w-full", className)}
      {...props}
    >
      {children}
    </Button>
  );
}

