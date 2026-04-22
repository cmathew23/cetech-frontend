"use client";

import { DashboardGate } from "@/components/layout/DashboardGate";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Heading } from "@/components/ui/Heading";
import { Stack } from "@/components/ui/Stack";
import { isNormalizedApiError, type NormalizedApiError } from "@/lib/apiClient";
import {
  getNutritionCatalogItemById,
  mapNutritionDetailToNormalizedFood,
} from "@/lib/api/nutritionCatalog";
import type { NutritionCatalogDetail } from "@/types/catalog.types";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

const TRACEABILITY_KEYS = [
  "sourceSystem",
  "sourceFoodCode",
  "sourceName",
  "sourceVersion",
  "qualityStatus",
  "qualityFlags",
  "qualityFlag",
  "dataVersion",
  "providerUpdatedAt",
  "ingestedAt",
  "createdAt",
  "updatedAt",
];

function qualityBadgeVariant(flag: string): "success" | "warning" | "danger" {
  const key = flag.toLowerCase();
  if (key.includes("error") || key.includes("invalid") || key.includes("reject")) {
    return "danger";
  }
  if (key.includes("warn") || key.includes("review") || key.includes("missing")) {
    return "warning";
  }
  return "success";
}

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

function servingText(detail: NutritionCatalogDetail): string {
  const q = detail.raw.servingQuantity;
  const unit = detail.raw.servingUnit;
  const quantity =
    typeof q === "number"
      ? q
      : typeof q === "string" && q.trim() !== ""
        ? Number(q)
        : null;
  const servingUnit =
    typeof unit === "string" && unit.trim() !== "" ? unit.trim() : null;
  if (servingUnit && quantity != null && Number.isFinite(quantity)) {
    return `${quantity} ${servingUnit}`;
  }
  if (servingUnit) return servingUnit;
  return "-";
}

export default function NutritionCatalogDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const [detail, setDetail] = useState<NutritionCatalogDetail | null>(null);
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

  const normalized = useMemo(() => {
    if (!detail) return null;
    return mapNutritionDetailToNormalizedFood(detail);
  }, [detail]);

  async function loadDetail(nextId: string) {
    setLoading(true);
    setError(null);
    try {
      const result = await getNutritionCatalogItemById(nextId);
      if (!result) {
        setError({
          message: "Nutrition catalog item not found.",
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
          message: "Failed to load nutrition catalog detail.",
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
              <Heading variant="h2">Nutrition Catalog Detail</Heading>
              <Button
                type="button"
                variant="neutral"
                onClick={() => router.push("/catalog/nutrition")}
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
                      Source:{" "}
                      <span className="font-medium text-textPrimary">
                        {detail.sourceSystem ?? "-"}
                      </span>
                    </p>
                    <p className="text-textSecondary">
                      Source Code:{" "}
                      <span className="font-medium text-textPrimary">
                        {detail.sourceFoodCode ?? "-"}
                      </span>
                    </p>
                    <p className="text-textSecondary">
                      Quality Status:{" "}
                      <span className="font-medium text-textPrimary">
                        {detail.qualityStatus ?? "-"}
                      </span>
                    </p>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1">
                    {detail.qualityFlags.length === 0 ? (
                      <span className="text-xs text-textMuted">No quality flags</span>
                    ) : (
                      detail.qualityFlags.map((flag) => (
                        <Badge key={flag} variant={qualityBadgeVariant(flag)}>
                          {flag}
                        </Badge>
                      ))
                    )}
                  </div>
                </section>

                {normalized ? (
                  <section className="rounded-lg border border-border bg-bg p-4">
                    <h4 className="text-sm font-semibold text-textPrimary">
                      Nutrition (Per Base Serving)
                    </h4>
                    <p className="mt-1 text-xs text-textSecondary">
                      {servingText(detail)}
                    </p>
                    <div className="mt-2 grid grid-cols-1 gap-2 text-sm md:grid-cols-2">
                      <p className="text-textSecondary">
                        Calories:{" "}
                        <span className="font-medium text-textPrimary">
                          {normalized.macrosPerBaseServing.calories}
                        </span>
                      </p>
                      <p className="text-textSecondary">
                        Protein (g):{" "}
                        <span className="font-medium text-textPrimary">
                          {normalized.macrosPerBaseServing.protein}
                        </span>
                      </p>
                      <p className="text-textSecondary">
                        Carbs (g):{" "}
                        <span className="font-medium text-textPrimary">
                          {normalized.macrosPerBaseServing.carbs}
                        </span>
                      </p>
                      <p className="text-textSecondary">
                        Fat (g):{" "}
                        <span className="font-medium text-textPrimary">
                          {normalized.macrosPerBaseServing.fat}
                        </span>
                      </p>
                      <p className="text-textSecondary">
                        Fiber (g):{" "}
                        <span className="font-medium text-textPrimary">
                          {normalized.macrosPerBaseServing.fiber ?? "-"}
                        </span>
                      </p>
                    </div>
                    <div className="mt-3 grid grid-cols-1 gap-2 text-sm md:grid-cols-2">
                      <p className="text-textSecondary">
                        Na (mg):{" "}
                        <span className="font-medium text-textPrimary">
                          {normalized.mineralsPerBaseServing?.sodium ?? "-"}
                        </span>
                      </p>
                      <p className="text-textSecondary">
                        K (mg):{" "}
                        <span className="font-medium text-textPrimary">
                          {normalized.mineralsPerBaseServing?.potassium ?? "-"}
                        </span>
                      </p>
                      <p className="text-textSecondary">
                        Mg (mg):{" "}
                        <span className="font-medium text-textPrimary">
                          {normalized.mineralsPerBaseServing?.magnesium ?? "-"}
                        </span>
                      </p>
                      <p className="text-textSecondary">
                        Ca (mg):{" "}
                        <span className="font-medium text-textPrimary">
                          {normalized.mineralsPerBaseServing?.calcium ?? "-"}
                        </span>
                      </p>
                      <p className="text-textSecondary">
                        Fe (mg):{" "}
                        <span className="font-medium text-textPrimary">
                          {normalized.mineralsPerBaseServing?.iron ?? "-"}
                        </span>
                      </p>
                    </div>
                  </section>
                ) : null}

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
