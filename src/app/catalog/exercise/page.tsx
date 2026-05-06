"use client";

import { CatalogPaginationControls } from "@/components/catalog/CatalogPaginationControls";
import { CatalogStatusNotice } from "@/components/catalog/CatalogStatusNotice";
import { DashboardGate } from "@/components/layout/DashboardGate";
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
import { isNormalizedApiError, type NormalizedApiError } from "@/lib/apiClient";
import { listExerciseCatalogPage } from "@/lib/api/exerciseCatalog";
import { formatEnumeratedLabel, toTitleCaseInput } from "@/lib/textFormat";
import type { CatalogPageMeta, ExerciseCatalogItem } from "@/types/catalog.types";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type ChangeEvent } from "react";

const CATEGORY_OPTIONS = [
  "",
  "Abs",
  "Arms",
  "Back",
  "Cardio",
  "Chest",
  "Legs",
  "Shoulders",
] as const;

const DEFAULT_META: CatalogPageMeta = {
  page: 1,
  limit: 20,
  total: null,
  totalPages: null,
};

type SelectedExercise = {
  localId: string;
  exercise: ExerciseCatalogItem;
  durationMinutes: number;
};

function parsePositiveInt(value: string): number {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 1) return 1;
  return Math.round(n);
}

export default function ExerciseCatalogPage() {
  const router = useRouter();
  const [searchInput, setSearchInput] = useState("");
  const [sourceSystemInput, setSourceSystemInput] = useState("");
  const [categoryInput, setCategoryInput] = useState("");

  const [search, setSearch] = useState("");
  const [sourceSystem, setSourceSystem] = useState("");
  const [category, setCategory] = useState("");
  const [page, setPage] = useState(1);

  const [items, setItems] = useState<ExerciseCatalogItem[]>([]);
  const [meta, setMeta] = useState<CatalogPageMeta>(DEFAULT_META);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<NormalizedApiError | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [selected, setSelected] = useState<SelectedExercise[]>([]);

  useEffect(() => {
    void runFetch();
  }, [search, sourceSystem, category, page]);

  const sourceOptions = useMemo(() => {
    const set = new Set<string>();
    items.forEach((row) => {
      if (row.sourceSystem) set.add(row.sourceSystem);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [items]);

  async function runFetch() {
    setLoading(true);
    setError(null);
    try {
      const res = await listExerciseCatalogPage({
        search: search || undefined,
        sourceSystem: sourceSystem || undefined,
        category: category || undefined,
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
          message: "Failed to load exercise catalog.",
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
    setCategory(categoryInput.trim());
  }

  function handleFilterSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    applyFilters();
  }

  function addExercise(item: ExerciseCatalogItem) {
    setSelected((prev) => {
      if (prev.some((row) => row.exercise.id === item.id)) return prev;
      return [
        ...prev,
        {
          localId: `${item.id}-${Date.now()}`,
          exercise: item,
          durationMinutes: 10,
        },
      ];
    });
  }

  function removeExercise(localId: string) {
    setSelected((prev) => prev.filter((row) => row.localId !== localId));
  }

  function updateDuration(localId: string, nextValue: string) {
    const durationMinutes = parsePositiveInt(nextValue);
    setSelected((prev) =>
      prev.map((row) =>
        row.localId === localId ? { ...row, durationMinutes } : row,
      ),
    );
  }

  function incrementDuration(localId: string) {
    setSelected((prev) =>
      prev.map((row) =>
        row.localId === localId
          ? { ...row, durationMinutes: row.durationMinutes + 1 }
          : row,
      ),
    );
  }

  function decrementDuration(localId: string) {
    setSelected((prev) =>
      prev.map((row) =>
        row.localId === localId
          ? { ...row, durationMinutes: Math.max(1, row.durationMinutes - 1) }
          : row,
      ),
    );
  }

  const totalDuration = useMemo(
    () => selected.reduce((sum, row) => sum + row.durationMinutes, 0),
    [selected],
  );

  return (
    <DashboardGate>
      <div className="mx-auto w-full max-w-6xl space-y-4">
        <Card>
          <Heading variant="h2">Exercise Catalog</Heading>

          <form onSubmit={handleFilterSubmit} className="grid grid-cols-1 gap-3 md:grid-cols-4">
            <div className="flex flex-col gap-1 md:col-span-2">
              <label htmlFor="exercise-search" className="text-xs font-medium text-textPrimary">
                Search
              </label>
              <Input
                id="exercise-search"
                value={searchInput}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchInput(e.target.value)}
                placeholder="Search exercise name"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="exercise-source" className="text-xs font-medium text-textPrimary">
                Source System
              </label>
              <Select
                id="exercise-source"
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
              <label htmlFor="exercise-category" className="text-xs font-medium text-textPrimary">
                Category
              </label>
              <Select
                id="exercise-category"
                value={categoryInput}
                onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                  setCategoryInput(e.target.value)
                }
              >
                {CATEGORY_OPTIONS.map((option) => (
                  <option key={option || "all"} value={option}>
                    {option || "All categories"}
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
                  setCategoryInput("");
                  setPage(1);
                  setSearch("");
                  setSourceSystem("");
                  setCategory("");
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
            emptyMessage="No exercise catalog items found."
          />

          {!loading && !error && items.length > 0 ? (
            <>
              <Table>
                <TableHead>
                  <TableRow variant="head">
                    <Th>Name</Th>
                    <Th>Category</Th>
                    <Th>Source</Th>
                    <Th>Description</Th>
                    <Th className="text-right">Action</Th>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {items.map((row) => (
                    <TableRow key={row.id}>
                      <Td>{toTitleCaseInput(row.name.trim()) || "—"}</Td>
                      <Td>
                        {(() => {
                          const cat = (row.categoryName ?? row.category)?.trim() ?? "";
                          return cat !== "" ? formatEnumeratedLabel(cat) : "—";
                        })()}
                      </Td>
                      <Td>{row.sourceSystem ?? "-"}</Td>
                      <Td className="max-w-[320px] truncate">
                        {row.descriptionText ?? row.description ?? "-"}
                      </Td>
                      <Td className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            type="button"
                            variant="secondary"
                            onClick={() =>
                              router.push(`/catalog/exercise/${encodeURIComponent(row.id)}`)
                            }
                          >
                            View
                          </Button>
                          <Button
                            type="button"
                            variant="primary"
                            disabled={selected.some(
                              (selectedRow) => selectedRow.exercise.id === row.id,
                            )}
                            onClick={() => addExercise(row)}
                          >
                            {selected.some(
                              (selectedRow) => selectedRow.exercise.id === row.id,
                            )
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

          <Card padding="compact" className="space-y-3 bg-bg">
            <Heading variant="h3">Selected Exercises (Local)</Heading>
            {selected.length === 0 ? (
              <p className="text-sm text-textSecondary">No exercises selected yet.</p>
            ) : (
              <ul className="space-y-2">
                {selected.map((row) => (
                  <li key={row.localId}>
                    <Card padding="compact">
                      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                        <div>
                          <p className="text-sm font-medium text-textPrimary">
                            {toTitleCaseInput(row.exercise.name.trim()) || "—"}
                          </p>
                          <p className="text-xs text-textSecondary">
                            Category:{" "}
                            {(() => {
                              const cat =
                                (row.exercise.categoryName ?? row.exercise.category)?.trim() ??
                                "";
                              return cat !== "" ? formatEnumeratedLabel(cat) : "—";
                            })()}
                          </p>
                        </div>
                        <div className="flex items-end gap-2">
                          <div className="flex flex-col gap-1">
                            <label
                              htmlFor={`duration-${row.localId}`}
                              className="text-xs font-medium text-textPrimary"
                            >
                              Duration (min)
                            </label>
                            <div className="flex items-center gap-2">
                              <Button
                                type="button"
                                variant="secondary"
                                className="px-3 py-1"
                                onClick={() => decrementDuration(row.localId)}
                              >
                                -
                              </Button>
                              <Input
                                id={`duration-${row.localId}`}
                                type="number"
                                min="1"
                                step="1"
                                value={String(row.durationMinutes)}
                                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                                  updateDuration(row.localId, e.target.value)
                                }
                              />
                              <Button
                                type="button"
                                variant="secondary"
                                className="px-3 py-1"
                                onClick={() => incrementDuration(row.localId)}
                              >
                                +
                              </Button>
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="danger"
                            onClick={() => removeExercise(row.localId)}
                          >
                            Remove
                          </Button>
                        </div>
                      </div>
                    </Card>
                  </li>
                ))}
              </ul>
            )}
            <Card padding="compact">
              <p className="text-sm text-textPrimary">
                Total selected duration: <strong>{totalDuration}</strong> minutes
              </p>
            </Card>
          </Card>
        </Card>
      </div>
    </DashboardGate>
  );
}
