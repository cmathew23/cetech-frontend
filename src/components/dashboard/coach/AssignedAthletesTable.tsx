"use client";

import { Button } from "@/components/ui/Button";
import {
  Table,
  TableBody,
  TableHead,
  TableRow,
  Td,
  Th,
} from "@/components/ui/Table";
import type { CoachAssignedAthleteRow } from "@/lib/api/coachMe";
import { formatEnumeratedLabel, formatPersonNameForDisplay } from "@/lib/textFormat";
import Link from "next/link";

function AssignedAthleteActions({
  athleteId,
  hasPlanningProfile,
  canValidateLevel,
}: {
  athleteId: string;
  hasPlanningProfile: boolean;
  canValidateLevel: boolean;
}) {
  const athleteIdTrimmed = athleteId.trim();
  if (athleteIdTrimmed === "") {
    return (
      <span className="text-sm text-textMuted">Athlete route not available</span>
    );
  }
  if (!hasPlanningProfile) {
    return (
      <div className="space-y-1.5">
        <span className="inline-flex rounded-lg border border-border bg-bg px-3 py-2 text-sm font-medium text-textSecondary">
          Planning Profile Pending
        </span>
        <p className="text-xs text-textMuted">
          Athlete must complete APP before validation.
        </p>
      </div>
    );
  }
  return (
    <div className="flex flex-wrap gap-2">
      <Link
        href={`/coach/athletes/${encodeURIComponent(athleteIdTrimmed)}/planning-profile`}
      >
        <Button type="button" variant="secondary">
          View Planning Profile
        </Button>
      </Link>
      {canValidateLevel ? (
        <Link
          href={`/coach/athletes/${encodeURIComponent(athleteIdTrimmed)}/level-validation`}
        >
          <Button type="button" variant="primary">
            Validate Level
          </Button>
        </Link>
      ) : null}
    </div>
  );
}

export function AssignedAthletesTable({
  loading,
  error,
  athletes,
  canValidateLevel,
}: {
  loading: boolean;
  error: string | null;
  athletes: CoachAssignedAthleteRow[];
  canValidateLevel: boolean;
}) {
  if (loading) {
    return <p className="p-4 text-sm text-textSecondary md:p-5">Loading assigned athletes…</p>;
  }
  if (error) {
    return (
      <p className="p-4 text-sm text-textSecondary md:p-5">
        Could not load assigned athletes.
      </p>
    );
  }
  if (athletes.length === 0) {
    return <p className="p-4 text-sm text-textSecondary md:p-5">No athletes assigned yet.</p>;
  }
  return (
    <Table className="w-full min-w-[760px] table-auto border-0 shadow-none">
      <TableHead>
        <TableRow variant="head">
          <Th>Display name</Th>
          <Th>Email</Th>
          <Th>Athlete status</Th>
          <Th>Membership</Th>
          <Th>Actions</Th>
        </TableRow>
      </TableHead>
      <TableBody>
        {athletes.map((row, index) => (
          <TableRow key={`${row.email}-${index}`}>
            <Td>
              {row.displayName.trim() !== ""
                ? formatPersonNameForDisplay(row.displayName)
                : "—"}
            </Td>
            <Td className="max-w-[12rem] truncate" title={row.email}>
              {row.email}
            </Td>
            <Td>{formatEnumeratedLabel(row.lifecycle)}</Td>
            <Td>{formatEnumeratedLabel(row.membershipStatus)}</Td>
            <Td>
              <AssignedAthleteActions
                athleteId={row.athleteId}
                hasPlanningProfile={row.hasPlanningProfile}
                canValidateLevel={canValidateLevel}
              />
            </Td>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
