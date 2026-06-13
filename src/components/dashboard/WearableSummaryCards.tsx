"use client";

import { Card } from "@/components/ui/Card";
import {
  type WearableMetricGroup,
  type WearableSummary,
} from "@/lib/api/wearableSummary";
import { formatDateOnly, formatDateOrDateTime, parseToLocalDate } from "@/lib/dateTime";
import { cn } from "@/lib/utils";

const WEARABLE_METRIC_NO_VALUE = "NA";

function GroupMeta({
  sampleCount,
  status,
  latestAt,
}: {
  sampleCount: number | null;
  status: string | null;
  latestAt: string | null;
}) {
  const parts = [
    sampleCount !== null ? `${sampleCount} samples` : null,
    status,
    latestAt ? `Latest ${formatDateOrDateTime(latestAt, latestAt)}` : null,
  ].filter(Boolean);

  if (parts.length === 0) return null;
  return <p className="text-[11px] leading-tight text-textMuted">{parts.join(" · ")}</p>;
}

type MetricDefinition = {
  label: string;
  candidates: string[];
  formatter?: "date" | "datetime" | "boolean" | "text";
};

export type WearableViewerContext =
  | "ATHLETE"
  | "HEAD_COACH"
  | "SKILLS"
  | "NUTRITION"
  | "S_AND_C"
  | "DEFAULT";

const METRIC_DEFINITIONS: Record<string, MetricDefinition[]> = {
  connectionSync: [
    { label: "Wearable Status", candidates: ["wearableStatus", "status"], formatter: "text" },
    { label: "Provider", candidates: ["providerName", "provider", "wearableProvider"], formatter: "text" },
    { label: "Last Sync", candidates: ["lastSyncAt", "latestSyncAt", "latestAt", "syncAt"], formatter: "date" },
    {
      label: "Open Wearables User Linked",
      candidates: ["openWearablesUserLinked", "openWearablesLinked", "userLinked"],
      formatter: "boolean",
    },
    { label: "Latest Sync Status", candidates: ["syncStatus", "latestSyncStatus", "connectionStatus"], formatter: "text" },
  ],
  recoveryReadiness: [
    { label: "Sleep Duration", candidates: ["sleepDuration", "sleepDurationHours", "latestSleepDuration", "averageSleepDuration"] },
    { label: "Sleep Efficiency", candidates: ["sleepEfficiency", "latestSleepEfficiency", "averageSleepEfficiency"] },
    { label: "HRV RMSSD", candidates: ["hrvRmssd", "latestHrvRmssd", "averageHrvRmssd"] },
    { label: "HRV SDNN", candidates: ["hrvSdnn", "latestHrvSdnn", "averageHrvSdnn"] },
    { label: "Resting Heart Rate", candidates: ["restingHeartRate", "latestRestingHeartRate", "averageRestingHeartRate"] },
    { label: "SpO2", candidates: ["spo2", "latestSpo2", "averageSpo2"] },
    { label: "Respiratory Rate", candidates: ["respiratoryRate", "latestRespiratoryRate", "averageRespiratoryRate"] },
    { label: "Recovery Score", candidates: ["recoveryScore", "latestRecoveryScore", "averageRecoveryScore"] },
    { label: "Readiness Score", candidates: ["readinessScore", "latestReadinessScore", "averageReadinessScore"] },
    { label: "Stress Score", candidates: ["stressScore", "latestStressScore", "averageStressScore"] },
    { label: "Body Battery", candidates: ["bodyBattery", "latestBodyBattery", "averageBodyBattery"] },
  ],
  activityTrainingLoad: [
    { label: "Steps", candidates: ["steps", "totalSteps", "averageSteps"] },
    { label: "Active Calories", candidates: ["activeCalories", "totalActiveCalories", "averageActiveCalories"] },
    { label: "Total Calories", candidates: ["totalCalories", "averageTotalCalories"] },
    { label: "Active Minutes", candidates: ["activeMinutes", "totalActiveMinutes", "averageActiveMinutes"] },
    { label: "Sedentary Minutes", candidates: ["sedentaryMinutes", "totalSedentaryMinutes", "averageSedentaryMinutes"] },
    { label: "Light Intensity Minutes", candidates: ["lightIntensityMinutes", "totalLightIntensityMinutes", "averageLightIntensityMinutes"] },
    { label: "Moderate Intensity Minutes", candidates: ["moderateIntensityMinutes", "totalModerateIntensityMinutes", "averageModerateIntensityMinutes"] },
    { label: "Vigorous Intensity Minutes", candidates: ["vigorousIntensityMinutes", "totalVigorousIntensityMinutes", "averageVigorousIntensityMinutes"] },
    { label: "Distance", candidates: ["distance", "totalDistance", "averageDistance"] },
    { label: "Elevation Gain", candidates: ["elevationGain", "totalElevationGain", "averageElevationGain"] },
    { label: "Floors Climbed", candidates: ["floorsClimbed", "totalFloorsClimbed", "averageFloorsClimbed"] },
    { label: "Average MET", candidates: ["averageMet", "averageMets", "metAverage"] },
    { label: "Physical Effort", candidates: ["physicalEffort", "latestPhysicalEffort", "averagePhysicalEffort"] },
  ],
  cardiovascularFitness: [
    { label: "VO2 Max", candidates: ["vo2Max", "latestVo2Max", "averageVo2Max"] },
    { label: "Average Heart Rate", candidates: ["averageHeartRate", "avgHeartRate"] },
    { label: "Maximum Heart Rate", candidates: ["maximumHeartRate", "maxHeartRate"] },
    { label: "Minimum Heart Rate", candidates: ["minimumHeartRate", "minHeartRate"] },
    { label: "Latest Heart Rate", candidates: ["latestHeartRate", "heartRate"] },
    { label: "Fitness Age", candidates: ["fitnessAge", "latestFitnessAge"] },
  ],
  workoutPerformance: [
    { label: "Workout Duration", candidates: ["workoutDuration", "averageWorkoutDuration", "latestWorkoutDuration"] },
    { label: "Distance", candidates: ["distance", "workoutDistance", "averageDistance"] },
    { label: "Pace", candidates: ["pace", "latestPace", "averagePace"] },
    { label: "Speed", candidates: ["speed", "latestSpeed", "averageSpeed"] },
    { label: "Power", candidates: ["power", "latestPower", "averagePower"] },
    { label: "Cadence", candidates: ["cadence", "latestCadence", "averageCadence"] },
    { label: "Elevation Gain", candidates: ["elevationGain", "workoutElevationGain", "averageElevationGain"] },
    { label: "Workout Effort Score", candidates: ["workoutEffortScore", "latestWorkoutEffortScore", "averageWorkoutEffortScore"] },
  ],
  movementQuality: [
    { label: "Walking Step Length", candidates: ["walkingStepLength", "latestWalkingStepLength", "averageWalkingStepLength"] },
    { label: "Walking Speed", candidates: ["walkingSpeed", "latestWalkingSpeed", "averageWalkingSpeed"] },
    { label: "Double Support %", candidates: ["doubleSupportPercent", "latestDoubleSupportPercent", "averageDoubleSupportPercent"] },
    { label: "Walking Asymmetry %", candidates: ["walkingAsymmetryPercent", "latestWalkingAsymmetryPercent", "averageWalkingAsymmetryPercent"] },
    { label: "Walking Steadiness", candidates: ["walkingSteadiness", "latestWalkingSteadiness", "averageWalkingSteadiness"] },
    { label: "Stair Ascent Speed", candidates: ["stairAscentSpeed", "latestStairAscentSpeed", "averageStairAscentSpeed"] },
    { label: "Stair Descent Speed", candidates: ["stairDescentSpeed", "latestStairDescentSpeed", "averageStairDescentSpeed"] },
    { label: "Running Vertical Oscillation", candidates: ["runningVerticalOscillation", "latestRunningVerticalOscillation", "averageRunningVerticalOscillation"] },
    { label: "Running Ground Contact Time", candidates: ["runningGroundContactTime", "latestRunningGroundContactTime", "averageRunningGroundContactTime"] },
    { label: "Running Stride Length", candidates: ["runningStrideLength", "latestRunningStrideLength", "averageRunningStrideLength"] },
    { label: "Swimming Stroke Count", candidates: ["swimmingStrokeCount", "latestSwimmingStrokeCount", "averageSwimmingStrokeCount"] },
  ],
  bodyHealthMetrics: [
    { label: "Weight", candidates: ["weight", "latestWeight", "averageWeight"] },
    { label: "BMI", candidates: ["bmi", "latestBmi", "averageBmi"] },
    { label: "Body Fat %", candidates: ["bodyFatPercent", "latestBodyFatPercent", "averageBodyFatPercent"] },
    { label: "Body Fat Mass", candidates: ["bodyFatMass", "latestBodyFatMass", "averageBodyFatMass"] },
    { label: "Muscle Mass", candidates: ["muscleMass", "latestMuscleMass", "averageMuscleMass"] },
    { label: "Skeletal Muscle Mass", candidates: ["skeletalMuscleMass", "latestSkeletalMuscleMass", "averageSkeletalMuscleMass"] },
    { label: "Waist Circumference", candidates: ["waistCircumference", "latestWaistCircumference", "averageWaistCircumference"] },
    { label: "Body Temperature", candidates: ["bodyTemperature", "latestBodyTemperature", "averageBodyTemperature"] },
    { label: "Skin Temperature", candidates: ["skinTemperature", "latestSkinTemperature", "averageSkinTemperature"] },
    { label: "Blood Pressure Systolic", candidates: ["bloodPressureSystolic", "latestBloodPressureSystolic", "averageBloodPressureSystolic"] },
    { label: "Blood Pressure Diastolic", candidates: ["bloodPressureDiastolic", "latestBloodPressureDiastolic", "averageBloodPressureDiastolic"] },
    { label: "Blood Glucose", candidates: ["bloodGlucose", "latestBloodGlucose", "averageBloodGlucose"] },
    { label: "Hydration", candidates: ["hydration", "latestHydration", "averageHydration"] },
  ],
  metadataProviderData: [
    { label: "Metadata Artifacts", candidates: ["metadataArtifacts", "artifactCount", "metadataCount"] },
    { label: "Source Types", candidates: ["sourceTypes", "sources", "providerSources"], formatter: "text" },
    { label: "Recent Provider Records", candidates: ["recentProviderRecords", "providerRecordCount", "recentRecords"] },
  ],
};

function isLikelyDateString(value: string): boolean {
  const trimmed = value.trim();
  if (trimmed === "") return false;
  return parseToLocalDate(trimmed) !== null;
}

function formatMetricDisplay(
  value: unknown,
  formatter: MetricDefinition["formatter"] | undefined,
): string {
  if (value === null || value === undefined) return WEARABLE_METRIC_NO_VALUE;
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "number" && Number.isFinite(value)) {
    return Number.isInteger(value)
      ? value.toLocaleString("en-US")
      : value.toLocaleString("en-US", { maximumFractionDigits: 2 });
  }
  if (Array.isArray(value)) {
    const cleaned = value
      .map((item) => (typeof item === "string" ? item.trim() : String(item)))
      .filter((item) => item !== "");
    return cleaned.length > 0 ? cleaned.join(", ") : WEARABLE_METRIC_NO_VALUE;
  }

  const text = String(value).trim();
  if (text === "") return WEARABLE_METRIC_NO_VALUE;
  if (formatter === "date") return formatDateOnly(text, WEARABLE_METRIC_NO_VALUE);
  if (formatter === "datetime") return formatDateOrDateTime(text, WEARABLE_METRIC_NO_VALUE);
  if (formatter === "boolean") {
    const normalized = text.toLowerCase();
    if (normalized === "true") return "Yes";
    if (normalized === "false") return "No";
  }
  if (isLikelyDateString(text)) {
    return formatDateOrDateTime(text, text);
  }
  return text;
}

function findMetricValue(source: Record<string, unknown>, candidates: string[]): unknown {
  for (const key of candidates) {
    const direct = source[key];
    if (direct !== undefined && direct !== null && direct !== "") return direct;
  }

  for (const key of candidates) {
    const latest = source[`latest${key[0].toUpperCase()}${key.slice(1)}`];
    if (latest !== undefined && latest !== null && latest !== "") return latest;
    const average = source[`average${key[0].toUpperCase()}${key.slice(1)}`];
    if (average !== undefined && average !== null && average !== "") return average;
    const sum = source[`sum${key[0].toUpperCase()}${key.slice(1)}`];
    if (sum !== undefined && sum !== null && sum !== "") return sum;
    const min = source[`min${key[0].toUpperCase()}${key.slice(1)}`];
    const max = source[`max${key[0].toUpperCase()}${key.slice(1)}`];
    if (min !== undefined && min !== null && max !== undefined && max !== null) {
      return `${formatMetricDisplay(min, undefined)} / ${formatMetricDisplay(max, undefined)}`;
    }
  }

  return null;
}

function buildMetricRows(group: WearableMetricGroup): Array<{ label: string; value: string }> {
  const definitions = METRIC_DEFINITIONS[group.key] ?? [];
  return definitions.map((definition) => ({
    label: definition.label,
    value: formatMetricDisplay(findMetricValue(group.source, definition.candidates), definition.formatter),
  }));
}

function MetricRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-x-3 border-b border-border/60 py-1.5 last:border-b-0">
      <dt className="min-w-0 text-xs font-medium text-textSecondary">{label}</dt>
      <dd className="text-right text-xs font-normal text-textPrimary">{value}</dd>
    </div>
  );
}

function WearableGroupCard({ group }: { group: WearableMetricGroup }) {
  const rows = buildMetricRows(group);
  const hasAnyRowData = rows.some((row) => row.value !== WEARABLE_METRIC_NO_VALUE);

  return (
    <div className="rounded-lg border border-slate-200/80 bg-slate-50/60 px-3 py-3 shadow-sm">
      <div className="space-y-1">
        <p className="text-sm font-normal text-textPrimary">
          {group.key === "bodyHealthMetrics"
            ? "Wearable Body & Health Metrics"
            : group.title}
        </p>
        <GroupMeta
          sampleCount={group.sampleCount}
          status={group.status}
          latestAt={group.latestAt}
        />
        {group.key === "bodyHealthMetrics" ? (
          <>
            <p className="text-[11px] leading-tight text-textMuted">
              Source: Connected wearable / Open Wearables
            </p>
            <p className="text-[11px] leading-tight text-textMuted">
              APP body composition data is managed separately in Athlete Planning
              Profile.
            </p>
          </>
        ) : null}
      </div>

      <dl className="mt-2 grid grid-cols-1 gap-x-4 md:grid-cols-2">
        {rows.map((row) => (
          <MetricRow key={`${group.key}-${row.label}`} label={row.label} value={row.value} />
        ))}
      </dl>
      {!hasAnyRowData ? (
        <p className="mt-2 text-[11px] leading-tight text-textMuted">
          {group.key === "bodyHealthMetrics"
            ? "No wearable body/health data available for this period."
            : "No data available for this period"}
        </p>
      ) : null}
    </div>
  );
}

function resolveVisibleGroupKeys(viewerContext: WearableViewerContext): string[] {
  if (viewerContext === "HEAD_COACH") {
    return [
      "connectionSync",
      "recoveryReadiness",
      "activityTrainingLoad",
      "cardiovascularFitness",
      "workoutPerformance",
      "movementQuality",
      "bodyHealthMetrics",
      "metadataProviderData",
    ];
  }

  if (viewerContext === "SKILLS") {
    return [
      "connectionSync",
      "recoveryReadiness",
      "activityTrainingLoad",
      "cardiovascularFitness",
      "workoutPerformance",
      "movementQuality",
    ];
  }

  if (viewerContext === "S_AND_C") {
    return [
      "connectionSync",
      "recoveryReadiness",
      "activityTrainingLoad",
      "cardiovascularFitness",
      "workoutPerformance",
      "movementQuality",
      "bodyHealthMetrics",
    ];
  }

  if (viewerContext === "NUTRITION") {
    return [
      "connectionSync",
      "recoveryReadiness",
      "activityTrainingLoad",
      "bodyHealthMetrics",
    ];
  }

  return [
    "connectionSync",
    "recoveryReadiness",
    "activityTrainingLoad",
    "cardiovascularFitness",
    "workoutPerformance",
    "movementQuality",
    "bodyHealthMetrics",
    "metadataProviderData",
  ];
}

export function WearableSummaryCards({
  summary,
  title = "Wearable Summary",
  subtitle,
  viewerContext = "DEFAULT",
  titleClassName,
  cardClassName,
}: {
  summary: WearableSummary;
  title?: string;
  subtitle?: string;
  viewerContext?: WearableViewerContext;
  titleClassName?: string;
  cardClassName?: string;
}) {
  const resolvedSubtitle =
    subtitle ??
    `${formatDateOnly(summary.startDate, summary.startDate)} – ${formatDateOnly(summary.endDate, summary.endDate)}`;

  const groups = [
    summary.groups.connectionSync,
    summary.groups.recoveryReadiness,
    summary.groups.activityTrainingLoad,
    summary.groups.cardiovascularFitness,
    summary.groups.workoutPerformance,
    summary.groups.movementQuality,
    summary.groups.bodyHealthMetrics,
    summary.groups.metadataProviderData,
  ].filter((group) => resolveVisibleGroupKeys(viewerContext).includes(group.key));

  return (
    <Card
      title={title}
      subtitle={resolvedSubtitle}
      accent={false}
      padding="compact"
      className={cn("shadow-[0_10px_30px_rgba(15,23,42,0.05)]", cardClassName)}
      titleClassName={titleClassName}
    >
      <div
        className={cn(
          "grid gap-3",
          "grid-cols-1 md:grid-cols-2 xl:grid-cols-4",
        )}
      >
        {groups.map((group) => (
          <WearableGroupCard key={group.key} group={group} />
        ))}
      </div>
    </Card>
  );
}
