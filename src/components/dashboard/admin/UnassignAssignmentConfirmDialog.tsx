"use client";

import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { UserMinus } from "lucide-react";

export type UnassignAssignmentConfirmDialogProps = {
  open: boolean;
  onClose: () => void;
  /** Preformatted display name; empty → generic confirmation copy. */
  athletePromptName: string;
  submitting: boolean;
  onConfirm: () => void | Promise<void>;
};

/**
 * Confirms removal of a coach–athlete assignment (same modal shell as logout confirmation).
 */
export function UnassignAssignmentConfirmDialog({
  open,
  onClose,
  athletePromptName,
  submitting,
  onConfirm,
}: UnassignAssignmentConfirmDialogProps) {
  if (!open) return null;

  const named = athletePromptName.trim();
  const message =
    named !== ""
      ? `Are you sure you want to unassign ${named}?`
      : "Are you sure you want to unassign this athlete?";

  async function handleConfirm() {
    if (submitting) return;
    await onConfirm();
  }

  return (
    <Modal
      className="w-full max-w-[480px] overflow-hidden rounded-2xl bg-card p-0 shadow-lg"
      aria-labelledby="unassign-dialog-title"
      aria-describedby="unassign-confirm-message"
    >
      <div className="flex flex-col items-center px-7 py-7 sm:px-8 sm:py-8">
        <UserMinus
          className="mb-4 h-10 w-10 shrink-0 text-danger"
          aria-hidden="true"
        />
        <h2
          id="unassign-dialog-title"
          className="mb-3 text-center text-2xl font-semibold tracking-tight text-textPrimary sm:text-[1.625rem]"
        >
          Confirm Unassign
        </h2>
        <p
          id="unassign-confirm-message"
          className="mb-6 max-w-[26rem] text-center text-base leading-relaxed text-textSecondary"
        >
          {message}
        </p>
        <div className="flex w-full flex-wrap justify-end gap-3 sm:gap-4">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="danger"
            loading={submitting}
            disabled={submitting}
            onClick={() => void handleConfirm()}
          >
            Unassign
          </Button>
        </div>
      </div>
    </Modal>
  );
}
