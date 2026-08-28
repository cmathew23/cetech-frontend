export type SandCDemonstrationVideo = {
  id: string;
  label: string;
  embedSrc: string;
};

const YOUTUBE_VIDEO_ID = /^[A-Za-z0-9_-]{11}$/;
const MAX_DEMONSTRATION_VIDEOS = 3;

function isAllowedYoutubeHost(hostname: string): boolean {
  const host = hostname.replace(/^www\./, "").toLowerCase();
  return (
    host === "youtube.com" ||
    host === "m.youtube.com" ||
    host === "youtu.be" ||
    host === "youtube-nocookie.com"
  );
}

export function youtubeVideoIdFromUrl(value: string): string | null {
  const trimmed = value.trim();
  if (trimmed === "") return null;
  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return null;
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return null;
  if (!isAllowedYoutubeHost(url.hostname)) return null;

  if (url.hostname.replace(/^www\./, "").toLowerCase() === "youtu.be") {
    const id = url.pathname.split("/").filter(Boolean)[0] ?? "";
    return YOUTUBE_VIDEO_ID.test(id) ? id : null;
  }

  const fromQuery = url.searchParams.get("v");
  if (fromQuery && YOUTUBE_VIDEO_ID.test(fromQuery)) return fromQuery;

  const parts = url.pathname.split("/").filter(Boolean);
  if (
    (parts[0] === "embed" || parts[0] === "shorts" || parts[0] === "live") &&
    typeof parts[1] === "string" &&
    YOUTUBE_VIDEO_ID.test(parts[1])
  ) {
    return parts[1];
  }
  return null;
}

export function youtubeEmbedSrcFromVideoId(id: string): string {
  return `https://www.youtube-nocookie.com/embed/${id}`;
}

export function sandCDemonstrationVideosFromUnknown(
  value: unknown,
): SandCDemonstrationVideo[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  const clips: SandCDemonstrationVideo[] = [];
  for (const entry of value) {
    if (typeof entry !== "string") continue;
    const id = youtubeVideoIdFromUrl(entry);
    if (id === null || seen.has(id)) continue;
    seen.add(id);
    clips.push({
      id,
      label: `Video ${clips.length + 1}`,
      embedSrc: youtubeEmbedSrcFromVideoId(id),
    });
    if (clips.length >= MAX_DEMONSTRATION_VIDEOS) break;
  }
  return clips;
}
