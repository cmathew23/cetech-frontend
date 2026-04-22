export type CatalogPageMeta = {
  page: number;
  limit: number;
  total: number | null;
  totalPages: number | null;
};

export type NutritionCatalogQuery = {
  search?: string;
  sourceSystem?: string;
  qualityStatus?: string;
  qualityFlag?: string;
  page?: number;
  limit?: number;
};

export type ExerciseCatalogQuery = {
  search?: string;
  sourceSystem?: string;
  category?: string;
  page?: number;
  limit?: number;
};

export type NutritionCatalogItem = {
  id: string;
  name: string;
  sourceSystem?: string;
  sourceFoodCode?: string;
  qualityStatus?: string;
  qualityFlags: string[];
  calories?: number;
};

export type ExerciseCatalogItem = {
  id: string;
  name: string;
  sourceSystem?: string;
  sourceExternalId?: string;
  sourceUuid?: string;
  category?: string;
  categoryName?: string;
  description?: string;
  descriptionHtml?: string;
  descriptionText?: string;
};

export type NutritionCatalogDetail = NutritionCatalogItem & {
  raw: Record<string, unknown>;
};

export type ExerciseCatalogDetail = ExerciseCatalogItem & {
  primaryMuscles?: string[];
  secondaryMuscles?: string[];
  equipment?: string[];
  media?: unknown;
  createdAt?: string;
  updatedAt?: string;
  raw: Record<string, unknown>;
};

export type NutritionCatalogListResult = {
  items: NutritionCatalogItem[];
  meta: CatalogPageMeta;
};

export type ExerciseCatalogListResult = {
  items: ExerciseCatalogItem[];
  meta: CatalogPageMeta;
};
