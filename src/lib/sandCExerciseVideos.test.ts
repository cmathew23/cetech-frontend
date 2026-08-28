import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import {
  sandCDemonstrationVideosFromUnknown,
  youtubeEmbedSrcFromVideoId,
  youtubeVideoIdFromUrl,
} from "@/lib/sandCExerciseVideos";

const WATCH_1 = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";
const SHORT_2 = "https://youtu.be/abcdefghijk";
const EMBED_3 = "https://www.youtube.com/embed/lmnopqrstuv";

describe("sandCDemonstrationVideosFromUnknown", () => {
  it("labels 3 URLs as Video 1, Video 2, and Video 3", () => {
    const clips = sandCDemonstrationVideosFromUnknown([WATCH_1, SHORT_2, EMBED_3]);
    expect(clips.map((clip) => clip.label)).toEqual(["Video 1", "Video 2", "Video 3"]);
    expect(clips[0]?.id).toBe("dQw4w9WgXcQ");
    expect(clips[1]?.id).toBe("abcdefghijk");
    expect(clips[2]?.id).toBe("lmnopqrstuv");
    expect(clips[0]?.embedSrc).toBe(youtubeEmbedSrcFromVideoId("dQw4w9WgXcQ"));
  });

  it("shows only available links when fewer than 3 URLs are present", () => {
    expect(sandCDemonstrationVideosFromUnknown([WATCH_1]).map((clip) => clip.label)).toEqual([
      "Video 1",
    ]);
    expect(
      sandCDemonstrationVideosFromUnknown([WATCH_1, SHORT_2]).map((clip) => clip.label),
    ).toEqual(["Video 1", "Video 2"]);
  });

  it("returns no clips when videos are missing or empty", () => {
    expect(sandCDemonstrationVideosFromUnknown(undefined)).toEqual([]);
    expect(sandCDemonstrationVideosFromUnknown([])).toEqual([]);
  });

  it("rejects invalid URLs", () => {
    expect(
      sandCDemonstrationVideosFromUnknown([
        "not-a-url",
        "https://example.com/watch?v=dQw4w9WgXcQ",
        "https://vimeo.com/123456789",
        WATCH_1,
      ]).map((clip) => clip.label),
    ).toEqual(["Video 1"]);
  });

  it("keeps at most 3 videos", () => {
    const clips = sandCDemonstrationVideosFromUnknown([
      WATCH_1,
      SHORT_2,
      EMBED_3,
      "https://www.youtube.com/watch?v=zzzzzzzzzzz",
    ]);
    expect(clips).toHaveLength(3);
    expect(clips.map((clip) => clip.label)).toEqual(["Video 1", "Video 2", "Video 3"]);
    expect(clips.map((clip) => clip.id)).toEqual([
      "dQw4w9WgXcQ",
      "abcdefghijk",
      "lmnopqrstuv",
    ]);
  });

  it("maps the clicked index to that video's embed, not another clip", () => {
    const clips = sandCDemonstrationVideosFromUnknown([WATCH_1, SHORT_2, EMBED_3]);
    expect(clips[1]?.embedSrc).toBe(youtubeEmbedSrcFromVideoId("abcdefghijk"));
    expect(clips[1]?.embedSrc).not.toBe(clips[0]?.embedSrc);
    expect(clips[1]?.embedSrc).not.toBe(clips[2]?.embedSrc);
  });
});

describe("youtubeVideoIdFromUrl", () => {
  it("accepts watch, short, embed, and shorts hosts only", () => {
    expect(youtubeVideoIdFromUrl(WATCH_1)).toBe("dQw4w9WgXcQ");
    expect(youtubeVideoIdFromUrl(SHORT_2)).toBe("abcdefghijk");
    expect(youtubeVideoIdFromUrl("https://www.youtube.com/shorts/dQw4w9WgXcQ")).toBe(
      "dQw4w9WgXcQ",
    );
    expect(youtubeVideoIdFromUrl("https://vimeo.com/123456789")).toBeNull();
  });
});

describe("SandCExerciseDemonstrationVideos modal wiring", () => {
  const source = readFileSync(
    fileURLToPath(
      new URL("../components/dashboard/shared/SandCExerciseDemonstrationVideos.tsx", import.meta.url),
    ),
    "utf8",
  );

  it("reuses Modal, embeds the selected clip, and unmounts the iframe on close", () => {
    expect(source).toContain('from "@/components/ui/Modal"');
    expect(source).toContain("onClick={() => setOpenIndex(index)}");
    expect(source).toContain("openClip.embedSrc");
    expect(source).toContain('aria-label="Close"');
    expect(source).toContain("onClick={() => setOpenIndex(null)}");
    expect(source).toContain("aspect-video");
    expect(source).toContain("max-w-[min(100%,48rem)]");
    expect(source).toContain("{openClip ? (");
    expect(source).toContain("Demonstration Videos");
    expect(source).toContain("if (clips.length === 0) return null");
  });
});

describe("coach S&C exercise render reuse", () => {
  const source = readFileSync(
    fileURLToPath(
      new URL(
        "../components/dashboard/coach/CoachAthletePlanningProfileView.tsx",
        import.meta.url,
      ),
    ),
    "utf8",
  );

  it("reuses the shared demonstration videos component on S&C exercise surfaces only", () => {
    expect(source).toContain("showSandCVideos: domain === \"S_AND_C\"");
    expect(source).toContain("{domain === \"S_AND_C\" ? (");
    expect(source).toContain("{latestDraftDisplayDomain === \"S_AND_C\" ? (");
    expect(source).toContain("{persistedPlanDisplayDomain === \"S_AND_C\" ? (");
    expect(source).toContain("{detail.generationDomain === \"S_AND_C\" ? (");
    expect(source).toContain("renderAssistantSandCItems");
    expect(source).toContain("<SandCExerciseDemonstrationVideos videos={item.videos} />");
  });
});
