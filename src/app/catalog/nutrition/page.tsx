"use client";

import { DashboardGate } from "@/components/layout/DashboardGate";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Heading } from "@/components/ui/Heading";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import {
  Table,
  TableBody,
  Td,
  Th,
  TableHead,
  TableRow,
} from "@/components/ui/Table";
import { CatalogPaginationControls } from "@/components/catalog/CatalogPaginationControls";
import { CatalogStatusNotice } from "@/components/catalog/CatalogStatusNotice";
import { isNormalizedApiError, type NormalizedApiError } from "@/lib/apiClient";
import {
  getNutritionCatalogItemById,
  listNutritionCatalogPage,
  mapNutritionDetailToNormalizedFood,
} from "@/lib/api/nutritionCatalog";
import type { CatalogPageMeta, NutritionCatalogItem } from "@/types/catalog.types";
import type { NormalizedFood, NutritionMinerals } from "@/types/nutrition.types";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type ChangeEvent } from "react";

const DEFAULT_META: CatalogPageMeta = {
  page: 1,
  limit: 20,
  total: null,
  totalPages: null,
};

type SelectedNutritionItem = {
  id: string;
  catalogItemId: string;
  food: NormalizedFood;
  servingCount: number;
};

type ScaledNutrition = {
  servingCount: number;
  servingAmount: number;
  servingUnit: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  minerals?: NutritionMinerals;
};

type DraftTotals = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  minerals?: NutritionMinerals;
};

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

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

function sanitizeServingCount(value: number): number {
  if (!Number.isFinite(value)) return 1;
  if (value < 0.1) return 0.1;
  return round1(value);
}

function hasAnyMineral(minerals?: NutritionMinerals): boolean {
  if (!minerals) return false;
  return (
    minerals.iron != null ||
    minerals.calcium != null ||
    minerals.sodium != null ||
    minerals.potassium != null ||
    minerals.magnesium != null
  );
}

function addOptionalNumber(
  current: number | undefined,
  incoming: number | undefined,
): number | undefined {
  if (incoming == null) return current;
  if (current == null) return round1(incoming);
  return round1(current + incoming);
}

function scaledNutrition(food: NormalizedFood, servingCount: number): ScaledNutrition {
  const normalizedCount = sanitizeServingCount(servingCount);
  const factor = normalizedCount;
  const servingAmount = round1(food.baseServing.amount * normalizedCount);
  const m = food.macrosPerBaseServing;
  const minerals = food.mineralsPerBaseServing;

  return {
    servingCount: normalizedCount,
    servingAmount,
    servingUnit: food.baseServing.unit,
    calories: round1(m.calories * factor),
    protein: round1(m.protein * factor),
    carbs: round1(m.carbs * factor),
    fat: round1(m.fat * factor),
    fiber: m.fiber != null ? round1(m.fiber * factor) : undefined,
    minerals: minerals
      ? {
          iron: minerals.iron != null ? round1(minerals.iron * factor) : undefined,
          calcium: minerals.calcium != null ? round1(minerals.calcium * factor) : undefined,
          sodium: minerals.sodium != null ? round1(minerals.sodium * factor) : undefined,
          potassium:
            minerals.potassium != null ? round1(minerals.potassium * factor) : undefined,
          magnesium:
            minerals.magnesium != null ? round1(minerals.magnesium * factor) : undefined,
        }
      : undefined,
  };
}

function baseServingLabel(food: NormalizedFood): string {
  const rawQty = food.metadata?.servingQuantity;
  const rawUnit = food.metadata?.servingUnit;
  const qty =
    typeof rawQty === "number"
      ? rawQty
      : typeof rawQty === "string" && rawQty.trim() !== ""
        ? Number(rawQty)
        : null;
  const unit =
    typeof rawUnit === "string" && rawUnit.trim() !== ""
      ? rawUnit.trim()
      : food.baseServing.unit;
  if (qty != null && Number.isFinite(qty)) {
    return `${qty} ${unit}`;
  }
  return unit;
}

export default function NutritionCatalogPage() {
  const router = useRouter();
  const [searchInput, setSearchInput] = useState("");
  const [sourceSystemInput, setSourceSystemInput] = useState("");
  const [qualityFlagInput, setQualityFlagInput] = useState("");

  const [search, setSearch] = useState("");
  const [sourceSystem, setSourceSystem] = useState("");
  const [qualityFlag, setQualityFlag] = useState("");
  const [page, setPage] = useState(1);

  const [items, setItems] = useState<NutritionCatalogItem[]>([]);
  const [meta, setMeta] = useState<CatalogPageMeta>(DEFAULT_META);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<NormalizedApiError | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [selectedItems, setSelectedItems] = useState<SelectedNutritionItem[]>([]);
  const [addingIds, setAddingIds] = useState<string[]>([]);

  useEffect(() => {
    void runFetch();
  }, [search, sourceSystem, qualityFlag, page]);

  const sourceOptions = useMemo(() => {
    const set = new Set<string>();
    items.forEach((row) => {
      if (row.sourceSystem) set.add(row.sourceSystem);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [items]);

  const qualityFlagOptions = useMemo(() => {
    const set = new Set<string>();
    items.forEach((row) => {
      row.qualityFlags.forEach((flag) => set.add(flag));
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [items]);

  async function runFetch() {
    setLoading(true);
    setError(null);
    try {
      const res = await listNutritionCatalogPage({
        search: search || undefined,
        sourceSystem: sourceSystem || undefined,
        qualityFlag: qualityFlag || undefined,
        page,
        limit: DEFAULT_META.limit,
      });
      setItems(res.items);
      setMeta(res.meta);
      setHasLoaded(true);
    } catch (e) {
      if (isNormalizedApiError(e)) {
        setError(e);
      } else {
        setError({
          message: "Failed to load nutrition catalog.",
          status: 0,
        });
      }
      setItems([]);
      setMeta(DEFAULT_META);
      setHasLoaded(true);
    } finally {
      setLoading(false);
    }
  }

  function applyFilters() {
    setPage(1);
    setSearch(searchInput.trim());
    setSourceSystem(sourceSystemInput.trim());
    setQualityFlag(qualityFlagInput.trim());
  }

  function handleFilterSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    applyFilters();
  }

  async function addCatalogItem(row: NutritionCatalogItem) {
    if (selectedItems.some((item) => item.catalogItemId === row.id)) return;
    setAddingIds((prev) => [...prev, row.id]);
    try {
      const detail = await getNutritionCatalogItemById(row.id);
      if (!detail) {
        throw new Error("Catalog detail not found for selection.");
      }
      const normalized = mapNutritionDetailToNormalizedFood(detail);
      setSelectedItems((prev) => {
        if (prev.some((item) => item.catalogItemId === row.id)) return prev;
        return [
          ...prev,
          {
            id: `${row.id}-${Date.now()}`,
            catalogItemId: row.id,
            food: normalized,
            servingCount: 1,
          },
        ];
      });
    } catch (e) {
      const nextError = isNormalizedApiError(e)
        ? e
        : { message: "Failed to add food item.", status: 0 };
      setError(nextError);
    } finally {
      setAddingIds((prev) => prev.filter((id) => id !== row.id));
    }
  }

  function removeSelectedItem(id: string) {
    setSelectedItems((prev) => prev.filter((item) => item.id !== id));
  }

  function updateServingCount(id: string, nextValue: number) {
    setSelectedItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, servingCount: sanitizeServingCount(nextValue) }
          : item,
      ),
    );
  }

  const totals = selectedItems.reduce<DraftTotals>(
    (acc, item) => {
      const n = scaledNutrition(item.food, item.servingCount);
      return {
        calories: round1(acc.calories + n.calories),
        protein: round1(acc.protein + n.protein),
        carbs: round1(acc.carbs + n.carbs),
        fat: round1(acc.fat + n.fat),
        fiber: addOptionalNumber(acc.fiber, n.fiber),
        minerals: {
          iron: addOptionalNumber(acc.minerals?.iron, n.minerals?.iron),
          calcium: addOptionalNumber(acc.minerals?.calcium, n.minerals?.calcium),
          sodium: addOptionalNumber(acc.minerals?.sodium, n.minerals?.sodium),
          potassium: addOptionalNumber(acc.minerals?.potassium, n.minerals?.potassium),
          magnesium: addOptionalNumber(acc.minerals?.magnesium, n.minerals?.magnesium),
        },
      };
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0 },
  );

  return (
    <DashboardGate>
      <div className="mx-auto w-full max-w-6xl space-y-4">
        <Card>
          <Heading variant="h2">Nutrition Catalog</Heading>

          <form onSubmit={handleFilterSubmit} className="grid grid-cols-1 gap-3 md:grid-cols-4">
            <div className="flex flex-col gap-1 md:col-span-2">
              <label htmlFor="nutrition-search" className="text-xs font-medium text-textPrimary">
                Search
              </label>
              <Input
                id="nutrition-search"
                value={searchInput}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchInput(e.target.value)}
                placeholder="Search food name"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="nutrition-source" className="text-xs font-medium text-textPrimary">
                Source System
              </label>
              <Select
                id="nutrition-source"
                value={sourceSystemInput}
                onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                  setSourceSystemInput(e.target.value)
                }
              >
                <option value="">All sources</option>
                {sourceOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </Select>
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="nutrition-flag" className="text-xs font-medium text-textPrimary">
                Quality Flag
              </label>
              <Select
                id="nutrition-flag"
                value={qualityFlagInput}
                onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                  setQualityFlagInput(e.target.value)
                }
              >
                <option value="">All flags</option>
                {qualityFlagOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </Select>
            </div>
            <div className="md:col-span-4 flex items-center gap-2">
              <Button type="submit" variant="primary">
                Apply Filters
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setSearchInput("");
                  setSourceSystemInput("");
                  setQualityFlagInput("");
                  setPage(1);
                  setSearch("");
                  setSourceSystem("");
                  setQualityFlag("");
                }}
              >
                Reset
              </Button>
            </div>
          </form>

          <CatalogStatusNotice
            loading={loading}
            error={error}
            empty={hasLoaded && items.length === 0}
            emptyMessage="No nutrition catalog items found."
          />

          {!loading && !error && items.length > 0 ? (
            <>
              <Table>
                <TableHead>
                  <TableRow variant="head">
                    <Th>Name</Th>
                    <Th>Source</Th>
                    <Th>Quality Status</Th>
                    <Th>Quality Flags</Th>
                    <Th className="text-right">Action</Th>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {items.map((row) => (
                    <TableRow key={row.id}>
                      <Td>{row.name}</Td>
                      <Td>{row.sourceSystem ?? "-"}</Td>
                      <Td>{row.qualityStatus ?? "-"}</Td>
                      <Td>
                        <div className="flex flex-wrap gap-1">
                          {row.qualityFlags.length === 0 ? (
                            <span className="text-xs text-textMuted">None</span>
                          ) : (
                            row.qualityFlags.map((flag) => (
                              <Badge key={`${row.id}-${flag}`} variant={qualityBadgeVariant(flag)}>
                                {flag}
                              </Badge>
                            ))
                          )}
                        </div>
                      </Td>
                      <Td className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            type="button"
                            variant="secondary"
                            onClick={() =>
                              router.push(`/catalog/nutrition/${encodeURIComponent(row.id)}`)
                            }
                          >
                            View
                          </Button>
                          <Button
                            type="button"
                            variant="primary"
                            loading={addingIds.includes(row.id)}
                            disabled={selectedItems.some(
                              (item) => item.catalogItemId === row.id,
                            )}
                            onClick={() => void addCatalogItem(row)}
                          >
                            {selectedItems.some((item) => item.catalogItemId === row.id)
                              ? "Added"
                              : "Add"}
                          </Button>
                        </div>
                      </Td>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <CatalogPaginationControls
                meta={meta}
                disable={loading}
                onPageChange={setPage}
              />
            </>
          ) : null}

          <section className="space-y-3 rounded-lg border border-border bg-bg p-4">
            <Heading variant="h3">Selected Nutrition Items (Local)</Heading>
            {selectedItems.length === 0 ? (
              <p className="text-sm text-textSecondary">
                No items selected yet.
              </p>
            ) : (
              <ul className="space-y-2">
                {selectedItems.map((item) => {
                  const nutrition = scaledNutrition(item.food, item.servingCount);
                  return (
                    <li
                      key={item.id}
                      className="space-y-2 rounded-lg border border-border bg-card p-3 text-xs text-textSecondary"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium text-textPrimary">{item.food.name}</p>
                          <p>
                            Source: {item.food.source} | ID: {item.food.sourceFoodId}
                          </p>
                          <p>
                            Base serving: {baseServingLabel(item.food)}
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="danger"
                          className="px-3 py-1 text-xs"
                          onClick={() => removeSelectedItem(item.id)}
                        >
                          Remove
                        </Button>
                      </div>

                      <div className="flex flex-col gap-1 sm:max-w-sm">
                        <label className="text-xs font-medium text-textPrimary">
                          Quantity (x base serving)
                        </label>
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant="secondary"
                            className="px-3 py-1"
                            onClick={() =>
                              updateServingCount(item.id, item.servingCount - 0.5)
                            }
                          >
                            -
                          </Button>
                          <Input
                            type="number"
                            min="0.1"
                            step="0.1"
                            value={String(item.servingCount)}
                            onChange={(e: ChangeEvent<HTMLInputElement>) =>
                              updateServingCount(item.id, Number(e.target.value))
                            }
                          />
                          <Button
                            type="button"
                            variant="secondary"
                            className="px-3 py-1"
                            onClick={() =>
                              updateServingCount(item.id, item.servingCount + 0.5)
                            }
                          >
                            +
                          </Button>
                        </div>
                      </div>

                      <p>
                        Quantity: {nutrition.servingCount}x ({nutrition.servingAmount}{" "}
                        {nutrition.servingUnit})
                      </p>
                      <p>
                        {nutrition.calories} kcal, P {nutrition.protein}g, C {nutrition.carbs}g,
                        F {nutrition.fat}g
                      </p>
                      {nutrition.fiber != null ? <p>Fiber: {nutrition.fiber}g</p> : null}
                      {hasAnyMineral(nutrition.minerals) ? (
                        <div>
                          <p>Minerals:</p>
                          {nutrition.minerals?.iron != null ? (
                            <p>Iron: {nutrition.minerals.iron}mg</p>
                          ) : null}
                          {nutrition.minerals?.calcium != null ? (
                            <p>Calcium: {nutrition.minerals.calcium}mg</p>
                          ) : null}
                          {nutrition.minerals?.sodium != null ? (
                            <p>Sodium: {nutrition.minerals.sodium}mg</p>
                          ) : null}
                          {nutrition.minerals?.potassium != null ? (
                            <p>Potassium: {nutrition.minerals.potassium}mg</p>
                          ) : null}
                          {nutrition.minerals?.magnesium != null ? (
                            <p>Magnesium: {nutrition.minerals.magnesium}mg</p>
                          ) : null}
                        </div>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            )}

            {selectedItems.length > 0 ? (
              <div className="rounded-lg border border-border bg-card p-3 text-xs font-medium text-textPrimary">
                <p className="mb-1 text-sm">Totals</p>
                <p>
                  {totals.calories} kcal, P {totals.protein}g, C {totals.carbs}g, F {totals.fat}g
                  {totals.fiber != null ? `, Fiber ${totals.fiber}g` : ""}
                </p>
                {hasAnyMineral(totals.minerals) ? (
                  <div className="mt-1 font-normal text-textSecondary">
                    {totals.minerals?.iron != null ? <p>Iron: {totals.minerals.iron}mg</p> : null}
                    {totals.minerals?.calcium != null ? (
                      <p>Calcium: {totals.minerals.calcium}mg</p>
                    ) : null}
                    {totals.minerals?.sodium != null ? (
                      <p>Sodium: {totals.minerals.sodium}mg</p>
                    ) : null}
                    {totals.minerals?.potassium != null ? (
                      <p>Potassium: {totals.minerals.potassium}mg</p>
                    ) : null}
                    {totals.minerals?.magnesium != null ? (
                      <p>Magnesium: {totals.minerals.magnesium}mg</p>
                    ) : null}
                  </div>
                ) : null}
              </div>
            ) : null}
          </section>
        </Card>
      </div>
    </DashboardGate>
  );
}
