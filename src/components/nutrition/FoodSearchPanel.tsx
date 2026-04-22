"use client";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { searchFoods } from "@/lib/api/nutrition";
import type { NormalizedFood, NutritionMinerals } from "@/types/nutrition.types";
import { useEffect, useState, type ChangeEvent } from "react";

const MIN_QUERY_LENGTH = 2;
const DEBOUNCE_MS = 400;

type DraftFoodItem = {
  id: string;
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

function scaledNutrition(food: NormalizedFood, servingAmount: number): ScaledNutrition {
  const baseAmount = food.baseServing.amount > 0 ? food.baseServing.amount : 1;
  const servingCount = servingAmount / baseAmount;
  const factor = servingCount;
  const m = food.macrosPerBaseServing;

  const scaledFiber =
    m.fiber != null ? round1(m.fiber * factor) : undefined;
  const minerals = food.mineralsPerBaseServing;
  const scaledMinerals: NutritionMinerals | undefined = minerals
    ? {
        iron: minerals.iron != null ? round1(minerals.iron * factor) : undefined,
        calcium:
          minerals.calcium != null ? round1(minerals.calcium * factor) : undefined,
        sodium: minerals.sodium != null ? round1(minerals.sodium * factor) : undefined,
        potassium:
          minerals.potassium != null ? round1(minerals.potassium * factor) : undefined,
        magnesium:
          minerals.magnesium != null
            ? round1(minerals.magnesium * factor)
            : undefined,
      }
    : undefined;

  return {
    servingCount: round1(servingCount),
    servingAmount: round1(servingAmount),
    servingUnit: food.baseServing.unit,
    calories: round1(m.calories * factor),
    protein: round1(m.protein * factor),
    carbs: round1(m.carbs * factor),
    fat: round1(m.fat * factor),
    fiber: scaledFiber,
    minerals: scaledMinerals,
  };
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

export function FoodSearchPanel() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<NormalizedFood[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedFood, setSelectedFood] = useState<NormalizedFood | null>(null);
  const [servingCount, setServingCount] = useState<number>(1);
  const [draftItems, setDraftItems] = useState<DraftFoodItem[]>([]);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < MIN_QUERY_LENGTH) {
      setLoading(false);
      setError(null);
      setSearchResults([]);
      setHasSearched(false);
      return;
    }

    let cancelled = false;
    const timer = setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const foods = await searchFoods(trimmed);
        if (cancelled) return;
        setSearchResults(foods);
        setHasSearched(true);
      } catch (e) {
        if (cancelled) return;
        const message =
          typeof e === "object" &&
          e !== null &&
          "message" in e &&
          typeof (e as { message: unknown }).message === "string"
            ? (e as { message: string }).message
            : "Unable to search foods right now.";
        setError(message);
        setSearchResults([]);
        setHasSearched(true);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }, DEBOUNCE_MS);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query]);

  function handleSelectFood(food: NormalizedFood) {
    setSelectedFood(food);
    setServingCount(1);
  }

  function sanitizeServingCount(value: number): number {
    if (!Number.isFinite(value)) return 1;
    if (value < 0.1) return 0.1;
    return round1(value);
  }

  function selectedServingAmount(food: NormalizedFood): number {
    return round1(food.baseServing.amount * servingCount);
  }

  function handleAddToDraft() {
    if (!selectedFood) return;
    const normalizedCount = sanitizeServingCount(servingCount);
    setDraftItems((prev) => [
      ...prev,
      {
        id: `${selectedFood.source}-${selectedFood.sourceFoodId}-${Date.now()}`,
        food: selectedFood,
        servingCount: normalizedCount,
      },
    ]);
  }

  function clearSelectedFood() {
    setSelectedFood(null);
    setServingCount(1);
  }

  function removeDraftItem(id: string) {
    setDraftItems((prev) => prev.filter((item) => item.id !== id));
  }

  const draftTotals = draftItems.reduce(
    (acc: DraftTotals, item) => {
      const nutrition = scaledNutrition(
        item.food,
        item.food.baseServing.amount * item.servingCount,
      );
      return {
        calories: round1(acc.calories + nutrition.calories),
        protein: round1(acc.protein + nutrition.protein),
        carbs: round1(acc.carbs + nutrition.carbs),
        fat: round1(acc.fat + nutrition.fat),
        fiber: addOptionalNumber(acc.fiber, nutrition.fiber),
        minerals: {
          iron: addOptionalNumber(acc.minerals?.iron, nutrition.minerals?.iron),
          calcium: addOptionalNumber(
            acc.minerals?.calcium,
            nutrition.minerals?.calcium,
          ),
          sodium: addOptionalNumber(
            acc.minerals?.sodium,
            nutrition.minerals?.sodium,
          ),
          potassium: addOptionalNumber(
            acc.minerals?.potassium,
            nutrition.minerals?.potassium,
          ),
          magnesium: addOptionalNumber(
            acc.minerals?.magnesium,
            nutrition.minerals?.magnesium,
          ),
        },
      };
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0 },
  );

  const selectedNutrition =
    selectedFood && servingCount > 0
      ? scaledNutrition(selectedFood, selectedServingAmount(selectedFood))
      : null;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2">
        <label htmlFor="food-search" className="text-sm font-medium text-textPrimary">
          Search foods
        </label>
        <Input
          id="food-search"
          name="food-search"
          type="text"
          placeholder="Type at least 2 characters (e.g. apple)"
          value={query}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
        />
      </div>

      {loading ? <p className="text-sm text-textSecondary">Searching…</p> : null}
      {!loading && error ? <p className="text-sm text-danger">{error}</p> : null}
      {!loading && !error && hasSearched && searchResults.length === 0 ? (
        <p className="text-sm text-textSecondary">No foods found for "{query.trim()}".</p>
      ) : null}
      {!loading && !error && !hasSearched && query.trim().length < MIN_QUERY_LENGTH ? (
        <p className="text-sm text-textSecondary">
          Idle: type at least {MIN_QUERY_LENGTH} characters to search.
        </p>
      ) : null}

      {!loading && !error && searchResults.length > 0 ? (
        <ul className="space-y-2">
          {searchResults.map((food) => (
            <li
              key={`${food.source}-${food.sourceFoodId}`}
              className="rounded-lg border border-border bg-bg p-3"
            >
              <p className="text-sm font-medium text-textPrimary">{food.name}</p>
              <p className="mt-1 text-xs text-textSecondary">
                Source: {food.source} | ID: {food.sourceFoodId}
              </p>
              {food.metadata?.brandOwner ? (
                <p className="mt-1 text-xs text-textSecondary">
                  Brand: {food.metadata.brandOwner}
                </p>
              ) : null}
              {food.metadata?.dataType ? (
                <p className="mt-1 text-xs text-textSecondary">
                  Type: {food.metadata.dataType}
                </p>
              ) : null}
              <p className="mt-1 text-xs text-textSecondary">
                Base serving: {food.baseServing.amount} {food.baseServing.unit}
              </p>
              <p className="mt-1 text-xs text-textSecondary">
                Base macros: {food.macrosPerBaseServing.calories} kcal, P{" "}
                {food.macrosPerBaseServing.protein}g, C {food.macrosPerBaseServing.carbs}g,
                F {food.macrosPerBaseServing.fat}g
              </p>
              {food.macrosPerBaseServing.fiber != null ? (
                <p className="mt-1 text-xs text-textSecondary">
                  Fiber: {food.macrosPerBaseServing.fiber}g
                </p>
              ) : null}
              {hasAnyMineral(food.mineralsPerBaseServing) ? (
                <div className="mt-1 text-xs text-textSecondary">
                  <p>Minerals:</p>
                  {food.mineralsPerBaseServing?.iron != null ? (
                    <p>Iron: {food.mineralsPerBaseServing.iron}mg</p>
                  ) : null}
                  {food.mineralsPerBaseServing?.calcium != null ? (
                    <p>Calcium: {food.mineralsPerBaseServing.calcium}mg</p>
                  ) : null}
                  {food.mineralsPerBaseServing?.sodium != null ? (
                    <p>Sodium: {food.mineralsPerBaseServing.sodium}mg</p>
                  ) : null}
                  {food.mineralsPerBaseServing?.potassium != null ? (
                    <p>Potassium: {food.mineralsPerBaseServing.potassium}mg</p>
                  ) : null}
                  {food.mineralsPerBaseServing?.magnesium != null ? (
                    <p>Magnesium: {food.mineralsPerBaseServing.magnesium}mg</p>
                  ) : null}
                </div>
              ) : null}
              <div className="mt-2">
                <Button
                  type="button"
                  variant="secondary"
                  className="px-3 py-1 text-xs"
                  onClick={() => handleSelectFood(food)}
                >
                  Select
                </Button>
              </div>
            </li>
          ))}
        </ul>
      ) : null}

      {selectedFood ? (
        <div className="space-y-2 rounded-lg border border-border bg-card p-3">
          <p className="text-sm font-semibold text-textPrimary">
            Selected: {selectedFood.name}
          </p>
          <p className="text-xs text-textSecondary">
            Base serving: {selectedFood.baseServing.amount} {selectedFood.baseServing.unit}
          </p>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
            <div className="flex-1">
              <label
                htmlFor="serving-count"
                className="text-xs font-medium text-textPrimary"
              >
                Serving count (x base serving)
              </label>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  className="px-3 py-1"
                  onClick={() => setServingCount((prev) => sanitizeServingCount(prev - 0.5))}
                >
                  -
                </Button>
                <Input
                  id="serving-count"
                  name="serving-count"
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={String(servingCount)}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    setServingCount(sanitizeServingCount(Number(e.target.value)))
                  }
                />
                <Button
                  type="button"
                  variant="secondary"
                  className="px-3 py-1"
                  onClick={() => setServingCount((prev) => sanitizeServingCount(prev + 0.5))}
                >
                  +
                </Button>
              </div>
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="primary" onClick={handleAddToDraft}>
                Add food
              </Button>
              <Button type="button" variant="danger" onClick={clearSelectedFood}>
                Remove selection
              </Button>
            </div>
          </div>
          {selectedNutrition ? (
            <div className="text-xs text-textSecondary">
              <p>
                Selected amount: {selectedNutrition.servingAmount} {selectedNutrition.servingUnit} (
                {selectedNutrition.servingCount}x)
              </p>
              <p>
                Adjusted macros: {selectedNutrition.calories} kcal, P{" "}
                {selectedNutrition.protein}g, C {selectedNutrition.carbs}g, F{" "}
                {selectedNutrition.fat}g
              </p>
              {selectedNutrition.fiber != null ? (
                <p>Fiber: {selectedNutrition.fiber}g</p>
              ) : null}
              {hasAnyMineral(selectedNutrition.minerals) ? (
                <div>
                  <p>Minerals:</p>
                  {selectedNutrition.minerals?.iron != null ? (
                    <p>Iron: {selectedNutrition.minerals.iron}mg</p>
                  ) : null}
                  {selectedNutrition.minerals?.calcium != null ? (
                    <p>Calcium: {selectedNutrition.minerals.calcium}mg</p>
                  ) : null}
                  {selectedNutrition.minerals?.sodium != null ? (
                    <p>Sodium: {selectedNutrition.minerals.sodium}mg</p>
                  ) : null}
                  {selectedNutrition.minerals?.potassium != null ? (
                    <p>Potassium: {selectedNutrition.minerals.potassium}mg</p>
                  ) : null}
                  {selectedNutrition.minerals?.magnesium != null ? (
                    <p>Magnesium: {selectedNutrition.minerals.magnesium}mg</p>
                  ) : null}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}

      {draftItems.length > 0 ? (
        <div className="space-y-2 rounded-lg border border-border bg-card p-3">
          <p className="text-sm font-semibold text-textPrimary">Draft items</p>
          <ul className="space-y-2">
            {draftItems.map((item) => {
              const nutrition = scaledNutrition(
                item.food,
                item.food.baseServing.amount * item.servingCount,
              );
              return (
                <li
                  key={item.id}
                  className="space-y-1 rounded-lg border border-border bg-bg p-3 text-xs text-textSecondary"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-textPrimary">{item.food.name}</p>
                      <p>
                        Source: {item.food.source} | ID: {item.food.sourceFoodId}
                      </p>
                      <p>
                        Quantity: {nutrition.servingCount}x ({nutrition.servingAmount}{" "}
                        {nutrition.servingUnit})
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="danger"
                      className="px-3 py-1 text-xs"
                      onClick={() => removeDraftItem(item.id)}
                    >
                      Remove
                    </Button>
                  </div>
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
          <div className="rounded-lg border border-border bg-card p-3 text-xs font-medium text-textPrimary">
            <p className="mb-1 text-sm">Totals</p>
            Totals: {draftTotals.calories} kcal, P {draftTotals.protein}g, C{" "}
            {draftTotals.carbs}g, F {draftTotals.fat}g
            {draftTotals.fiber != null ? `, Fiber ${draftTotals.fiber}g` : ""}
            {hasAnyMineral(draftTotals.minerals) ? (
              <div className="mt-1 font-normal text-textSecondary">
                {draftTotals.minerals?.iron != null ? (
                  <p>Iron: {draftTotals.minerals.iron}mg</p>
                ) : null}
                {draftTotals.minerals?.calcium != null ? (
                  <p>Calcium: {draftTotals.minerals.calcium}mg</p>
                ) : null}
                {draftTotals.minerals?.sodium != null ? (
                  <p>Sodium: {draftTotals.minerals.sodium}mg</p>
                ) : null}
                {draftTotals.minerals?.potassium != null ? (
                  <p>Potassium: {draftTotals.minerals.potassium}mg</p>
                ) : null}
                {draftTotals.minerals?.magnesium != null ? (
                  <p>Magnesium: {draftTotals.minerals.magnesium}mg</p>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      {query.trim().length > 0 && query.trim().length < MIN_QUERY_LENGTH ? (
        <p className="text-xs text-textSecondary">
          Enter at least {MIN_QUERY_LENGTH} characters to search.
        </p>
      ) : null}
    </div>
  );
}
