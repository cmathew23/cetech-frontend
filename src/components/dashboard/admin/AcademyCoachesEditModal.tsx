"use client";

import { Button } from "@/components/ui/Button";
import { Heading } from "@/components/ui/Heading";
import { Select } from "@/components/ui/Select";
import { designSystem } from "@/config/design-system";
import type {
  AcademyCoachAssignableRole,
  AcademyCoachFunctionOption,
  AcademyCoachRole,
  AcademyCoachStructureRow,
} from "@/lib/api/academyMeCoaches";
import { formatPersonNameForDisplay, toTitleCaseInput } from "@/lib/textFormat";
import { cn } from "@/lib/utils";
import {
  useMemo,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";

const ROLE_SELECT_VALUE = {
  HEAD: "HEAD_COACH",
  ASSISTANT: "ASSISTANT_COACH",
} as const;

type Draft = {
  role: AcademyCoachAssignableRole;
  functions: Set<string>;
};

type AcademyCoachesEditModalProps = {
  open: boolean;
  coach: AcademyCoachStructureRow | null;
  functionCatalog: AcademyCoachFunctionOption[];
  saving: boolean;
  saveError: string | null;
  onClose: () => void;
  onSave: (input: {
    role: AcademyCoachAssignableRole;
    functions: string[];
  }) => Promise<void>;
};

function defaultAssignableRole(role: AcademyCoachRole): AcademyCoachAssignableRole {
  return role === "HEAD_COACH" ? "HEAD_COACH" : "ASSISTANT_COACH";
}

function roleToSelectValue(role: AcademyCoachAssignableRole): string {
  return role;
}

function selectValueToRole(value: string): AcademyCoachAssignableRole {
  if (value === ROLE_SELECT_VALUE.HEAD) return "HEAD_COACH";
  return "ASSISTANT_COACH";
}

type InnerProps = Omit<
  AcademyCoachesEditModalProps,
  "open" | "coach"
> & {
  coach: AcademyCoachStructureRow;
};

function AcademyCoachesEditModalInner({
  coach,
  functionCatalog,
  saving,
  saveError,
  onClose,
  onSave,
}: InnerProps) {
  const [draft, setDraft] = useState<Draft>(() => ({
    role: defaultAssignableRole(coach.role),
    functions: new Set(coach.functions),
  }));

  const nameDisplay = useMemo(() => {
    const n = [coach.firstName, coach.lastName].filter(Boolean).join(" ");
    return n.trim() !== "" ? formatPersonNameForDisplay(n) : "—";
  }, [coach.firstName, coach.lastName]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const payload = {
      role: draft.role,
      functions: [...draft.functions].sort((a, b) => a.localeCompare(b)),
    };
    if (process.env.NEXT_PUBLIC_DEBUG_COACH_ROLE === "1") {
      console.debug("[AcademyCoachRole] modal submit", { payload });
    }
    await onSave(payload);
  }

  function toggleFunction(key: string) {
    setDraft((d) => {
      const next = new Set(d.functions);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return { ...d, functions: next };
    });
  }

  const { backdrop, panel } = designSystem.modal;

  return (
    <div
      className={cn(backdrop, "z-[60]")}
      role="presentation"
      onClick={() => {
        if (!saving) onClose();
      }}
    >
      <div
        className={cn(panel, "max-h-[90vh] max-w-lg overflow-y-auto")}
        role="dialog"
        aria-modal="true"
        aria-labelledby="academy-coach-edit-title"
        onClick={(ev) => ev.stopPropagation()}
      >
        <Heading variant="h3" id="academy-coach-edit-title">
          Edit coach
        </Heading>
        <p className="mt-1 text-sm text-textSecondary">
          {nameDisplay}
          {coach.email.trim() !== "" ? (
            <span className="text-textMuted"> · {coach.email}</span>
          ) : null}
        </p>

        <form className="mt-6 space-y-5" onSubmit={(e) => void handleSubmit(e)}>
          <div className="flex flex-col gap-1">
            <label
              htmlFor="academy-coach-role"
              className="text-xs font-medium text-textPrimary"
            >
              Role
            </label>
            <Select
              id="academy-coach-role"
              value={roleToSelectValue(draft.role)}
              disabled={saving}
              onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                setDraft((d) => ({
                  ...d,
                  role: selectValueToRole(e.target.value),
                }))
              }
            >
              <option value={ROLE_SELECT_VALUE.HEAD}>Head Coach</option>
              <option value={ROLE_SELECT_VALUE.ASSISTANT}>Assistant Coach</option>
            </Select>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-medium text-textPrimary">Functions</p>
            {functionCatalog.length === 0 ? (
              <p className="text-sm text-textSecondary">
                No function options were returned for this academy. You can still
                update the coach role.
              </p>
            ) : (
              <ul className="max-h-48 space-y-2 overflow-y-auto rounded-lg border border-border p-3">
                {functionCatalog.map((opt) => (
                  <li key={opt.value}>
                    <label className="flex cursor-pointer items-start gap-2 text-sm text-textPrimary">
                      <input
                        type="checkbox"
                        className="mt-0.5"
                        checked={draft.functions.has(opt.value)}
                        disabled={saving}
                        onChange={() => toggleFunction(opt.value)}
                      />
                      <span>
                        {toTitleCaseInput(
                          (opt.label !== "" ? opt.label : opt.value).trim(),
                        )}
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {saveError ? (
            <p className="text-sm text-danger" role="alert">
              {saveError}
            </p>
          ) : null}

          <div className="flex flex-wrap gap-2 pt-2">
            <Button type="submit" variant="primary" loading={saving} disabled={saving}>
              Save
            </Button>
            <Button
              type="button"
              variant="neutral"
              disabled={saving}
              onClick={onClose}
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function AcademyCoachesEditModal({
  open,
  coach,
  ...rest
}: AcademyCoachesEditModalProps) {
  if (!open || !coach) return null;
  return <AcademyCoachesEditModalInner key={coach.coachUserId} coach={coach} {...rest} />;
}
