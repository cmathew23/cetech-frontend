"use client";

import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { LogOut } from "lucide-react";
import { useState } from "react";

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
  const [submitting, setSubmitting] = useState(false);

  if (!open) return null;

  async function handleLogout() {
    if (submitting) return;
    setSubmitting(true);
    try {
      await onConfirm();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      className="w-full max-w-[480px] overflow-hidden rounded-2xl bg-card p-0 shadow-lg"
      aria-labelledby="logout-dialog-title"
      aria-describedby="logout-confirm-message"
    >
      <div className="flex flex-col items-center px-7 py-7 sm:px-8 sm:py-8">
        <LogOut
          className="mb-4 h-10 w-10 shrink-0 text-primary"
          aria-hidden="true"
        />
        <h2
          id="logout-dialog-title"
          className="mb-3 text-center text-2xl font-semibold tracking-tight text-textPrimary sm:text-[1.625rem]"
        >
          Confirm Logout
        </h2>
        <p
          id="logout-confirm-message"
          className="mb-6 max-w-[26rem] text-center text-base leading-relaxed text-textSecondary"
        >
          Are you sure you want to log out of PeakFlow AMS?
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
            variant="primary"
            onClick={() => void handleLogout()}
            disabled={submitting}
          >
            Logout
          </Button>
        </div>
      </div>
    </Modal>
  );
}
