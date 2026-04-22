import { paths } from "@/config/endpoints";
import { apiRequest } from "@/lib/apiClient";
import type {
  CatalogPageMeta,
  ExerciseCatalogDetail,
  ExerciseCatalogItem,
  ExerciseCatalogListResult,
  ExerciseCatalogQuery,
} from "@/types/catalog.types";
export type { ExerciseCatalogItem, ExerciseCatalogQuery } from "@/types/catalog.types";

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const EMPTY_META: CatalogPageMeta = {
  page: DEFAULT_PAGE,
  limit: DEFAULT_LIMIT,
  total: null,
  totalPages: null,
};

type ExerciseListResponseShape = {
  success?: unknown;
  message?: unknown;
  data?: {
    items?: unknown;
    pagination?: {
      page?: unknown;
      limit?: unknown;
      total?: unknown;
      totalPages?: unknown;
    };
    filters?: {
      category?: unknown;
      search?: unknown;
      sourceSystem?: unknown;
    };
  };
};

type ExerciseDetailResponseShape = {
  success?: unknown;
  message?: unknown;
  data?: unknown;
};

function buildExerciseCatalogPath(query: ExerciseCatalogQuery): string {
  const params = new URLSearchParams();
  if (query.category && query.category.trim() !== "") {
    params.set("category", query.category.trim());
  }
  if (query.search && query.search.trim() !== "") {
    params.set("search", query.search.trim());
  }
  if (query.sourceSystem && query.sourceSystem.trim() !== "") {
    params.set("sourceSystem", query.sourceSystem.trim());
  }
  if (typeof query.page === "number" && Number.isFinite(query.page)) {
    params.set("page", String(query.page));
  }
  if (typeof query.limit === "number" && Number.isFinite(query.limit)) {
    params.set("limit", String(query.limit));
  }
  const qs = params.toString();
  return qs === "" ? paths.exerciseCatalog.root : `${paths.exerciseCatalog.root}?${qs}`;
}

function normalizeExercise(input: unknown): ExerciseCatalogItem | null {
  if (!input || typeof input !== "object") return null;
  const o = input as Record<string, unknown>;

  const rawId = o.id;
  const id = typeof rawId === "string" || typeof rawId === "number" ? String(rawId) : "";
  const rawName = o.name;
  const name = typeof rawName === "string" ? rawName.trim() : "";
  if (id === "" || name === "") return null;

  const categoryName =
    typeof o.categoryName === "string" && o.categoryName.trim() !== ""
      ? o.categoryName.trim()
      : undefined;
  const category =
    categoryName ??
    (typeof o.category === "string" && o.category.trim() !== ""
      ? o.category.trim()
      : undefined);
  const descriptionText =
    typeof o.descriptionText === "string" && o.descriptionText.trim() !== ""
      ? o.descriptionText.trim()
      : undefined;
  const descriptionHtml =
    typeof o.descriptionHtml === "string" && o.descriptionHtml.trim() !== ""
      ? o.descriptionHtml.trim()
      : undefined;
  const description =
    descriptionText ??
    (typeof o.description === "string" && o.description.trim() !== ""
      ? o.description.trim()
      : undefined);
  const sourceUuid =
    typeof o.sourceUuid === "string" && o.sourceUuid.trim() !== ""
      ? o.sourceUuid.trim()
      : undefined;
  const sourceSystem =
    typeof o.sourceSystem === "string" && o.sourceSystem.trim() !== ""
      ? o.sourceSystem.trim()
      : undefined;
  const rawSourceExternalId = o.sourceExternalId;
  const sourceExternalId =
    typeof rawSourceExternalId === "string" &&
    rawSourceExternalId.trim() !== ""
      ? rawSourceExternalId.trim()
      : typeof rawSourceExternalId === "number"
        ? String(rawSourceExternalId)
        : undefined;

  return {
    id,
    name,
    category,
    categoryName,
    description,
    descriptionText,
    descriptionHtml,
    sourceUuid,
    sourceSystem,
    sourceExternalId,
  };
}

function toNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const n = Number(value);
    if (Number.isFinite(n)) return n;
  }
  return null;
}

function parseListResponse(payload: unknown): ExerciseCatalogListResult {
  if (!payload || typeof payload !== "object") {
    throw new Error("Invalid /exercise-catalog response: expected object envelope");
  }
  const root = payload as ExerciseListResponseShape;
  const data = root.data;
  if (!data || typeof data !== "object") {
    throw new Error("Invalid /exercise-catalog response: missing data object");
  }
  const rawItems = data.items;
  if (!Array.isArray(rawItems)) {
    throw new Error("Invalid /exercise-catalog response: data.items must be an array");
  }

  const items = rawItems.reduce<ExerciseCatalogItem[]>((acc, item) => {
    const normalized = normalizeExercise(item);
    if (normalized) acc.push(normalized);
    return acc;
  }, []);

  const pagination = data.pagination;
  const page =
    pagination && typeof pagination === "object"
      ? toNumber(pagination.page) ?? DEFAULT_PAGE
      : DEFAULT_PAGE;
  const limit =
    pagination && typeof pagination === "object"
      ? toNumber(pagination.limit) ?? DEFAULT_LIMIT
      : DEFAULT_LIMIT;
  const total =
    pagination && typeof pagination === "object"
      ? toNumber(pagination.total)
      : null;
  const totalPages =
    pagination && typeof pagination === "object"
      ? toNumber(pagination.totalPages)
      : null;

  const meta: CatalogPageMeta = {
    page: page > 0 ? page : DEFAULT_PAGE,
    limit: limit > 0 ? limit : DEFAULT_LIMIT,
    total,
    totalPages,
  };

  return { items, meta };
}

export async function listExerciseCatalogPage(
  query: ExerciseCatalogQuery = {},
): Promise<ExerciseCatalogListResult> {
  const data = await apiRequest(buildExerciseCatalogPath(query), { method: "GET" });
  return parseListResponse(data);
}

export async function getExerciseCatalogItemById(
  id: string,
): Promise<ExerciseCatalogDetail | null> {
  const data = await apiRequest(paths.exerciseCatalog.byId(id), { method: "GET" });
  if (!data || typeof data !== "object") {
    throw new Error("Invalid /exercise-catalog/:id response: expected object envelope");
  }
  const envelope = data as ExerciseDetailResponseShape;
  if (!envelope.data || typeof envelope.data !== "object") {
    throw new Error("Invalid /exercise-catalog/:id response: missing data object");
  }
  const payload = envelope.data as Record<string, unknown>;
  const normalized = normalizeExercise(payload);
  if (!normalized) return null;
  const toTextArray = (value: unknown): string[] | undefined => {
    if (!Array.isArray(value)) return undefined;
    const rows = value
      .map((v) => (typeof v === "string" ? v.trim() : ""))
      .filter((v) => v !== "");
    return rows.length > 0 ? rows : undefined;
  };
  return {
    ...normalized,
    primaryMuscles: toTextArray(payload.primaryMuscles),
    secondaryMuscles: toTextArray(payload.secondaryMuscles),
    equipment: toTextArray(payload.equipment),
    media: payload.media,
    createdAt:
      typeof payload.createdAt === "string" && payload.createdAt.trim() !== ""
        ? payload.createdAt
        : undefined,
    updatedAt:
      typeof payload.updatedAt === "string" && payload.updatedAt.trim() !== ""
        ? payload.updatedAt
        : undefined,
    raw: payload,
  };
}

export async function listExerciseCatalog(
  query: ExerciseCatalogQuery = {},
): Promise<ExerciseCatalogItem[]> {
  const list = await listExerciseCatalogPage(query);
  return list.items;
}

export async function getExerciseCatalogItemBySource(
  sourceSystem: string,
  sourceExternalId: string,
): Promise<ExerciseCatalogDetail | null> {
  const data = await apiRequest(
    paths.exerciseCatalog.bySource(sourceSystem, sourceExternalId),
    { method: "GET" },
  );
  if (!data || typeof data !== "object") return null;
  const envelope = data as ExerciseDetailResponseShape;
  if (!envelope.data || typeof envelope.data !== "object") return null;
  const payload = envelope.data as Record<string, unknown>;
  const normalized = normalizeExercise(payload);
  if (!normalized) return null;
  return { ...normalized, raw: payload };
}
