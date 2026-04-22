export type FoodSource = "USDA" | string;

export type NutritionMinerals = {
  iron?: number;
  calcium?: number;
  sodium?: number;
  potassium?: number;
  magnesium?: number;
};

export type NormalizedFood = {
  source: FoodSource;
  sourceFoodId: string;
  name: string;
  baseServing: {
    amount: number;
    unit: string;
  };
  macrosPerBaseServing: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber?: number;
  };
  mineralsPerBaseServing?: NutritionMinerals;
  metadata?: {
    brandOwner?: string;
    dataType?: string;
    [key: string]: unknown;
  };
};
