"use client";

import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { AlertCircle } from "lucide-react";

export type AssignmentValidationModalProps = {
  open: boolean;
  message: string;
  onClose: () => void;
};

/**
 * Blocks invalid assignment selections before submit (same modal shell as unassign).
 */
export function AssignmentValidationModal({
  open,
  message,
  onClose,
}: AssignmentValidationModalProps) {
  if (!open) return null;

  return (
    <Modal
      className="w-full max-w-[480px] overflow-hidden rounded-2xl bg-card p-0 shadow-lg"
      aria-labelledby="assignment-validation-title"
      aria-describedby="assignment-validation-message"
    >
      <div className="flex flex-col items-center px-7 py-7 sm:px-8 sm:py-8">
        <AlertCircle
          className="mb-4 h-10 w-10 shrink-0 text-warning"
          aria-hidden="true"
        />
        <h2
          id="assignment-validation-title"
          className="mb-3 text-center text-2xl font-semibold tracking-tight text-textPrimary sm:text-[1.625rem]"
        >
          Cannot Assign Coaches
        </h2>
        <p
          id="assignment-validation-message"
          className="mb-6 max-w-[26rem] text-center text-base leading-relaxed text-textSecondary"
        >
          {message}
        </p>
        <div className="flex w-full flex-wrap justify-end gap-3 sm:gap-4">
          <Button type="button" variant="primary" onClick={onClose}>
            OK
          </Button>
        </div>
      </div>
    </Modal>
  );
}
