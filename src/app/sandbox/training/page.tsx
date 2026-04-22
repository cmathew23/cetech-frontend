"use client";

/** TEMP SANDBOX / NOT FINAL UI: coach-side exercise retrieval + local selection. */

import { DashboardGate } from "@/components/layout/DashboardGate";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Heading } from "@/components/ui/Heading";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Stack } from "@/components/ui/Stack";
import {
  listExerciseCatalog,
  type ExerciseCatalogItem,
} from "@/lib/api/exerciseCatalog";
import { useEffect, useMemo, useState, type ChangeEvent } from "react";

const CATEGORY_OPTIONS = [
  "Abs",
  "Arms",
  "Back",
  "Cardio",
  "Chest",
  "Legs",
  "Shoulders",
] as const;

type SelectedExercise = {
  localId: string;
  exercise: ExerciseCatalogItem;
  durationMinutes: number;
};

export default function TrainingSandboxPage() {
  const [category, setCategory] = useState<string>("");
  const [search, setSearch] = useState<string>("");
  const [results, setResults] = useState<ExerciseCatalogItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasFetched, setHasFetched] = useState(false);
  const [selected, setSelected] = useState<SelectedExercise[]>([]);

  useEffect(() => {
    void fetchExercises();
  }, []);

  async function fetchExercises() {
    setLoading(true);
    setError(null);
    try {
      const data = await listExerciseCatalog({
        category: category || undefined,
        search: search || undefined,
        limit: 50,
      });
      setResults(data);
      setHasFetched(true);
    } catch (e) {
      const message =
        typeof e === "object" &&
        e !== null &&
        "message" in e &&
        typeof (e as { message: unknown }).message === "string"
          ? (e as { message: string }).message
          : "Unable to load exercise catalog.";
      setError(message);
      setResults([]);
      setHasFetched(true);
    } finally {
      setLoading(false);
    }
  }

  function addExercise(item: ExerciseCatalogItem) {
    setSelected((prev) => {
      if (prev.some((x) => x.exercise.id === item.id)) return prev;
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
    setSelected((prev) => prev.filter((x) => x.localId !== localId));
  }

  function updateDuration(localId: string, nextValue: string) {
    const n = Number(nextValue);
    const normalized = Number.isFinite(n) && n > 0 ? Math.round(n) : 1;
    setSelected((prev) =>
      prev.map((x) =>
        x.localId === localId ? { ...x, durationMinutes: normalized } : x,
      ),
    );
  }

  const selectedDurationTotal = useMemo(
    () => selected.reduce((sum, x) => sum + x.durationMinutes, 0),
    [selected],
  );

  return (
    <DashboardGate>
      <div className="mx-auto w-full max-w-5xl px-4 py-8">
        <Card>
          <Stack spacing="md">
            <Heading variant="h2">Training Sandbox</Heading>
            <p className="text-sm text-textSecondary">
              S&C Training section (TEMP): fetch exercise catalog from backend and
              manage local selected exercises only.
            </p>

            <section className="space-y-3 rounded-lg border border-border bg-bg p-4">
              <Heading variant="h3">S&C Training</Heading>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <div className="flex flex-col gap-1">
                  <label
                    htmlFor="exercise-category"
                    className="text-xs font-medium text-textPrimary"
                  >
                    Category
                  </label>
                  <Select
                    id="exercise-category"
                    value={category}
                    onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                      setCategory(e.target.value)
                    }
                  >
                    <option value="">All categories</option>
                    {CATEGORY_OPTIONS.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="md:col-span-2 flex flex-col gap-1">
                  <label
                    htmlFor="exercise-search"
                    className="text-xs font-medium text-textPrimary"
                  >
                    Search
                  </label>
                  <Input
                    id="exercise-search"
                    type="text"
                    value={search}
                    placeholder="Search exercises"
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                      setSearch(e.target.value)
                    }
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button type="button" variant="primary" onClick={() => void fetchExercises()}>
                  Fetch exercises
                </Button>
              </div>

              {loading ? (
                <p className="text-sm text-textSecondary">Loading exercises...</p>
              ) : null}
              {!loading && error ? (
                <p className="text-sm text-danger">{error}</p>
              ) : null}
              {!loading && !error && hasFetched && results.length === 0 ? (
                <p className="text-sm text-textSecondary">No exercises found.</p>
              ) : null}

              {!loading && !error && results.length > 0 ? (
                <ul className="space-y-2">
                  {results.map((item) => {
                    const alreadyAdded = selected.some((x) => x.exercise.id === item.id);
                    return (
                      <li
                        key={item.id}
                        className="rounded-lg border border-border bg-card p-3"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-medium text-textPrimary">{item.name}</p>
                            {item.category ? (
                              <p className="text-xs text-textSecondary">
                                Category: {item.category}
                              </p>
                            ) : null}
                            {item.description ? (
                              <p className="mt-1 text-xs text-textSecondary">
                                {item.description}
                              </p>
                            ) : null}
                          </div>
                          <Button
                            type="button"
                            variant="secondary"
                            disabled={alreadyAdded}
                            onClick={() => addExercise(item)}
                          >
                            {alreadyAdded ? "Added" : "Add"}
                          </Button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              ) : null}
            </section>

            <section className="space-y-3 rounded-lg border border-border bg-bg p-4">
              <Heading variant="h3">Selected Exercises (Local Only)</Heading>
              {selected.length === 0 ? (
                <p className="text-sm text-textSecondary">
                  No exercises selected yet.
                </p>
              ) : (
                <ul className="space-y-2">
                  {selected.map((item) => (
                    <li
                      key={item.localId}
                      className="rounded-lg border border-border bg-card p-3"
                    >
                      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                        <div>
                          <p className="text-sm font-medium text-textPrimary">
                            {item.exercise.name}
                          </p>
                          {item.exercise.category ? (
                            <p className="text-xs text-textSecondary">
                              Category: {item.exercise.category}
                            </p>
                          ) : null}
                        </div>
                        <div className="flex items-end gap-2">
                          <div className="flex flex-col gap-1">
                            <label
                              htmlFor={`duration-${item.localId}`}
                              className="text-xs font-medium text-textPrimary"
                            >
                              Duration (min)
                            </label>
                            <Input
                              id={`duration-${item.localId}`}
                              type="number"
                              min="1"
                              step="1"
                              value={String(item.durationMinutes)}
                              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                                updateDuration(item.localId, e.target.value)
                              }
                            />
                          </div>
                          <Button
                            type="button"
                            variant="danger"
                            onClick={() => removeExercise(item.localId)}
                          >
                            Remove
                          </Button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              <div className="rounded-lg border border-border bg-card p-3 text-sm text-textPrimary">
                Total selected duration: <strong>{selectedDurationTotal}</strong> minutes
              </div>
            </section>
          </Stack>
        </Card>
      </div>
    </DashboardGate>
  );
}
