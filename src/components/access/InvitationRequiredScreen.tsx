"use client";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Heading } from "@/components/ui/Heading";
import { designSystem } from "@/config/design-system";

export function InvitationRequiredScreen({
  onConfirm,
  busy = false,
}: {
  onConfirm: () => void | Promise<void>;
  busy?: boolean;
}) {
  return (
    <div className="flex min-h-screen w-full items-center justify-center px-4 py-10">
      <Card className="w-full max-w-md text-center shadow-md">
        <div className={`${designSystem.spacing.section} flex flex-col items-center`}>
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primaryLight text-primaryDark">
            <span className="text-xl font-semibold" aria-hidden="true">
              !
            </span>
          </div>
          <div className={designSystem.spacing.dense}>
            <Heading variant="h2" className="mb-0">
              Invitation Required
            </Heading>
            <p className={designSystem.typography.body}>
              You need to have an invitation to access.
            </p>
          </div>
          <div className="flex w-full justify-center pt-2">
            <Button
              type="button"
              variant="primary"
              className="min-w-28"
              loading={busy}
              disabled={busy}
              onClick={() => void onConfirm()}
            >
              OK
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
