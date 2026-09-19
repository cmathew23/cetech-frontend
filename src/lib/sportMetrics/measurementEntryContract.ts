export type MeasurementEntryFieldType =
  | "NUMBER"
  | "INTEGER"
  | "BOOLEAN"
  | "ENUM"
  | "STRING";

export type MeasurementEntryEnumOption = {
  value: string;
  label: string;
};

export type MeasurementEntryField = {
  key: string;
  label: string;
  type: MeasurementEntryFieldType;
  unit: string | null;
  required: boolean;
  options: MeasurementEntryEnumOption[];
};

export type MeasurementEntryMode = "INDIVIDUAL" | "CUMULATIVE";

export type MeasurementEntryContract = {
  INDIVIDUAL: { fields: MeasurementEntryField[] };
  CUMULATIVE: { fields: MeasurementEntryField[] };
};

export type MeasurementEntryFormValues = Record<string, string>;

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function readString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

export function formatMeasurementEntryFieldLabel(raw: string): string {
  const trimmed = raw.trim();
  if (trimmed === "") return trimmed;
  const spaced = trimmed
    .replace(/[_-]+/g, " ")
    .replace(/([a-z\d])([A-Z])/g, "$1 $2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
    .replace(/\s+/g, " ")
    .trim();
  const lower = spaced.toLowerCase();
  return `${lower.charAt(0).toUpperCase()}${lower.slice(1)}`;
}

export function formatMeasurementMetricSource(raw: string): string {
  if (raw === "PGA_TOUR") return "PGA TOUR";
  if (raw === "PEAKFLOW_ASSIGNED") return "PeakFlow Assigned";
  return raw;
}

export const GRIP_PRESSURE_DISPLAY_LABEL = "Grip Pressure (1–10)";
export const GRIP_PRESSURE_HELPER_TEXT =
  "1 = very light grip · 10 = maximum grip pressure";
export const GRIP_PRESSURE_SUCCESSES_HELPER_TEXT =
  "Shots that met the drill's success criteria";

function normalizeMetricFieldKey(key: string): string {
  return key.replace(/[_-]/g, "").toLowerCase();
}

export function isGripPressureMetricField(
  field: Pick<MeasurementEntryField, "key" | "label">,
): boolean {
  const key = normalizeMetricFieldKey(field.key);
  if (
    key === "selectedpressure" ||
    key === "grippressure" ||
    key === "selectedgrippressure"
  ) {
    return true;
  }
  return field.label.trim().toLowerCase() === "selected pressure";
}

export function measurementEntryFieldDisplayLabel(field: MeasurementEntryField): string {
  return isGripPressureMetricField(field) ? GRIP_PRESSURE_DISPLAY_LABEL : field.label;
}

export function measurementEntryFieldHelperText(
  field: MeasurementEntryField,
  fields: MeasurementEntryField[],
): string | null {
  if (isGripPressureMetricField(field)) return GRIP_PRESSURE_HELPER_TEXT;
  if (field.key === "successes" && fields.some(isGripPressureMetricField)) {
    return GRIP_PRESSURE_SUCCESSES_HELPER_TEXT;
  }
  return null;
}

function readFieldType(value: unknown): MeasurementEntryFieldType | null {
  const raw = readString(value);
  if (!raw) return null;
  const upper = raw.toUpperCase();
  if (
    upper === "NUMBER" ||
    upper === "INTEGER" ||
    upper === "BOOLEAN" ||
    upper === "ENUM" ||
    upper === "STRING"
  ) {
    return upper;
  }
  return null;
}

function readEnumOptions(raw: unknown): MeasurementEntryEnumOption[] | null {
  const record = asRecord(raw);
  const list = Array.isArray(raw)
    ? raw
    : Array.isArray(record?.values)
      ? record.values
      : Array.isArray(record?.options)
        ? record.options
        : null;
  if (!list || list.length === 0) return null;
  const options: MeasurementEntryEnumOption[] = [];
  for (const item of list) {
    if (typeof item === "string") {
      const value = item.trim();
      if (!value) return null;
      options.push({ value, label: value });
      continue;
    }
    const option = asRecord(item);
    if (!option) return null;
    const value =
      readString(option.value) ?? readString(option.key) ?? readString(option.id);
    if (!value) return null;
    options.push({
      value,
      label:
        readString(option.label) ??
        readString(option.displayLabel) ??
        readString(option.displayName) ??
        value,
    });
  }
  return options;
}

function readUnit(value: unknown): string | null {
  const direct = readString(value);
  if (direct) return direct;
  const record = asRecord(value);
  if (!record) return null;
  return readString(record.code) ?? readString(record.symbol) ?? readString(record.unit);
}

function readField(raw: unknown): MeasurementEntryField | null {
  const record = asRecord(raw);
  if (!record) return null;
  const key =
    readString(record.key) ??
    readString(record.field) ??
    readString(record.fieldKey) ??
    readString(record.name) ??
    readString(record.id);
  const type = readFieldType(record.type ?? record.valueType ?? record.dataType);
  if (!key || !type) return null;
  const providedLabel =
    readString(record.label) ??
    readString(record.displayLabel) ??
    readString(record.displayName) ??
    readString(record.title);
  const label =
    providedLabel && providedLabel !== key
      ? providedLabel
      : formatMeasurementEntryFieldLabel(key);
  const required = record.required !== false;
  const options =
    type === "ENUM"
      ? readEnumOptions(
          record.options ??
            record.enumOptions ??
            record.allowedValues ??
            record.values,
        )
      : [];
  if (type === "ENUM" && options === null) return null;
  return {
    key,
    label,
    type,
    unit: readUnit(record.unit),
    required,
    options: options ?? [],
  };
}

function readModeFields(
  raw: unknown,
): { ok: true; fields: MeasurementEntryField[] } | { ok: false } {
  const record = asRecord(raw);
  if (!record) return { ok: true, fields: [] };
  const list = record.fields;
  if (list === undefined) return { ok: true, fields: [] };
  if (!Array.isArray(list)) return { ok: false };
  const fields: MeasurementEntryField[] = [];
  for (const item of list) {
    const field = readField(item);
    if (!field) return { ok: false };
    fields.push(field);
  }
  return { ok: true, fields };
}

function pickModeBlock(
  record: Record<string, unknown>,
  mode: MeasurementEntryMode,
): unknown {
  if (mode === "INDIVIDUAL") {
    return record.INDIVIDUAL ?? record.individual;
  }
  return record.CUMULATIVE ?? record.cumulative;
}

function resolveContractRecord(drill: Record<string, unknown>): Record<string, unknown> | null {
  const direct = asRecord(drill.measurementEntryContract);
  if (!direct) return null;
  const nested =
    asRecord(direct.modes) ??
    asRecord(direct.entryModes) ??
    asRecord(direct.measurementEntryContract);
  return nested ?? direct;
}

export function hasMeasurementEntryContractPayload(
  drill: Record<string, unknown>,
): boolean {
  return asRecord(drill.measurementEntryContract) !== null;
}

export function readMeasurementEntryContract(
  drill: Record<string, unknown>,
): MeasurementEntryContract | null {
  const record = resolveContractRecord(drill);
  if (!record) return null;
  const individual = readModeFields(pickModeBlock(record, "INDIVIDUAL"));
  const cumulative = readModeFields(pickModeBlock(record, "CUMULATIVE"));
  if (!individual.ok || !cumulative.ok) return null;
  if (individual.fields.length === 0 && cumulative.fields.length === 0) return null;
  return {
    INDIVIDUAL: { fields: individual.fields },
    CUMULATIVE: { fields: cumulative.fields },
  };
}

export function emptyMeasurementEntryValues(
  fields: MeasurementEntryField[],
): MeasurementEntryFormValues {
  const values: MeasurementEntryFormValues = {};
  for (const field of fields) values[field.key] = "";
  return values;
}

export function groupMeasurementEntryFields(
  fields: MeasurementEntryField[],
): MeasurementEntryField[][] {
  const groups: MeasurementEntryField[][] = [];
  for (const field of fields) {
    const last = groups[groups.length - 1];
    if (last && last[0]?.label === field.label) {
      last.push(field);
    } else {
      groups.push([field]);
    }
  }
  return groups;
}

function parseFieldValue(
  field: MeasurementEntryField,
  raw: string,
):
  | { ok: true; value: number | boolean | string }
  | { ok: false; error: string }
  | { ok: true; omit: true } {
  const trimmed = raw.trim();
  const label = measurementEntryFieldDisplayLabel(field);
  if (trimmed === "") {
    if (field.required) {
      return { ok: false, error: `${label} is required.` };
    }
    return { ok: true, omit: true };
  }

  if (field.type === "BOOLEAN") {
    if (trimmed === "true") return { ok: true, value: true };
    if (trimmed === "false") return { ok: true, value: false };
    return { ok: false, error: `${label} must be Yes or No.` };
  }

  if (field.type === "ENUM") {
    if (field.options.some((option) => option.value === trimmed)) {
      return { ok: true, value: trimmed };
    }
    return { ok: false, error: `${label} must be one of the provided options.` };
  }

  if (field.type === "STRING") {
    return { ok: true, value: trimmed };
  }

  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed)) {
    return { ok: false, error: `${label} must be a number.` };
  }
  if (field.type === "INTEGER" && !Number.isInteger(parsed)) {
    return { ok: false, error: `${label} must be a whole number.` };
  }
  if (isGripPressureMetricField(field)) {
    if (!Number.isInteger(parsed) || parsed < 1 || parsed > 10) {
      return {
        ok: false,
        error: `${label} must be a whole number from 1 to 10.`,
      };
    }
  }
  return { ok: true, value: parsed };
}

function valuesForFields(
  fields: MeasurementEntryField[],
  values: MeasurementEntryFormValues,
):
  | { ok: true; record: Record<string, number | boolean | string> }
  | { ok: false; error: string } {
  const record: Record<string, number | boolean | string> = {};
  for (const field of fields) {
    const parsed = parseFieldValue(field, values[field.key] ?? "");
    if (!parsed.ok) return parsed;
    if ("omit" in parsed) continue;
    record[field.key] = parsed.value;
  }
  return { ok: true, record };
}

function parseOptionalString(raw: string): string | undefined {
  const trimmed = raw.trim();
  return trimmed === "" ? undefined : trimmed;
}

export function validateMeasurementEntryForm(input: {
  contract: MeasurementEntryContract;
  entryMode: MeasurementEntryMode;
  attempts: MeasurementEntryFormValues[];
  cumulative: MeasurementEntryFormValues;
  notes: string;
}): { ok: true; valueJson: Record<string, unknown> } | { ok: false; error: string } {
  const notes = parseOptionalString(input.notes);

  if (input.entryMode === "INDIVIDUAL") {
    const fields = input.contract.INDIVIDUAL.fields;
    if (input.attempts.length < 1) {
      return { ok: false, error: "Add at least one attempt." };
    }
    const attempts: Array<Record<string, number | boolean | string>> = [];
    for (let index = 0; index < input.attempts.length; index += 1) {
      const parsed = valuesForFields(fields, input.attempts[index] ?? {});
      if (!parsed.ok) {
        return { ok: false, error: `Attempt ${index + 1}: ${parsed.error}` };
      }
      attempts.push(parsed.record);
    }
    const valueJson: Record<string, unknown> = {
      entryMode: "INDIVIDUAL",
      attempts,
    };
    if (notes) valueJson.notes = notes;
    return { ok: true, valueJson };
  }

  const parsed = valuesForFields(input.contract.CUMULATIVE.fields, input.cumulative);
  if (!parsed.ok) return parsed;
  const valueJson: Record<string, unknown> = {
    entryMode: "CUMULATIVE",
    ...parsed.record,
  };
  if (notes) valueJson.notes = notes;
  return { ok: true, valueJson };
}
