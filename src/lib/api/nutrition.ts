import { paths } from "@/config/endpoints";
import { apiRequest } from "@/lib/apiClient";
import type { NormalizedFood } from "@/types/nutrition.types";

type UsdaFoodSearchItem = Record<string, unknown>;

function toNumberOrZero(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function extractMacroValue(
  nutrients: unknown,
  matcher: (name: string) => boolean,
): number {
  if (!Array.isArray(nutrients)) return 0;
  for (const row of nutrients) {
    if (!row || typeof row !== "object") continue;
    const o = row as Record<string, unknown>;
    const name =
      typeof o.nutrientName === "string"
        ? o.nutrientName.toLowerCase()
        : typeof o.name === "string"
          ? o.name.toLowerCase()
          : "";
    if (!name || !matcher(name)) continue;
    const value = toNumberOrZero(o.value);
    if (value > 0) return value;
  }
  return 0;
}

function mapUsdaItemToNormalizedFood(input: unknown): NormalizedFood | null {
  if (!input || typeof input !== "object") return null;
  const o = input as Record<string, unknown>;

  const description =
    typeof o.description === "string" ? o.description.trim() : "";
  if (description === "") return null;

  const rawFdcId = o.fdcId;
  const sourceFoodId =
    typeof rawFdcId === "number" || typeof rawFdcId === "string"
      ? String(rawFdcId)
      : null;
  if (!sourceFoodId) return null;

  const brandOwner =
    typeof o.brandOwner === "string" && o.brandOwner.trim() !== ""
      ? o.brandOwner.trim()
      : undefined;
  const dataType =
    typeof o.dataType === "string" && o.dataType.trim() !== ""
      ? o.dataType.trim()
      : undefined;

  const servingAmount = toNumberOrZero(o.servingSize) || 100;
  const servingUnit =
    typeof o.servingSizeUnit === "string" && o.servingSizeUnit.trim() !== ""
      ? o.servingSizeUnit.trim()
      : "g";

  const nutrients = o.foodNutrients;
  const calories = extractMacroValue(
    nutrients,
    (name) => name.includes("energy"),
  );
  const protein = extractMacroValue(
    nutrients,
    (name) => name.includes("protein"),
  );
  const carbs = extractMacroValue(
    nutrients,
    (name) =>
      name.includes("carbohydrate") || name.includes("carb"),
  );
  const fat = extractMacroValue(
    nutrients,
    (name) =>
      name.includes("lipid") || name.includes("fat"),
  );

  return {
    source: "USDA",
    sourceFoodId,
    name: description,
    baseServing: {
      amount: servingAmount,
      unit: servingUnit,
    },
    macrosPerBaseServing: {
      calories,
      protein,
      carbs,
      fat,
    },
    metadata: {
      brandOwner,
      dataType,
    },
  };
}

function extractFoodArray(payload: unknown): unknown[] {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== "object") return [];

  const o = payload as Record<string, unknown>;
  if (Array.isArray(o.foods)) return o.foods;
  if (Array.isArray(o.data)) return o.data;
  if (o.data && typeof o.data === "object") {
    const dataObj = o.data as Record<string, unknown>;
    if (Array.isArray(dataObj.foods)) return dataObj.foods;
  }
  return [];
}

export async function searchFoods(query: string): Promise<NormalizedFood[]> {
  const data = await apiRequest(paths.nutrition.usdaSearch(query), {
    method: "GET",
  });

  return extractFoodArray(data).reduce<NormalizedFood[]>((acc, item) => {
    const mapped = mapUsdaItemToNormalizedFood(item);
    if (mapped) acc.push(mapped);
    return acc;
  }, []);
}
