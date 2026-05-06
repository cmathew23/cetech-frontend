"use client";

import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { Modal } from "@/components/ui/Modal";
import { UserRoundX } from "lucide-react";

export type DeactivateMemberConfirmModalProps = {
  open: boolean;
  /** Display name, email, or best label for the confirmation line (pre-formatted by caller). */
  memberPromptName: string;
  submitting: boolean;
  error: string | null;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
};

/**
 * Confirms entity membership deactivation (same modal shell as logout / unassign).
 */
export function DeactivateMemberConfirmModal({
  open,
  memberPromptName,
  submitting,
  error,
  onClose,
  onConfirm,
}: DeactivateMemberConfirmModalProps) {
  if (!open) return null;

  const label = memberPromptName.trim();
  const who = label !== "" ? label : "this member";

  async function handleConfirm() {
    if (submitting) return;
    await onConfirm();
  }

  return (
    <Modal
      className="w-full max-w-[520px] overflow-hidden rounded-2xl bg-card p-0 shadow-lg"
      aria-labelledby="deactivate-member-title"
      aria-describedby="deactivate-member-desc"
    >
      <div className="flex flex-col items-center px-7 py-7 sm:px-8 sm:py-8">
        <UserRoundX
          className="mb-4 h-10 w-10 shrink-0 text-danger"
          aria-hidden="true"
        />
        <h2
          id="deactivate-member-title"
          className="mb-3 text-center text-2xl font-semibold tracking-tight text-textPrimary sm:text-[1.625rem]"
        >
          Deactivate Member
        </h2>
        <div
          id="deactivate-member-desc"
          className="mb-6 w-full max-w-[26rem] space-y-3 text-center"
        >
          <p className="text-base leading-relaxed text-textSecondary">
            Are you sure you want to deactivate {who}?
          </p>
          <p className="text-sm leading-relaxed text-textSecondary">
            This will remove their active membership from this academy. Their user
            account and historical records will remain unchanged.
          </p>
          <p className="text-sm leading-relaxed text-textSecondary">
            Any active coach-athlete assignments linked to this academy may also be
            ended.
          </p>
        </div>

        {error ? (
          <Alert variant="danger" className="mb-4 w-full max-w-[26rem]">
            {error}
          </Alert>
        ) : null}

        <div className="flex w-full flex-wrap justify-end gap-3 sm:gap-4">
          <Button
            type="button"
            variant="secondary"
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
            onClick={() => void handleConfirm()}
          >
            Deactivate
          </Button>
        </div>
      </div>
    </Modal>
  );
}
