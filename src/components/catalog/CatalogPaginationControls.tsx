"use client";

import { Button } from "@/components/ui/Button";
import type { CatalogPageMeta } from "@/types/catalog.types";

type CatalogPaginationControlsProps = {
  meta: CatalogPageMeta;
  disable: boolean;
  onPageChange: (nextPage: number) => void;
};

export function CatalogPaginationControls({
  meta,
  disable,
  onPageChange,
}: CatalogPaginationControlsProps) {
  const hasPrev = meta.page > 1;
  const hasNext =
    meta.totalPages != null ? meta.page < meta.totalPages : true;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-card p-3">
      <p className="text-sm text-textSecondary">
        Page <span className="font-medium text-textPrimary">{meta.page}</span>
        {meta.totalPages != null ? (
          <>
            {" "}
            of{" "}
            <span className="font-medium text-textPrimary">{meta.totalPages}</span>
          </>
        ) : null}
        {meta.total != null ? (
          <>
            {" "}
            | Total:{" "}
            <span className="font-medium text-textPrimary">{meta.total}</span>
          </>
        ) : null}
      </p>

      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="secondary"
          disabled={disable || !hasPrev}
          onClick={() => onPageChange(meta.page - 1)}
        >
          Previous
        </Button>
        <Button
          type="button"
          variant="secondary"
          disabled={disable || !hasNext}
          onClick={() => onPageChange(meta.page + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
