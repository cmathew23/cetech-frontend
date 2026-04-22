"use client";

import { Button } from "@/components/ui/Button";
import { Heading } from "@/components/ui/Heading";
import { Alert } from "@/components/ui/Alert";
import { designSystem } from "@/config/design-system";
import { cn } from "@/lib/utils";

export type DeactivateMemberConfirmModalProps = {
  open: boolean;
  /** Shown in the subtitle for context (e.g. email or display). */
  memberLabel: string;
  /** Display name if available, else email — used in the confirmation question line only. */
  memberPromptName: string;
  submitting: boolean;
  error: string | null;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
};

/**
 * Confirms entity membership deactivation (not account deletion).
 */
export function DeactivateMemberConfirmModal({
  open,
  memberLabel,
  memberPromptName,
  submitting,
  error,
  onClose,
  onConfirm,
}: DeactivateMemberConfirmModalProps) {
  if (!open) return null;

  const { backdrop, panel } = designSystem.modal;

  return (
    <div
      className={cn(backdrop, "z-[60]")}
      role="presentation"
      onClick={() => {
        if (!submitting) onClose();
      }}
    >
      <div
        className={cn(panel, "max-w-lg")}
        role="dialog"
        aria-modal="true"
        aria-labelledby="deactivate-member-title"
        onClick={(ev) => ev.stopPropagation()}
      >
        <Heading variant="h3" id="deactivate-member-title">
          Deactivate member
        </Heading>
        {memberLabel.trim() !== "" ? (
          <p className="mt-1 text-sm text-textSecondary">{memberLabel.trim()}</p>
        ) : null}

        <p className="mt-4 text-sm text-textPrimary">
          Do you want to deactivate{" "}
          {memberPromptName.trim() !== "" ? memberPromptName.trim() : "this member"}?
        </p>

        <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-textPrimary">
          <li>
            They will be removed from this academy for this entity (membership
            becomes inactive/removed).
          </li>
          <li>Their user account will not be deleted.</li>
          <li>
            Active coach–athlete assignments tied to this academy may be removed
            or ended.
          </li>
        </ul>
        <p className="mt-3 text-xs text-textSecondary">
          Historical records are not erased; this only changes current
          membership and related active assignments in this entity.
        </p>

        {error ? (
          <Alert variant="danger" className="mt-4">
            {error}
          </Alert>
        ) : null}

        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <Button
            type="button"
            variant="neutral"
            disabled={submitting}
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="danger"
            loading={submitting}
            disabled={submitting}
            onClick={() => void onConfirm()}
          >
            Deactivate
          </Button>
        </div>
      </div>
    </div>
  );
}
