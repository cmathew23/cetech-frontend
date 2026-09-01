import { describe, expect, it } from "vitest";
import {
  emptyMeasurementEntryValues,
  formatMeasurementEntryFieldLabel,
  formatMeasurementMetricSource,
  groupMeasurementEntryFields,
  readMeasurementEntryContract,
  validateMeasurementEntryForm,
  type MeasurementEntryContract,
} from "@/lib/sportMetrics/measurementEntryContract";

const clubHeadSpeedContract = {
  INDIVIDUAL: {
    fields: [{ key: "speed", label: "Club Head Speed", type: "NUMBER", unit: "mph" }],
  },
  CUMULATIVE: {
    fields: [
      { key: "attempts", label: "Attempts", type: "INTEGER" },
      { key: "averageSpeed", label: "Average club head speed", type: "NUMBER", unit: "mph" },
    ],
  },
};

const proximityContract = {
  INDIVIDUAL: {
    fields: [
      { key: "proximityFeet", label: "Proximity to Hole", type: "INTEGER", unit: "ft" },
      { key: "proximityInches", label: "Proximity to Hole", type: "INTEGER", unit: "in" },
    ],
  },
  CUMULATIVE: {
    fields: [
      { key: "attempts", label: "Attempts", type: "INTEGER" },
      { key: "averageProximityFeet", label: "Average proximity", type: "INTEGER", unit: "ft" },
      { key: "averageProximityInches", label: "Average proximity", type: "INTEGER", unit: "in" },
    ],
  },
};

const scramblingContract = {
  INDIVIDUAL: {
    fields: [{ key: "success", label: "Success", type: "BOOLEAN" }],
  },
  CUMULATIVE: {
    fields: [
      { key: "attempts", label: "Attempts", type: "INTEGER" },
      { key: "successes", label: "Successes", type: "INTEGER" },
    ],
  },
};

const puttingPercentContract = {
  INDIVIDUAL: {
    fields: [
      { key: "puttDistance", label: "Putt distance", type: "NUMBER", unit: "ft" },
      { key: "made", label: "Made", type: "BOOLEAN" },
    ],
  },
  CUMULATIVE: {
    fields: [
      { key: "puttDistance", label: "Putt distance", type: "NUMBER", unit: "ft" },
      { key: "attempts", label: "Attempts", type: "INTEGER" },
      { key: "made", label: "Made", type: "INTEGER" },
    ],
  },
};

function requireContract(raw: Record<string, unknown>): MeasurementEntryContract {
  const contract = readMeasurementEntryContract({ measurementEntryContract: raw });
  if (!contract) {
    throw new Error("expected measurementEntryContract");
  }
  return contract;
}

function metadataKeys(contract: MeasurementEntryContract, mode: "INDIVIDUAL" | "CUMULATIVE"): string[] {
  return contract[mode].fields.map((field) => field.key);
}

describe("readMeasurementEntryContract key passthrough", () => {
  it("keeps backend field keys identical; does not invent clubHeadSpeed or finalDistanceFt", () => {
    const club = requireContract(clubHeadSpeedContract);
    const proximity = requireContract(proximityContract);
    expect(metadataKeys(club, "INDIVIDUAL")).toEqual(["speed"]);
    expect(metadataKeys(club, "CUMULATIVE")).toEqual(["attempts", "averageSpeed"]);
    expect(metadataKeys(proximity, "INDIVIDUAL")).toEqual(["proximityFeet", "proximityInches"]);
    expect(club.INDIVIDUAL.fields[0]?.unit).toBe("mph");
    expect(proximity.INDIVIDUAL.fields.map((field) => field.unit)).toEqual(["ft", "in"]);
  });

  it("returns null when measurementEntryContract is absent", () => {
    expect(readMeasurementEntryContract({})).toBeNull();
  });
});

describe("display label and metric source formatting", () => {
  it("formats camelCase keys for display without changing payload keys", () => {
    expect(formatMeasurementEntryFieldLabel("obstacleCleared")).toBe("Obstacle cleared");
    expect(formatMeasurementEntryFieldLabel("safeCorridorHit")).toBe("Safe corridor hit");
    expect(formatMeasurementEntryFieldLabel("targetCarryDistance")).toBe(
      "Target carry distance",
    );
    expect(formatMeasurementEntryFieldLabel("actualCarryDistance")).toBe(
      "Actual carry distance",
    );
    expect(formatMeasurementEntryFieldLabel("totalActualCarryDistance")).toBe(
      "Total actual carry distance",
    );
    expect(formatMeasurementEntryFieldLabel("speed")).toBe("Speed");
    expect(formatMeasurementEntryFieldLabel("averageSpeed")).toBe("Average speed");
    expect(formatMeasurementEntryFieldLabel("proximityFeet")).toBe("Proximity feet");
    expect(formatMeasurementEntryFieldLabel("proximityInches")).toBe("Proximity inches");
  });

  it("maps backend metric sources for A and B", () => {
    expect(formatMeasurementMetricSource("PGA_TOUR")).toBe("PGA TOUR");
    expect(formatMeasurementMetricSource("PEAKFLOW_ASSIGNED")).toBe("PeakFlow Assigned");
  });

  it("uses formatted labels when backend fields have no separate label, keeping keys", () => {
    const contract = requireContract({
      INDIVIDUAL: {
        fields: [
          { field: "targetCarryDistance", type: "number", unit: "yd" },
          { field: "obstacleCleared", type: "boolean" },
        ],
      },
      CUMULATIVE: {
        fields: [
          { field: "attempts", type: "integer", unit: null },
          { field: "totalActualCarryDistance", type: "number", unit: "yd" },
        ],
      },
    });
    expect(contract.INDIVIDUAL.fields.map((field) => field.key)).toEqual([
      "targetCarryDistance",
      "obstacleCleared",
    ]);
    expect(contract.INDIVIDUAL.fields.map((field) => field.label)).toEqual([
      "Target carry distance",
      "Obstacle cleared",
    ]);
    const result = validateMeasurementEntryForm({
      contract,
      entryMode: "CUMULATIVE",
      attempts: [{}],
      cumulative: { attempts: "8", totalActualCarryDistance: "720" },
      notes: "",
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.valueJson).toEqual({
      entryMode: "CUMULATIVE",
      attempts: 8,
      totalActualCarryDistance: 720,
    });
  });
});

describe("groupMeasurementEntryFields", () => {
  it("groups consecutive same-label fields without renaming keys", () => {
    const contract = requireContract(proximityContract);
    const groups = groupMeasurementEntryFields(contract.INDIVIDUAL.fields);
    expect(groups).toHaveLength(1);
    expect(groups[0]?.map((field) => field.key)).toEqual(["proximityFeet", "proximityInches"]);
    expect(groups[0]?.map((field) => field.unit)).toEqual(["ft", "in"]);
  });
});

describe("exact POST payloads", () => {
  it("Club Head Speed INDIVIDUAL uses speed only", () => {
    const contract = requireContract(clubHeadSpeedContract);
    const result = validateMeasurementEntryForm({
      contract,
      entryMode: "INDIVIDUAL",
      attempts: [{ speed: "96" }, { speed: "98" }],
      cumulative: { attempts: "20", averageSpeed: "96" },
      notes: "",
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.valueJson).toEqual({
      entryMode: "INDIVIDUAL",
      attempts: [{ speed: 96 }, { speed: 98 }],
    });
    expect(Object.keys((result.valueJson.attempts as Array<Record<string, unknown>>)[0] ?? {})).toEqual(
      metadataKeys(contract, "INDIVIDUAL"),
    );
    expect(result.valueJson).not.toHaveProperty("averageSpeed");
    expect(result.valueJson).not.toHaveProperty("clubHeadSpeed");
  });

  it("Club Head Speed CUMULATIVE uses attempts and averageSpeed", () => {
    const contract = requireContract(clubHeadSpeedContract);
    const result = validateMeasurementEntryForm({
      contract,
      entryMode: "CUMULATIVE",
      attempts: [{ speed: "96" }],
      cumulative: { attempts: "20", averageSpeed: "96" },
      notes: "",
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.valueJson).toEqual({
      entryMode: "CUMULATIVE",
      attempts: 20,
      averageSpeed: 96,
    });
    expect(Object.keys(result.valueJson).filter((key) => key !== "entryMode")).toEqual(
      metadataKeys(contract, "CUMULATIVE"),
    );
    expect(result.valueJson).not.toHaveProperty("speed");
  });

  it("Proximity INDIVIDUAL uses proximityFeet and proximityInches", () => {
    const contract = requireContract(proximityContract);
    const result = validateMeasurementEntryForm({
      contract,
      entryMode: "INDIVIDUAL",
      attempts: [
        { proximityFeet: "8", proximityInches: "4" },
        { proximityFeet: "6", proximityInches: "9" },
      ],
      cumulative: {
        attempts: "10",
        averageProximityFeet: "7",
        averageProximityInches: "2",
      },
      notes: "",
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.valueJson).toEqual({
      entryMode: "INDIVIDUAL",
      attempts: [
        { proximityFeet: 8, proximityInches: 4 },
        { proximityFeet: 6, proximityInches: 9 },
      ],
    });
    expect(result.valueJson).not.toHaveProperty("averageProximityFeet");
    expect(result.valueJson).not.toHaveProperty("finalDistanceFt");
  });

  it("Proximity CUMULATIVE uses attempts and averageProximityFeet/Inches", () => {
    const contract = requireContract(proximityContract);
    const result = validateMeasurementEntryForm({
      contract,
      entryMode: "CUMULATIVE",
      attempts: [{ proximityFeet: "8", proximityInches: "4" }],
      cumulative: {
        attempts: "12",
        averageProximityFeet: "7",
        averageProximityInches: "6",
      },
      notes: "",
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.valueJson).toEqual({
      entryMode: "CUMULATIVE",
      attempts: 12,
      averageProximityFeet: 7,
      averageProximityInches: 6,
    });
    expect(result.valueJson).not.toHaveProperty("proximityFeet");
  });

  it("Scrambling INDIVIDUAL uses success boolean", () => {
    const contract = requireContract(scramblingContract);
    const result = validateMeasurementEntryForm({
      contract,
      entryMode: "INDIVIDUAL",
      attempts: [{ success: "true" }, { success: "false" }],
      cumulative: { attempts: "10", successes: "6" },
      notes: "",
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.valueJson).toEqual({
      entryMode: "INDIVIDUAL",
      attempts: [{ success: true }, { success: false }],
    });
  });

  it("Scrambling CUMULATIVE uses attempts and successes", () => {
    const contract = requireContract(scramblingContract);
    const result = validateMeasurementEntryForm({
      contract,
      entryMode: "CUMULATIVE",
      attempts: [{ success: "true" }],
      cumulative: { attempts: "10", successes: "6" },
      notes: "",
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.valueJson).toEqual({
      entryMode: "CUMULATIVE",
      attempts: 10,
      successes: 6,
    });
  });

  it("Putting % INDIVIDUAL uses puttDistance and made", () => {
    const contract = requireContract(puttingPercentContract);
    const result = validateMeasurementEntryForm({
      contract,
      entryMode: "INDIVIDUAL",
      attempts: [
        { puttDistance: "6", made: "true" },
        { puttDistance: "6", made: "false" },
      ],
      cumulative: { puttDistance: "6", attempts: "20", made: "14" },
      notes: "",
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.valueJson).toEqual({
      entryMode: "INDIVIDUAL",
      attempts: [
        { puttDistance: 6, made: true },
        { puttDistance: 6, made: false },
      ],
    });
  });

  it("Putting % CUMULATIVE uses puttDistance, attempts, and made", () => {
    const contract = requireContract(puttingPercentContract);
    const result = validateMeasurementEntryForm({
      contract,
      entryMode: "CUMULATIVE",
      attempts: [{ puttDistance: "6", made: "true" }],
      cumulative: { puttDistance: "6", attempts: "20", made: "14" },
      notes: "",
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.valueJson).toEqual({
      entryMode: "CUMULATIVE",
      puttDistance: 6,
      attempts: 20,
      made: 14,
    });
  });

  it("does not cap individual attempts by planned volume", () => {
    const contract = requireContract(clubHeadSpeedContract);
    const attempts = Array.from({ length: 7 }, () => ({ speed: "90" }));
    const result = validateMeasurementEntryForm({
      contract,
      entryMode: "INDIVIDUAL",
      attempts,
      cumulative: emptyMeasurementEntryValues(contract.CUMULATIVE.fields),
      notes: "",
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect((result.valueJson.attempts as unknown[]).length).toBe(7);
  });

  it("requires boolean Yes/No values", () => {
    const contract = requireContract(scramblingContract);
    const result = validateMeasurementEntryForm({
      contract,
      entryMode: "INDIVIDUAL",
      attempts: [{ success: "" }],
      cumulative: emptyMeasurementEntryValues(contract.CUMULATIVE.fields),
      notes: "",
    });
    expect(result.ok).toBe(false);
  });
});

const carryDistanceContract = {
  INDIVIDUAL: {
    fields: [
      {
        key: "targetCarryDistance",
        label: "Target carry distance",
        type: "NUMBER",
        unit: "yd",
      },
      {
        key: "actualCarryDistance",
        label: "Actual carry distance",
        type: "NUMBER",
        unit: "yd",
      },
    ],
  },
  CUMULATIVE: {
    fields: [
      { key: "targetCarryDistance", label: "Target carry distance", type: "NUMBER", unit: "yd" },
      { key: "attempts", label: "Attempts", type: "INTEGER" },
      {
        key: "totalActualCarryDistance",
        label: "Total actual carry distance",
        type: "NUMBER",
        unit: "yd",
      },
    ],
  },
};

const windowGateContract = {
  INDIVIDUAL: {
    fields: [{ key: "throughWindow", label: "Through window", type: "BOOLEAN" }],
  },
  CUMULATIVE: {
    fields: [
      { key: "attempts", label: "Attempts", type: "INTEGER" },
      { key: "successes", label: "Successes", type: "INTEGER" },
    ],
  },
};

const enumBooleanContract = {
  INDIVIDUAL: {
    fields: [
      {
        key: "startLie",
        label: "Start lie",
        type: "ENUM",
        options: [
          { value: "FAIRWAY", label: "Fairway" },
          { value: "ROUGH", label: "Rough" },
          { value: "BUNKER", label: "Bunker" },
        ],
      },
      { key: "success", label: "Success", type: "BOOLEAN" },
    ],
  },
  CUMULATIVE: {
    fields: [
      { key: "attempts", label: "Attempts", type: "INTEGER" },
      { key: "successes", label: "Successes", type: "INTEGER" },
    ],
  },
};

const puttDistanceFeetContract = {
  INDIVIDUAL: {
    fields: [
      {
        key: "puttDistanceFeet",
        label: "Putt distance",
        type: "NUMBER",
        unit: "ft",
      },
      { key: "made", label: "Made", type: "BOOLEAN" },
    ],
  },
  CUMULATIVE: {
    fields: [
      {
        key: "puttDistanceFeet",
        label: "Putt distance",
        type: "NUMBER",
        unit: "ft",
      },
      { key: "attempts", label: "Attempts", type: "INTEGER" },
      { key: "made", label: "Made", type: "INTEGER" },
    ],
  },
};

describe("B-exercise measurementEntryContract rendering", () => {
  it("preserves targetCarryDistance and actualCarryDistance with yd", () => {
    const contract = requireContract(carryDistanceContract);
    expect(metadataKeys(contract, "INDIVIDUAL")).toEqual([
      "targetCarryDistance",
      "actualCarryDistance",
    ]);
    expect(contract.INDIVIDUAL.fields.map((field) => field.unit)).toEqual(["yd", "yd"]);
    const result = validateMeasurementEntryForm({
      contract,
      entryMode: "INDIVIDUAL",
      attempts: [
        { targetCarryDistance: "150", actualCarryDistance: "147" },
        { targetCarryDistance: "150", actualCarryDistance: "152" },
      ],
      cumulative: emptyMeasurementEntryValues(contract.CUMULATIVE.fields),
      notes: "",
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.valueJson).toEqual({
      entryMode: "INDIVIDUAL",
      attempts: [
        { targetCarryDistance: 150, actualCarryDistance: 147 },
        { targetCarryDistance: 150, actualCarryDistance: 152 },
      ],
    });
  });

  it("preserves proximityFeet and proximityInches", () => {
    const contract = requireContract(proximityContract);
    expect(metadataKeys(contract, "INDIVIDUAL")).toEqual([
      "proximityFeet",
      "proximityInches",
    ]);
  });

  it("preserves boolean window/gate outcome", () => {
    const contract = requireContract(windowGateContract);
    const result = validateMeasurementEntryForm({
      contract,
      entryMode: "INDIVIDUAL",
      attempts: [{ throughWindow: "true" }, { throughWindow: "false" }],
      cumulative: emptyMeasurementEntryValues(contract.CUMULATIVE.fields),
      notes: "",
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.valueJson).toEqual({
      entryMode: "INDIVIDUAL",
      attempts: [{ throughWindow: true }, { throughWindow: false }],
    });
  });

  it("preserves enum + boolean contextual result using backend options", () => {
    const contract = requireContract(enumBooleanContract);
    expect(contract.INDIVIDUAL.fields[0]?.type).toBe("ENUM");
    expect(contract.INDIVIDUAL.fields[0]?.options.map((option) => option.value)).toEqual([
      "FAIRWAY",
      "ROUGH",
      "BUNKER",
    ]);
    const result = validateMeasurementEntryForm({
      contract,
      entryMode: "INDIVIDUAL",
      attempts: [
        { startLie: "FAIRWAY", success: "true" },
        { startLie: "ROUGH", success: "false" },
      ],
      cumulative: emptyMeasurementEntryValues(contract.CUMULATIVE.fields),
      notes: "",
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.valueJson).toEqual({
      entryMode: "INDIVIDUAL",
      attempts: [
        { startLie: "FAIRWAY", success: true },
        { startLie: "ROUGH", success: false },
      ],
    });
  });

  it("preserves puttDistanceFeet + made", () => {
    const contract = requireContract(puttDistanceFeetContract);
    const result = validateMeasurementEntryForm({
      contract,
      entryMode: "INDIVIDUAL",
      attempts: [
        { puttDistanceFeet: "8", made: "true" },
        { puttDistanceFeet: "8", made: "false" },
      ],
      cumulative: emptyMeasurementEntryValues(contract.CUMULATIVE.fields),
      notes: "",
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.valueJson).toEqual({
      entryMode: "INDIVIDUAL",
      attempts: [
        { puttDistanceFeet: 8, made: true },
        { puttDistanceFeet: 8, made: false },
      ],
    });
  });

  it("submits raw CUMULATIVE values without frontend calculations", () => {
    const contract = requireContract(carryDistanceContract);
    const result = validateMeasurementEntryForm({
      contract,
      entryMode: "CUMULATIVE",
      attempts: [{ targetCarryDistance: "150", actualCarryDistance: "147" }],
      cumulative: {
        targetCarryDistance: "150",
        attempts: "24",
        totalActualCarryDistance: "3556.8",
      },
      notes: "Range",
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.valueJson).toEqual({
      entryMode: "CUMULATIVE",
      targetCarryDistance: 150,
      attempts: 24,
      totalActualCarryDistance: 3556.8,
      notes: "Range",
    });
    expect(result.valueJson).not.toHaveProperty("averageActualCarryDistance");
    expect(result.valueJson).not.toHaveProperty("actualCarryDistance");
  });

  it("does not cap Individual attempt rows", () => {
    const contract = requireContract(windowGateContract);
    const attempts = Array.from({ length: 11 }, (_, index) => ({
      throughWindow: index % 2 === 0 ? "true" : "false",
    }));
    const result = validateMeasurementEntryForm({
      contract,
      entryMode: "INDIVIDUAL",
      attempts,
      cumulative: emptyMeasurementEntryValues(contract.CUMULATIVE.fields),
      notes: "",
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect((result.valueJson.attempts as unknown[]).length).toBe(11);
  });

  it("returns null instead of dropping ENUM fields when options are missing", () => {
    expect(
      readMeasurementEntryContract({
        measurementEntryContract: {
          INDIVIDUAL: {
            fields: [{ key: "startLie", label: "Start lie", type: "ENUM" }],
          },
          CUMULATIVE: {
            fields: [{ key: "attempts", label: "Attempts", type: "INTEGER" }],
          },
        },
      }),
    ).toBeNull();
  });
});

describe("B CUMULATIVE backend contract key passthrough", () => {
  function submitCumulative(
    rawContract: Record<string, unknown>,
    cumulative: Record<string, string>,
  ) {
    const contract = requireContract(rawContract);
    const result = validateMeasurementEntryForm({
      contract,
      entryMode: "CUMULATIVE",
      attempts: [{}],
      cumulative,
      notes: "",
    });
    expect(result.ok).toBe(true);
    if (!result.ok) {
      throw new Error(result.error);
    }
    expect(Object.keys(result.valueJson).filter((key) => key !== "entryMode")).toEqual(
      metadataKeys(contract, "CUMULATIVE"),
    );
    return result.valueJson;
  }

  it("Carry Distance Error uses targetCarryDistance, attempts, totalActualCarryDistance", () => {
    const payload = submitCumulative(
      {
        INDIVIDUAL: {
          fields: [
            { field: "targetCarryDistance", type: "number", unit: "yd" },
            { field: "actualCarryDistance", type: "number", unit: "yd" },
          ],
        },
        CUMULATIVE: {
          fields: [
            { field: "targetCarryDistance", type: "number", unit: "yd" },
            { field: "attempts", type: "integer", unit: null },
            { field: "totalActualCarryDistance", type: "number", unit: "yd", aggregate: "total" },
          ],
        },
      },
      {
        targetCarryDistance: "100",
        attempts: "2",
        totalActualCarryDistance: "180",
      },
    );
    expect(payload).toEqual({
      entryMode: "CUMULATIVE",
      targetCarryDistance: 100,
      attempts: 2,
      totalActualCarryDistance: 180,
    });
    expect(payload).not.toHaveProperty("averageActualCarryDistance");
  });

  it("Proximity uses attempts, totalProximityFeet, totalProximityInches", () => {
    expect(
      submitCumulative(
        {
          INDIVIDUAL: {
            fields: [
              { field: "proximityFeet", type: "number", unit: "ft" },
              { field: "proximityInches", type: "number", unit: "in" },
            ],
          },
          CUMULATIVE: {
            fields: [
              { field: "attempts", type: "integer", unit: null },
              { field: "totalProximityFeet", type: "number", unit: "ft", aggregate: "total" },
              { field: "totalProximityInches", type: "number", unit: "in", aggregate: "total" },
            ],
          },
        },
        { attempts: "4", totalProximityFeet: "12", totalProximityInches: "8" },
      ),
    ).toEqual({
      entryMode: "CUMULATIVE",
      attempts: 4,
      totalProximityFeet: 12,
      totalProximityInches: 8,
    });
  });

  it("enum + boolean context uses context enum plus attempts and successes", () => {
    expect(
      submitCumulative(
        {
          INDIVIDUAL: {
            fields: [
              { field: "lieType", type: "enum", values: ["CLEAN", "LIGHT_ROUGH"] },
              { field: "playableContact", type: "boolean" },
            ],
          },
          CUMULATIVE: {
            fields: [
              { field: "lieType", type: "enum", values: ["CLEAN", "LIGHT_ROUGH"] },
              { field: "attempts", type: "integer", unit: null },
              { field: "successes", type: "integer", unit: null },
            ],
          },
        },
        { lieType: "CLEAN", attempts: "10", successes: "7" },
      ),
    ).toEqual({
      entryMode: "CUMULATIVE",
      lieType: "CLEAN",
      attempts: 10,
      successes: 7,
    });
  });

  it("Putt Outcome uses puttDistanceFeet, attempts, made", () => {
    expect(
      submitCumulative(
        {
          INDIVIDUAL: {
            fields: [
              { field: "puttDistanceFeet", type: "number", unit: "ft" },
              { field: "made", type: "boolean" },
            ],
          },
          CUMULATIVE: {
            fields: [
              { field: "puttDistanceFeet", type: "number", unit: "ft" },
              { field: "attempts", type: "integer", unit: null },
              { field: "made", type: "integer", unit: null },
            ],
          },
        },
        { puttDistanceFeet: "8", attempts: "20", made: "14" },
      ),
    ).toEqual({
      entryMode: "CUMULATIVE",
      puttDistanceFeet: 8,
      attempts: 20,
      made: 14,
    });
  });

  it("Carry Calibration uses club, swingLength, attempts, totalCarryDistance", () => {
    expect(
      submitCumulative(
        {
          INDIVIDUAL: {
            fields: [
              { field: "club", type: "string" },
              { field: "swingLength", type: "string" },
              { field: "actualCarryDistance", type: "number", unit: "yd" },
            ],
          },
          CUMULATIVE: {
            fields: [
              { field: "club", type: "string" },
              { field: "swingLength", type: "string" },
              { field: "attempts", type: "integer", unit: null },
              { field: "totalCarryDistance", type: "number", unit: "yd", aggregate: "total" },
            ],
          },
        },
        {
          club: "PW",
          swingLength: "HALF",
          attempts: "12",
          totalCarryDistance: "540",
        },
      ),
    ).toEqual({
      entryMode: "CUMULATIVE",
      club: "PW",
      swingLength: "HALF",
      attempts: 12,
      totalCarryDistance: 540,
    });
  });
});
