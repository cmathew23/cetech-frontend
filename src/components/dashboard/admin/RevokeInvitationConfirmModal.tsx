"use client";

import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { MailX } from "lucide-react";

type RevokeInvitationConfirmModalProps = {
  open: boolean;
  submitting: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
};

export function RevokeInvitationConfirmModal({
  open,
  submitting,
  onClose,
  onConfirm,
}: RevokeInvitationConfirmModalProps) {
  if (!open) return null;

  async function handleConfirm() {
    if (submitting) return;
    await onConfirm();
  }

  return (
    <Modal
      className="w-full max-w-[480px] overflow-hidden rounded-2xl bg-card p-0 shadow-lg"
      aria-labelledby="revoke-invitation-title"
      aria-describedby="revoke-invitation-message"
    >
      <div className="flex flex-col items-center px-7 py-7 sm:px-8 sm:py-8">
        <MailX
          className="mb-4 h-10 w-10 shrink-0 text-danger"
          aria-hidden="true"
        />
        <h2
          id="revoke-invitation-title"
          className="mb-3 text-center text-2xl font-semibold tracking-tight text-textPrimary sm:text-[1.625rem]"
        >
          Revoke invitation
        </h2>
        <p
          id="revoke-invitation-message"
          className="mb-6 max-w-[26rem] text-center text-base leading-relaxed text-textSecondary"
        >
          Revoke this invitation? The invitee will no longer be able to accept it.
        </p>
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
            Revoke
          </Button>
        </div>
      </div>
    </Modal>
  );
}
