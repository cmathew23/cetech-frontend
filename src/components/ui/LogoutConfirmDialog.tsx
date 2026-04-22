"use client";

import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";

export type LogoutConfirmDialogProps = {
  open: boolean;
  onClose: () => void;
  /** Called after user confirms; dialog should close via onClose from caller or here. */
  onConfirm: () => void | Promise<void>;
};

/**
 * Shared logout confirmation for all dashboard roles (athlete, coach, academy admin).
 */
export function LogoutConfirmDialog({
  open,
  onClose,
  onConfirm,
}: LogoutConfirmDialogProps) {
  if (!open) return null;

  async function handleYes() {
    await onConfirm();
    onClose();
  }

  return (
    <Modal className="max-w-md">
      <p
        id="logout-confirm-message"
        className="text-base text-textPrimary"
      >
        Do you want to logout?
      </p>
      <div className="mt-6 flex flex-wrap justify-end gap-2">
        <Button type="button" variant="neutral" onClick={onClose}>
          Cancel
        </Button>
        <Button type="button" variant="primary" onClick={() => void handleYes()}>
          Yes
        </Button>
      </div>
    </Modal>
  );
}
