import { Card } from "@/components/ui/Card";
import { Alert } from "@/components/ui/Alert";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatDateOnly, formatDateRange } from "@/lib/dateTime";
import type {
  SportMetricsGolfComparisonCategory,
  SportMetricsGolfComparisonData,
  SportMetricsGolfComparisonDrill,
  SportMetricsGolfComparisonMetric,
  SportMetricsGolfComparisonSnapshot,
  SportMetricsGolfComparisonStatus,
} from "@/lib/api/sportMetricsGolf";

const METRIC_FIELDS = [
  ["Attempts", "attempts", false],
  ["Successes", "successes", false],
  ["Target hits", "targetHits", false],
  ["Success rate", "successRate", true],
] as const;

function formatTaxonomyAreaKey(value: string): string {
  return value
    .split("_")
    .map((part) =>
      part === "" ? part : `${part.charAt(0).toUpperCase()}${part.slice(1)}`,
    )
    .join(" ");
}

function formatMetricValue(
  value: number | null,
  percentage: boolean,
  nullValue = "Unavailable",
): string {
  if (value === null) return nullValue;
  return percentage ? `${value}%` : String(value);
}

function formatComparisonStatus(
  status: SportMetricsGolfComparisonStatus,
): string {
  const labels: Record<SportMetricsGolfComparisonStatus, string> = {
    ONLY_IN_LATER: "Added in later week",
    ONLY_IN_EARLIER: "Only in earlier week",
    COMPARABLE: "Comparable",
    NOT_COMPARABLE: "Not comparable",
  };
  return labels[status];
}

function formatWeekRange(snapshot: SportMetricsGolfComparisonSnapshot): string {
  return formatDateRange(snapshot.weekStartDate, snapshot.weekEndDate);
}

function SnapshotMetadata({
  title,
  snapshot,
}: {
  title: string;
  snapshot: SportMetricsGolfComparisonSnapshot;
}) {
  return (
    <Card title={title} accent={false} padding="compact">
      <dl className="space-y-2 text-sm">
        <MetadataRow label="Week start" value={formatDateOnly(snapshot.weekStartDate)} />
        <MetadataRow label="Week end" value={formatDateOnly(snapshot.weekEndDate)} />
      </dl>
    </Card>
  );
}

function MetadataRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-w-0 justify-between gap-4">
      <dt className="text-textSecondary">{label}</dt>
      <dd className="min-w-0 break-words text-right font-medium text-textPrimary">
        {value}
      </dd>
    </div>
  );
}

function MetricSummary({
  title,
  metrics,
  notPresent = false,
  isDelta = false,
}: {
  title: string;
  metrics: SportMetricsGolfComparisonMetric | null;
  notPresent?: boolean;
  isDelta?: boolean;
}) {
  const nullValue = isDelta ? "—" : "Unavailable";

  return (
    <div className="min-w-0 space-y-2">
      <h4 className="text-sm font-medium text-textPrimary">{title}</h4>
      {metrics === null ? (
        <p className="text-sm text-textSecondary">
          {notPresent ? "Not present this week" : "Unavailable"}
        </p>
      ) : (
        <dl className="space-y-1.5 text-sm">
          {METRIC_FIELDS.map(([label, field, percentage]) => (
            <div
              key={field}
              className="flex min-w-0 justify-between gap-4"
            >
              <dt className="text-textSecondary">{label}</dt>
              <dd className="shrink-0 font-medium text-textPrimary">
                {formatMetricValue(metrics[field], percentage, nullValue)}
              </dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
}

function DrillRow({
  drill,
  earlierWeekLabel,
  laterWeekLabel,
}: {
  drill: SportMetricsGolfComparisonDrill;
  earlierWeekLabel: string;
  laterWeekLabel: string;
}) {
  const drillLabel =
    drill.earlierSkillName ?? drill.laterSkillName ?? "Unnamed drill";
  const namesDiffer =
    drill.earlierSkillName !== null &&
    drill.laterSkillName !== null &&
    drill.earlierSkillName !== drill.laterSkillName;

  return (
    <li className="min-w-0 space-y-4 rounded-lg border border-border bg-surface p-4">
      <div className="flex min-w-0 flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h4 className="break-words text-sm font-medium text-textPrimary">
            {drillLabel}
          </h4>
        </div>
        <StatusBadge variant="neutral">
          {formatComparisonStatus(drill.status)}
        </StatusBadge>
      </div>

      {namesDiffer ? (
        <dl className="grid gap-2 text-sm sm:grid-cols-2">
          <MetadataRow
            label="Earlier name"
            value={drill.earlierSkillName!}
          />
          <MetadataRow
            label="Later name"
            value={drill.laterSkillName!}
          />
        </dl>
      ) : null}

      {drill.taxonomyMismatch ? (
        <Alert variant="warning">Classification changed between weeks</Alert>
      ) : null}

      <div className="grid min-w-0 gap-4 sm:grid-cols-3">
        <MetricSummary
          title={earlierWeekLabel}
          metrics={drill.earlier}
          notPresent={drill.status === "ONLY_IN_LATER"}
        />
        <MetricSummary
          title={laterWeekLabel}
          metrics={drill.later}
          notPresent={drill.status === "ONLY_IN_EARLIER"}
        />
        <MetricSummary title="Difference" metrics={drill.delta} isDelta />
      </div>
    </li>
  );
}

function CategoryCard({
  category,
  earlierWeekLabel,
  laterWeekLabel,
}: {
  category: SportMetricsGolfComparisonCategory;
  earlierWeekLabel: string;
  laterWeekLabel: string;
}) {
  return (
    <Card
      title={formatTaxonomyAreaKey(category.taxonomyAreaKey)}
      actions={
        <StatusBadge variant="neutral">
          {formatComparisonStatus(category.status)}
        </StatusBadge>
      }
      accent={false}
      padding="compact"
    >
      <div className="space-y-4">
        {category.drillMixChanged ? (
          <p className="text-sm font-medium text-textPrimary">
            Drill mix changed
          </p>
        ) : null}

        <div className="grid min-w-0 gap-4 sm:grid-cols-3">
          <MetricSummary
            title={earlierWeekLabel}
            metrics={category.earlier}
            notPresent={category.status === "ONLY_IN_LATER"}
          />
          <MetricSummary
            title={laterWeekLabel}
            metrics={category.later}
            notPresent={category.status === "ONLY_IN_EARLIER"}
          />
          <MetricSummary title="Difference" metrics={category.delta} isDelta />
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-medium text-textPrimary">Drills</h3>
          <ul className="space-y-3">
            {category.drills.map((drill) => (
              <DrillRow
                key={`${drill.sport}:${drill.taxonomyAreaKey}:${drill.skillCode}`}
                drill={drill}
                earlierWeekLabel={earlierWeekLabel}
                laterWeekLabel={laterWeekLabel}
              />
            ))}
          </ul>
        </div>
      </div>
    </Card>
  );
}

export function GolfSportsMetricsComparison({
  comparison,
}: {
  comparison: SportMetricsGolfComparisonData;
}) {
  const earlierWeekLabel = formatWeekRange(comparison.earlier);
  const laterWeekLabel = formatWeekRange(comparison.later);

  return (
    <section className="min-w-0 space-y-6" aria-labelledby="golf-comparison-title">
      <div>
        <h2
          id="golf-comparison-title"
          className="text-xl font-medium text-textPrimary"
        >
          Golf Sports Metrics Comparison
        </h2>
        <p className="text-sm text-textSecondary">Sport: {comparison.sport}</p>
      </div>

      <div className="grid min-w-0 gap-4 md:grid-cols-2">
        <SnapshotMetadata title="Earlier week" snapshot={comparison.earlier} />
        <SnapshotMetadata title="Later week" snapshot={comparison.later} />
      </div>

      <section className="space-y-3" aria-labelledby="golf-comparison-categories">
        <h2
          id="golf-comparison-categories"
          className="text-lg font-medium text-textPrimary"
        >
          Categories
        </h2>
        {comparison.categories.length === 0 ? (
          <p className="text-sm text-textSecondary">
            No Golf Sports Metrics comparison categories returned.
          </p>
        ) : null}
        <div className="space-y-4">
          {comparison.categories.map((category) => (
            <CategoryCard
              key={`${category.sport}:${category.taxonomyAreaKey}`}
              category={category}
              earlierWeekLabel={earlierWeekLabel}
              laterWeekLabel={laterWeekLabel}
            />
          ))}
        </div>
      </section>

      {comparison.taxonomyMismatches.length > 0 ? (
        <Card
          title="Classification changes"
          accent={false}
          padding="compact"
        >
          <p className="mb-3 text-sm text-textSecondary">
            Some records were classified differently between weeks.
          </p>
          <ul className="space-y-3">
            {comparison.taxonomyMismatches.map((mismatch) => (
              <li
                key={mismatch.skillCode}
                className="space-y-2 rounded-lg border border-border bg-surface p-3 text-sm"
              >
                <p className="font-medium text-textPrimary">
                  Classification changed between weeks
                </p>
                <MetadataRow
                  label="Earlier classifications"
                  value={mismatch.earlierTaxonomyAreaKeys
                    .map(formatTaxonomyAreaKey)
                    .join(", ")}
                />
                <MetadataRow
                  label="Later classifications"
                  value={mismatch.laterTaxonomyAreaKeys
                    .map(formatTaxonomyAreaKey)
                    .join(", ")}
                />
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      {comparison.unclassifiableCounts.earlier !== 0 ||
      comparison.unclassifiableCounts.later !== 0 ? (
        <Card
          title="Some records could not be included in the comparison"
          accent={false}
          padding="compact"
        >
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <MetadataRow
              label="Earlier count"
              value={String(comparison.unclassifiableCounts.earlier)}
            />
            <MetadataRow
              label="Later count"
              value={String(comparison.unclassifiableCounts.later)}
            />
          </dl>
        </Card>
      ) : null}
    </section>
  );
}
