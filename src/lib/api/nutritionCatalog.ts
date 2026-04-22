import { paths } from "@/config/endpoints";
import { apiRequest } from "@/lib/apiClient";
import type { NormalizedFood, NutritionMinerals } from "@/types/nutrition.types";
import type {
  CatalogPageMeta,
  NutritionCatalogDetail,
  NutritionCatalogItem,
  NutritionCatalogListResult,
  NutritionCatalogQuery,
} from "@/types/catalog.types";

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;

function buildNutritionCatalogPath(query: NutritionCatalogQuery): string {
  const params = new URLSearchParams();
  if (query.search && query.search.trim() !== "") {
    params.set("search", query.search.trim());
  }
  if (query.sourceSystem && query.sourceSystem.trim() !== "") {
    params.set("sourceSystem", query.sourceSystem.trim());
  }
  if (query.qualityStatus && query.qualityStatus.trim() !== "") {
    params.set("qualityStatus", query.qualityStatus.trim());
  }
  if (query.qualityFlag && query.qualityFlag.trim() !== "") {
    params.set("qualityFlag", query.qualityFlag.trim());
  }
  if (typeof query.page === "number" && Number.isFinite(query.page)) {
    params.set("page", String(query.page));
  }
  if (typeof query.limit === "number" && Number.isFinite(query.limit)) {
    params.set("limit", String(query.limit));
  }
  const qs = params.toString();
  return qs === "" ? paths.nutritionCatalog.root : `${paths.nutritionCatalog.root}?${qs}`;
}

function toNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const n = Number(value);
    if (Number.isFinite(n)) return n;
  }
  return null;
}

function toStringValue(value: unknown): string | undefined {
  if (typeof value === "string" && value.trim() !== "") return value.trim();
  if (typeof value === "number") return String(value);
  return undefined;
}

function toStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map((entry) => toStringValue(entry))
      .filter((entry): entry is string => Boolean(entry));
  }
  const single = toStringValue(value);
  return single ? [single] : [];
}

function unwrapObject(payload: unknown): Record<string, unknown> | null {
  if (!payload || typeof payload !== "object") return null;
  const root = payload as Record<string, unknown>;
  if (root.data && typeof root.data === "object" && !Array.isArray(root.data)) {
    return root.data as Record<string, unknown>;
  }
  if (root.item && typeof root.item === "object" && !Array.isArray(root.item)) {
    return root.item as Record<string, unknown>;
  }
  if (root.record && typeof root.record === "object" && !Array.isArray(root.record)) {
    return root.record as Record<string, unknown>;
  }
  return root;
}

function normalizeNutritionItem(input: unknown): NutritionCatalogItem | null {
  const o = unwrapObject(input);
  if (!o) return null;

  const id = toStringValue(o.id ?? o.nutritionCatalogId ?? o._id);
  const name = toStringValue(o.name ?? o.foodName ?? o.description ?? o.title);
  if (!id || !name) return null;

  const sourceSystem = toStringValue(
    o.sourceSystem ?? o.source ?? o.provider ?? o.sourceName,
  );
  const sourceFoodCode = toStringValue(
    o.sourceFoodCode ?? o.sourceCode ?? o.externalId ?? o.sourceId,
  );
  const qualityStatus = toStringValue(o.qualityStatus);
  const qualityFlags = toStringArray(o.qualityFlags ?? o.qualityFlag);

  let calories = toNumber(o.caloriesKcal ?? o.calories);
  if (calories == null && o.nutrition && typeof o.nutrition === "object") {
    const nutrition = o.nutrition as Record<string, unknown>;
    calories = toNumber(nutrition.caloriesKcal ?? nutrition.calories);
  }

  return {
    id,
    name,
    sourceSystem,
    sourceFoodCode,
    qualityStatus,
    qualityFlags,
    calories: calories ?? undefined,
  };
}

function extractArray(payload: unknown): unknown[] {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== "object") return [];

  const o = payload as Record<string, unknown>;
  if (Array.isArray(o.data)) return o.data;
  if (Array.isArray(o.items)) return o.items;
  if (Array.isArray(o.rows)) return o.rows;
  if (Array.isArray(o.records)) return o.records;
  if (Array.isArray(o.nutritionCatalog)) return o.nutritionCatalog;
  if (Array.isArray(o.results)) return o.results;

  if (o.data && typeof o.data === "object") {
    const d = o.data as Record<string, unknown>;
    if (Array.isArray(d.data)) return d.data;
    if (Array.isArray(d.items)) return d.items;
    if (Array.isArray(d.rows)) return d.rows;
    if (Array.isArray(d.records)) return d.records;
    if (Array.isArray(d.nutritionCatalog)) return d.nutritionCatalog;
    if (Array.isArray(d.results)) return d.results;
  }

  return [];
}

function parseMeta(
  payload: unknown,
  fallback: { page?: number; limit?: number } = {},
): CatalogPageMeta {
  const fallbackPage = fallback.page && fallback.page > 0 ? fallback.page : DEFAULT_PAGE;
  const fallbackLimit =
    fallback.limit && fallback.limit > 0 ? fallback.limit : DEFAULT_LIMIT;

  if (!payload || typeof payload !== "object") {
    return { page: fallbackPage, limit: fallbackLimit, total: null, totalPages: null };
  }

  const o = payload as Record<string, unknown>;
  const dataObj =
    o.data && typeof o.data === "object" ? (o.data as Record<string, unknown>) : null;
  const metaObj =
    o.meta && typeof o.meta === "object" ? (o.meta as Record<string, unknown>) : null;
  const paginationObj =
    o.pagination && typeof o.pagination === "object"
      ? (o.pagination as Record<string, unknown>)
      : null;
  const dataMetaObj =
    dataObj?.meta && typeof dataObj.meta === "object"
      ? (dataObj.meta as Record<string, unknown>)
      : null;
  const dataPaginationObj =
    dataObj?.pagination && typeof dataObj.pagination === "object"
      ? (dataObj.pagination as Record<string, unknown>)
      : null;

  const page =
    toNumber(o.page) ??
    toNumber(o.currentPage) ??
    toNumber(dataObj?.page) ??
    toNumber(metaObj?.page) ??
    toNumber(dataMetaObj?.page) ??
    toNumber(paginationObj?.page) ??
    toNumber(dataPaginationObj?.page) ??
    fallbackPage;

  const limit =
    toNumber(o.limit) ??
    toNumber(o.pageSize) ??
    toNumber(dataObj?.limit) ??
    toNumber(dataObj?.pageSize) ??
    toNumber(metaObj?.limit) ??
    toNumber(metaObj?.pageSize) ??
    toNumber(dataMetaObj?.limit) ??
    toNumber(dataMetaObj?.pageSize) ??
    toNumber(paginationObj?.limit) ??
    toNumber(dataPaginationObj?.limit) ??
    fallbackLimit;

  const total =
    toNumber(o.total) ??
    toNumber(o.totalCount) ??
    toNumber(o.totalItems) ??
    toNumber(dataObj?.total) ??
    toNumber(dataObj?.totalCount) ??
    toNumber(dataObj?.totalItems) ??
    toNumber(metaObj?.total) ??
    toNumber(metaObj?.totalCount) ??
    toNumber(metaObj?.totalItems) ??
    toNumber(dataMetaObj?.total) ??
    toNumber(dataMetaObj?.totalCount) ??
    toNumber(dataMetaObj?.totalItems) ??
    toNumber(paginationObj?.total) ??
    toNumber(dataPaginationObj?.total);

  const totalPages =
    toNumber(o.totalPages) ??
    toNumber(o.pages) ??
    toNumber(dataObj?.totalPages) ??
    toNumber(dataObj?.pages) ??
    toNumber(metaObj?.totalPages) ??
    toNumber(metaObj?.pages) ??
    toNumber(dataMetaObj?.totalPages) ??
    toNumber(dataMetaObj?.pages) ??
    toNumber(paginationObj?.totalPages) ??
    toNumber(dataPaginationObj?.totalPages);

  return {
    page: page > 0 ? page : fallbackPage,
    limit: limit > 0 ? limit : fallbackLimit,
    total,
    totalPages,
  };
}

export async function listNutritionCatalogPage(
  query: NutritionCatalogQuery = {},
): Promise<NutritionCatalogListResult> {
  const data = await apiRequest(buildNutritionCatalogPath(query), { method: "GET" });
  const items = extractArray(data).reduce<NutritionCatalogItem[]>((acc, row) => {
    const mapped = normalizeNutritionItem(row);
    if (mapped) acc.push(mapped);
    return acc;
  }, []);

  return {
    items,
    meta: parseMeta(data, { page: query.page, limit: query.limit }),
  };
}

export async function getNutritionCatalogItemById(
  id: string,
): Promise<NutritionCatalogDetail | null> {
  const data = await apiRequest(paths.nutritionCatalog.byId(id), { method: "GET" });
  const payload = unwrapObject(data);
  if (!payload) return null;
  const normalized = normalizeNutritionItem(payload);
  if (!normalized) return null;
  return { ...normalized, raw: payload };
}

export async function getNutritionCatalogItemBySource(
  sourceSystem: string,
  sourceFoodCode: string,
): Promise<NutritionCatalogDetail | null> {
  const data = await apiRequest(
    paths.nutritionCatalog.bySource(sourceSystem, sourceFoodCode),
    { method: "GET" },
  );
  const payload = unwrapObject(data);
  if (!payload) return null;
  const normalized = normalizeNutritionItem(payload);
  if (!normalized) return null;
  return { ...normalized, raw: payload };
}

function normalizeKey(key: string): string {
  return key.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function collectCandidateObjects(root: Record<string, unknown>): Record<string, unknown>[] {
  const candidates: Record<string, unknown>[] = [root];

  const directKeys = [
    "nutrition",
    "nutritionPer100g",
    "nutrition_per_100g",
    "nutritionPerServing",
    "nutrition_per_serving",
  ];
  directKeys.forEach((k) => {
    if (isRecord(root[k])) candidates.push(root[k] as Record<string, unknown>);
  });

  if (isRecord(root.traceability)) {
    const traceability = root.traceability as Record<string, unknown>;
    if (isRecord(traceability.rawPayload)) {
      const rawPayload = traceability.rawPayload as Record<string, unknown>;
      candidates.push(rawPayload);
      directKeys.forEach((k) => {
        if (isRecord(rawPayload[k])) candidates.push(rawPayload[k] as Record<string, unknown>);
      });
    }
  }

  return candidates;
}

function deepFindNumericByAlias(
  obj: Record<string, unknown>,
  aliases: string[],
  maxDepth = 4,
): number | undefined {
  const aliasSet = new Set(aliases.map(normalizeKey));
  const queue: Array<{ node: Record<string, unknown>; depth: number }> = [
    { node: obj, depth: 0 },
  ];
  const seen = new Set<Record<string, unknown>>();

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current) continue;
    const { node, depth } = current;
    if (seen.has(node)) continue;
    seen.add(node);

    for (const [key, value] of Object.entries(node)) {
      if (aliasSet.has(normalizeKey(key))) {
        const n = toNumber(value);
        if (n != null) return n;
      }
      if (depth < maxDepth && isRecord(value)) {
        queue.push({ node: value, depth: depth + 1 });
      }
    }
  }

  return undefined;
}

function extractNutrientValue(
  raw: Record<string, unknown>,
  aliases: string[],
): number | undefined {
  const candidates = collectCandidateObjects(raw);
  for (const obj of candidates) {
    const value = deepFindNumericByAlias(obj, aliases);
    if (value != null) return value;
  }
  return undefined;
}

export function mapNutritionDetailToNormalizedFood(
  detail: NutritionCatalogDetail,
): NormalizedFood {
  const servingAmount =
    extractNutrientValue(detail.raw, [
      "servingQuantity",
      "servingSize",
      "baseServingAmount",
      "servingAmount",
    ]) ?? 1;
  const servingUnit =
    toStringValue(detail.raw.servingUnit) ??
    toStringValue(detail.raw.servingSizeUnit) ??
    toStringValue(detail.raw.baseServingUnit) ??
    toStringValue(detail.raw.unit) ??
    "g";

  const minerals: NutritionMinerals = {
    iron: extractNutrientValue(detail.raw, [
      "iron",
      "ironMg",
      "iron_mg",
      "ironPer100g",
      "ironMgPer100g",
      "iron_mg_per_100g",
      "unit_serving_iron_mg",
      "fe",
    ]),
    calcium: extractNutrientValue(detail.raw, [
      "calcium",
      "calciumMg",
      "calcium_mg",
      "calciumPer100g",
      "calciumMgPer100g",
      "calcium_mg_per_100g",
      "unit_serving_calcium_mg",
      "ca",
    ]),
    sodium: extractNutrientValue(detail.raw, [
      "sodium",
      "sodiumMg",
      "sodium_mg",
      "sodiumPer100g",
      "sodiumMgPer100g",
      "sodium_mg_per_100g",
      "unit_serving_sodium_mg",
      "na",
    ]),
    potassium: extractNutrientValue(detail.raw, [
      "potassium",
      "potassiumMg",
      "potassium_mg",
      "potassiumPer100g",
      "potassiumMgPer100g",
      "potassium_mg_per_100g",
      "unit_serving_potassium_mg",
      "k",
    ]),
    magnesium: extractNutrientValue(detail.raw, [
      "magnesium",
      "magnesiumMg",
      "magnesium_mg",
      "magnesiumPer100g",
      "magnesiumMgPer100g",
      "magnesium_mg_per_100g",
      "unit_serving_magnesium_mg",
      "mg",
    ]),
  };

  const hasMinerals =
    minerals.iron != null ||
    minerals.calcium != null ||
    minerals.sodium != null ||
    minerals.potassium != null ||
    minerals.magnesium != null;

  const calories =
    extractNutrientValue(detail.raw, ["caloriesKcal"]) ??
    extractNutrientValue(detail.raw, [
      "calories",
      "energy",
      "energyKcal",
      "energy_kcal",
      "energyKcalPer100g",
      "energy_kcal_per_100g",
      "unit_serving_energy_kcal",
      "energykcalperserving",
      "kcal",
    ]) ??
    0;

  const protein =
    extractNutrientValue(detail.raw, ["proteinG"]) ??
    extractNutrientValue(detail.raw, [
      "protein",
      "protein_g",
      "proteinPer100g",
      "proteinGPer100g",
      "protein_g_per_100g",
      "unit_serving_protein_g",
    ]) ??
    0;

  const carbs =
    extractNutrientValue(detail.raw, ["carbohydrateG"]) ??
    extractNutrientValue(detail.raw, [
      "carbs",
      "carbohydrate",
      "carbohydrate_g",
      "carbohydratePer100g",
      "carbohydrateGPer100g",
      "carbohydrate_g_per_100g",
      "carbohydrates",
      "carbohydratesG",
      "carbohydrates_g",
      "carbohydratesPer100g",
      "carbohydratesGPer100g",
      "carbohydrates_g_per_100g",
      "unit_serving_carbohydrate_g",
      "unit_serving_carbohydrates_g",
      "carb",
    ]) ??
    0;

  const fat =
    extractNutrientValue(detail.raw, ["fatG"]) ??
    extractNutrientValue(detail.raw, [
      "fat",
      "fat_g",
      "fatPer100g",
      "fatGPer100g",
      "fat_g_per_100g",
      "totalFat",
      "totalFatG",
      "total_fat_g",
      "unit_serving_fat_g",
      "lipids",
    ]) ??
    0;

  const fiber =
    extractNutrientValue(detail.raw, ["fiberG"]) ??
    extractNutrientValue(detail.raw, [
      "fiber",
      "fibre",
      "fiber_g",
      "fibre_g",
      "fiberPer100g",
      "fiber_g_per_100g",
      "unit_serving_fiber_g",
    ]);

  return {
    source: detail.sourceSystem ?? "UNKNOWN",
    sourceFoodId: detail.sourceFoodCode ?? detail.id,
    name: detail.name,
    baseServing: {
      amount: servingAmount > 0 ? servingAmount : 100,
      unit: servingUnit,
    },
    macrosPerBaseServing: {
      calories,
      protein,
      carbs,
      fat,
      fiber,
    },
    mineralsPerBaseServing: hasMinerals ? minerals : undefined,
    metadata: {
      qualityStatus: detail.qualityStatus,
      qualityFlags: detail.qualityFlags,
      sourceSystem: detail.sourceSystem,
      sourceFoodCode: detail.sourceFoodCode,
      servingQuantity: extractNutrientValue(detail.raw, [
        "servingQuantity",
        "servingSize",
        "baseServingAmount",
        "servingAmount",
      ]),
      servingUnit:
        toStringValue(detail.raw.servingUnit) ??
        toStringValue(detail.raw.servingSizeUnit) ??
        toStringValue(detail.raw.baseServingUnit) ??
        toStringValue(detail.raw.unit),
    },
  };
}

