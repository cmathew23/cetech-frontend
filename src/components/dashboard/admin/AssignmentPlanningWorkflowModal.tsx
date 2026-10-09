"use client";

import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import type { AdminAssignmentWorkflowDisplay } from "@/lib/adminAssignmentPlanningWorkflowDisplay";
import { X } from "lucide-react";

export type AssignmentPlanningWorkflowModalProps = {
  open: boolean;
  athleteLabel: string;
  display: AdminAssignmentWorkflowDisplay;
  onClose: () => void;
};

/**
 * Informational only: describes the current assignment workflow.
 * Close does not save, confirm, or change canGeneratePlan.
 */
function uniqueDisplayLines(display: AdminAssignmentWorkflowDisplay): string[] {
  const lines = [
    display.headCoachLabel,
    ...display.domainLines.map((line) => line.summary),
    display.guidanceLine ?? "",
  ].map((line) => line.trim());
  return lines.filter((line, index) => line !== "" && lines.indexOf(line) === index);
}

export function AssignmentPlanningWorkflowModal({
  open,
  athleteLabel,
  display,
  onClose,
}: AssignmentPlanningWorkflowModalProps) {
  if (!open) return null;

  const name = athleteLabel.trim();

  return (
    <Modal
      className="w-full max-w-[560px] overflow-hidden rounded-2xl bg-card p-0 shadow-lg"
      aria-labelledby="assignment-planning-workflow-title"
      aria-describedby="assignment-planning-workflow-copy"
    >
      <div className="relative px-4 py-6 sm:px-8 sm:py-8">
        <button
          type="button"
          className="absolute right-4 top-4 rounded-md p-1 text-textSecondary hover:bg-slate-100 hover:text-textPrimary"
          aria-label="Close"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </button>
        <h2
          id="assignment-planning-workflow-title"
          className="pr-8 text-xl font-semibold tracking-tight text-textPrimary sm:text-2xl"
        >
          Planning Workflow
        </h2>
        <p
          id="assignment-planning-workflow-copy"
          className="mt-2 text-sm leading-relaxed text-textSecondary"
        >
          Informational only. This does not confirm, save, or change assignments
          or plan-generation permissions.
          {name !== "" ? ` Athlete: ${name}.` : ""}
        </p>
        <p className="mt-4 text-sm font-medium text-textPrimary">
          {display.workflowTitle}
        </p>
        {display.statusMessage ? (
          <p className="mt-1 text-xs text-textSecondary">{display.statusMessage}</p>
        ) : null}
        <ul className="mt-4 space-y-2 text-sm text-textSecondary">
          {uniqueDisplayLines(display).map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
        <div className="mt-6 flex justify-end">
          <Button type="button" variant="primary" onClick={onClose}>
            Got it
          </Button>
        </div>
      </div>
    </Modal>
  );
}
