"use client";

import { Alert } from "@/components/ui/Alert";
import type { NormalizedApiError } from "@/lib/apiClient";

type CatalogStatusNoticeProps = {
  loading: boolean;
  error: NormalizedApiError | null;
  empty: boolean;
  emptyMessage: string;
};

export function CatalogStatusNotice({
  loading,
  error,
  empty,
  emptyMessage,
}: CatalogStatusNoticeProps) {
  if (loading) {
    return <p className="text-sm text-textSecondary">Loading...</p>;
  }
  if (error) {
    if (error.status === 401) {
      return (
        <Alert variant="warning">
          Unauthorized. Redirecting to login...
        </Alert>
      );
    }
    return <Alert variant="danger">{error.message}</Alert>;
  }
  if (empty) {
    return <p className="text-sm text-textSecondary">{emptyMessage}</p>;
  }
  return null;
}
