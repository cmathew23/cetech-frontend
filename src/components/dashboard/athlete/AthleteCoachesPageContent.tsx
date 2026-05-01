"use client";

import { DashboardCardShell } from "@/components/dashboard/shared/DashboardCardShell";
import {
  Table,
  TableBody,
  TableHead,
  TableRow,
  Td,
  Th,
} from "@/components/ui/Table";
import { useAuth } from "@/hooks/useAuth";
import { formatEnumeratedLabel, formatPersonNameForDisplay } from "@/lib/textFormat";
import { useMemo } from "react";

export function AthleteCoachesPageContent() {
  const { accessGateReady, accessContext } = useAuth();

  const coaches = useMemo(
    () => accessContext?.assignedCoaches ?? [],
    [accessContext?.assignedCoaches],
  );

  const loading = !accessGateReady;

  return (
    <DashboardCardShell className="flex min-h-0 flex-col overflow-hidden p-0">
      {loading ? (
        <p className="p-4 text-sm text-textSecondary md:p-5">Loading coaches…</p>
      ) : coaches.length === 0 ? (
        <p className="p-4 text-sm text-textSecondary md:p-5">
          No coaches assigned yet.
        </p>
      ) : (
        <Table className="w-full min-w-[980px] table-auto border-0 shadow-none">
          <TableHead>
            <TableRow variant="head">
              <Th>Coach Name</Th>
              <Th>Coach Role</Th>
              <Th>Coach Function</Th>
              <Th>Email</Th>
              <Th>Phone</Th>
              <Th>Training Entity Name</Th>
              <Th>Status</Th>
            </TableRow>
          </TableHead>
          <TableBody>
            {coaches.map((c, idx) => (
              <TableRow key={`${c.coachId}-${idx}`}>
                <Td>
                  {c.coachName.trim() !== ""
                    ? formatPersonNameForDisplay(c.coachName)
                    : "—"}
                </Td>
                <Td>{formatEnumeratedLabel(c.coachRole)}</Td>
                <Td>{formatEnumeratedLabel(c.coachFunction)}</Td>
                <Td className="max-w-[14rem] truncate" title={c.email}>
                  {c.email}
                </Td>
                <Td>{c.phone ?? "Unavailable"}</Td>
                <Td>{c.trainingEntityName}</Td>
                <Td>{c.status}</Td>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </DashboardCardShell>
  );
}
