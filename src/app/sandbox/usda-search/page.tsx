/** TEMP SANDBOX / NOT FINAL UI: nutrition food flow integration validation page. */

import { Card } from "@/components/ui/Card";
import { Heading } from "@/components/ui/Heading";
import { Stack } from "@/components/ui/Stack";
import { FoodSearchPanel } from "@/components/nutrition/FoodSearchPanel";

export default function UsdaSearchSandboxPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8">
      <Card>
        <Stack spacing="md">
          <Heading variant="h2">Nutrition Search Sandbox</Heading>
          <p className="text-sm text-textSecondary">
            Temporary source-agnostic food flow (search/select/serving/draft/totals).
            Current provider path is USDA via backend endpoint
            <code className="mx-1">/nutrition/usda/search</code>.
          </p>
          <FoodSearchPanel />
        </Stack>
      </Card>
    </div>
  );
}
