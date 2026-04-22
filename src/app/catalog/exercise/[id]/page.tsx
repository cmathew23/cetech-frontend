"use client";

import { DashboardGate } from "@/components/layout/DashboardGate";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Heading } from "@/components/ui/Heading";
import { Stack } from "@/components/ui/Stack";
import { isNormalizedApiError, type NormalizedApiError } from "@/lib/apiClient";
import { getExerciseCatalogItemById } from "@/lib/api/exerciseCatalog";
import type { ExerciseCatalogDetail } from "@/types/catalog.types";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

const TRACEABILITY_KEYS = [
  "sourceSystem",
  "sourceExternalId",
  "externalId",
  "sourceId",
  "providerUpdatedAt",
  "ingestedAt",
  "createdAt",
  "updatedAt",
];

function renderValue(value: unknown): string {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) {
    return value
      .map((entry) => (typeof entry === "string" ? entry : JSON.stringify(entry)))
      .join(", ");
  }
  if (value && typeof value === "object") {
    return JSON.stringify(value);
  }
  return "-";
}

export default function ExerciseCatalogDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const [detail, setDetail] = useState<ExerciseCatalogDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<NormalizedApiError | null>(null);

  useEffect(() => {
    if (!id) return;
    void loadDetail(id);
  }, [id]);

  const traceabilityEntries = useMemo(() => {
    if (!detail) return [] as Array<[string, unknown]>;
    const rows: Array<[string, unknown]> = [];
    TRACEABILITY_KEYS.forEach((key) => {
      const value = detail.raw[key];
      if (value !== undefined && value !== null) rows.push([key, value]);
    });
    return rows;
  }, [detail]);

  async function loadDetail(nextId: string) {
    setLoading(true);
    setError(null);
    try {
      const result = await getExerciseCatalogItemById(nextId);
      if (!result) {
        setError({
          message: "Exercise catalog item not found.",
          status: 404,
        });
        setDetail(null);
      } else {
        setDetail(result);
      }
    } catch (e) {
      if (isNormalizedApiError(e)) {
        setError(e);
      } else {
        setError({
          message: "Failed to load exercise catalog detail.",
          status: 0,
        });
      }
      setDetail(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <DashboardGate>
      <div className="mx-auto w-full max-w-4xl space-y-4">
        <Card>
          <Stack spacing="md">
            <div className="flex items-center justify-between gap-3">
              <Heading variant="h2">Exercise Catalog Detail</Heading>
              <Button
                type="button"
                variant="neutral"
                onClick={() => router.push("/catalog/exercise")}
              >
                Back to Catalog
              </Button>
            </div>

            {loading ? <p className="text-sm text-textSecondary">Loading...</p> : null}
            {!loading && error ? (
              <p className={error.status === 401 ? "text-warning" : "text-danger"}>
                {error.status === 401
                  ? "Unauthorized. Redirecting to login..."
                  : error.message}
              </p>
            ) : null}

            {!loading && !error && detail ? (
              <Stack spacing="md">
                <section className="rounded-lg border border-border bg-bg p-4">
                  <h3 className="text-base font-semibold text-textPrimary">{detail.name}</h3>
                  <div className="mt-2 grid grid-cols-1 gap-2 text-sm md:grid-cols-2">
                    <p className="text-textSecondary">
                      Category:{" "}
                      <span className="font-medium text-textPrimary">
                        {detail.categoryName ?? detail.category ?? "-"}
                      </span>
                    </p>
                    <p className="text-textSecondary">
                      Source:{" "}
                      <span className="font-medium text-textPrimary">
                        {detail.sourceSystem ?? "-"}
                      </span>
                    </p>
                    <p className="text-textSecondary">
                      Source External ID:{" "}
                      <span className="font-medium text-textPrimary">
                        {detail.sourceExternalId ?? "-"}
                      </span>
                    </p>
                    <p className="text-textSecondary">
                      Source UUID:{" "}
                      <span className="font-medium text-textPrimary">
                        {detail.sourceUuid ?? "-"}
                      </span>
                    </p>
                  </div>
                  {detail.descriptionText ?? detail.description ? (
                    <p className="mt-3 text-sm text-textSecondary">
                      {detail.descriptionText ?? detail.description}
                    </p>
                  ) : null}
                  {detail.primaryMuscles && detail.primaryMuscles.length > 0 ? (
                    <p className="mt-3 text-sm text-textSecondary">
                      Primary muscles:{" "}
                      <span className="font-medium text-textPrimary">
                        {detail.primaryMuscles.join(", ")}
                      </span>
                    </p>
                  ) : null}
                  {detail.secondaryMuscles && detail.secondaryMuscles.length > 0 ? (
                    <p className="text-sm text-textSecondary">
                      Secondary muscles:{" "}
                      <span className="font-medium text-textPrimary">
                        {detail.secondaryMuscles.join(", ")}
                      </span>
                    </p>
                  ) : null}
                  {detail.equipment && detail.equipment.length > 0 ? (
                    <p className="text-sm text-textSecondary">
                      Equipment:{" "}
                      <span className="font-medium text-textPrimary">
                        {detail.equipment.join(", ")}
                      </span>
                    </p>
                  ) : null}
                </section>

                <section className="rounded-lg border border-border bg-bg p-4">
                  <h4 className="text-sm font-semibold text-textPrimary">Traceability</h4>
                  {traceabilityEntries.length === 0 ? (
                    <p className="mt-2 text-sm text-textSecondary">
                      No traceability fields available.
                    </p>
                  ) : (
                    <div className="mt-2 grid grid-cols-1 gap-2 text-sm md:grid-cols-2">
                      {traceabilityEntries.map(([key, value]) => (
                        <p key={key} className="text-textSecondary">
                          {key}:{" "}
                          <span className="font-medium text-textPrimary">
                            {renderValue(value)}
                          </span>
                        </p>
                      ))}
                    </div>
                  )}
                </section>
              </Stack>
            ) : null}
          </Stack>
        </Card>
      </div>
    </DashboardGate>
  );
}
