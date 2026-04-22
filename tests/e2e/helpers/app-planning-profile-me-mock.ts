import type { Page, Route } from "@playwright/test";

function matchesPlanningProfileMe(url: string): boolean {
  try {
    return /\/entities\/[^/]+\/athlete-planning-profile\/me$/i.test(
      new URL(url).pathname,
    );
  } catch {
    return false;
  }
}

function deepMergeGroupPayload(
  base: Record<string, unknown>,
  patch: Record<string, unknown>,
): Record<string, unknown> {
  const out: Record<string, unknown> = { ...base };
  for (const [k, v] of Object.entries(patch)) {
    if (
      v !== null &&
      typeof v === "object" &&
      !Array.isArray(v) &&
      typeof out[k] === "object" &&
      out[k] !== null &&
      !Array.isArray(out[k])
    ) {
      out[k] = deepMergeGroupPayload(
        out[k] as Record<string, unknown>,
        v as Record<string, unknown>,
      );
    } else {
      out[k] = v;
    }
  }
  return out;
}

/**
 * After install, call `page.reload()` so the first GET seeds from the real API;
 * later GET/PATCH for `/entities/:id/athlete-planning-profile/me` are in-memory — PATCH does not hit the DB.
 * POST (create) is passed through so `ensureAthletePlanningProfileExists` can still create once when needed.
 */
export async function installAthletePlanningProfileMeGetPatchMock(
  page: Page,
): Promise<void> {
  let seeded = false;
  let envelope: Record<string, unknown> | null = null;
  let dataLayer: Record<string, unknown> | null = null;

  await page.route(
    (url: URL) => matchesPlanningProfileMe(url.toString()),
    async (route: Route) => {
      const req = route.request();
      const method = req.method();

      if (method === "GET") {
        if (!seeded) {
          const response = await route.fetch();
          const text = await response.text();
          envelope = JSON.parse(text) as Record<string, unknown>;
          if (
            envelope.success === true &&
            envelope.data !== null &&
            typeof envelope.data === "object"
          ) {
            dataLayer = {
              ...(envelope.data as Record<string, unknown>),
            };
          } else {
            dataLayer = { ...envelope };
          }
          seeded = true;
          await route.fulfill({ response });
          return;
        }
        const payload =
          envelope &&
          envelope.success === true &&
          dataLayer !== null &&
          "data" in envelope
            ? { ...envelope, data: dataLayer }
            : dataLayer;
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(payload),
        });
        return;
      }

      if (method === "PATCH") {
        const patch = JSON.parse(req.postData() ?? "{}") as Record<string, unknown>;
        if (dataLayer === null) {
          dataLayer = {};
        }
        dataLayer = deepMergeGroupPayload(dataLayer, patch);
        if (envelope && envelope.success === true && "data" in envelope) {
          envelope = { ...envelope, data: dataLayer };
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify(envelope),
          });
          return;
        }
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ success: true, data: dataLayer }),
        });
        return;
      }

      await route.continue();
    },
  );
}
