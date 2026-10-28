"use client";

import { useEffect, useRef, useState } from "react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/layout/PageHeader";
import { PMI_API_BASE, pmiUrl, resolvePmiUrl } from "@/config/pmiBackend";
import { designSystem } from "@/config/design-system";
import { cn } from "@/lib/utils";

const SPEEDS = [1, 0.5, 0.25];

const TABS = [
  { id: "body", label: "Body Movement Modeling" },
  { id: "club", label: "Club Tracking" },
];

const BODY_SECTIONS = [
  {
    title: "Address",
    phase: "Address / Setup",
    metrics: [
      { label: "Spine Tilt", key: "spine_tilt_3d", format: "degrees", description: "Torso inclination relative to vertical." },
      { label: "Left Knee Angle", key: "left_knee_angle", format: "degrees", description: "Bend angle of the left knee at this phase." },
      { label: "Right Knee Angle", key: "right_knee_angle", format: "degrees", description: "Bend angle of the right knee at this phase." },
      { label: "Left Elbow Angle", key: "left_elbow_angle", format: "degrees", description: "Extension angle of the left elbow at this phase." },
      { label: "Right Elbow Angle", key: "right_elbow_angle", format: "degrees", description: "Extension angle of the right elbow at this phase." },
    ],
  },
  {
    title: "Top of Backswing",
    phase: "Top of Backswing",
    metrics: [
      { label: "X-Factor", key: "x_factor_3d", format: "degrees", description: "Difference between shoulder and pelvis rotation." },
      { label: "Shoulder Rotation", key: "shoulder_rot_3d", format: "degrees", description: "Shoulder orientation in the 3D coordinate system; sign indicates direction." },
      { label: "Pelvis Rotation", key: "hip_rot_3d", format: "degrees", description: "Pelvis orientation in the 3D coordinate system; sign indicates direction." },
    ],
  },
  {
    title: "Impact",
    phase: "Impact",
    metrics: [
      { label: "Spine Tilt", key: "spine_tilt_3d", format: "degrees", description: "Torso inclination relative to vertical." },
    ],
    summary: [
      { label: "Head Movement", key: "head_movement_pct", format: "percent", description: "Maximum head displacement from the address position." },
    ],
  },
  {
    title: "Finish",
    phase: "Finish",
    metrics: [
      { label: "Pelvis Orientation at Finish", key: "hip_rot_3d", format: "degrees", description: "Pelvis orientation at the finish position." },
    ],
    summary: [
      { label: "Address-to-Finish Pelvic Rotation", key: "finish_pelvic_rotation_deg", format: "degrees", description: "Total pelvic rotation from address to finish." },
    ],
  },
];

const panelClass = cn(
  designSystem.card.root,
  designSystem.card.padding.default,
  "hover:translate-y-0 hover:shadow-md",
);

function isClearlyNonMp4(file) {
  const name = (file.name || "").toLowerCase();
  const extension = name.match(/\.[^.]+$/)?.[0] || "";
  if (extension) return extension !== ".mp4";
  const type = (file.type || "").toLowerCase();
  if (!type) return false;
  return type !== "video/mp4" && type !== "application/mp4";
}

async function readJson(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function errorMessage(data, status) {
  const detail = data?.detail;
  if (typeof detail === "string" && detail.trim()) return detail;
  return `Server error ${status}`;
}

function isMissing(value) {
  return value === null || value === undefined || (typeof value === "number" && Number.isNaN(value));
}

function formatValue(value, format) {
  if (isMissing(value)) return null;
  const number = Number(value);
  if (Number.isNaN(number)) return null;
  if (format === "degrees") return `${number.toFixed(1)}°`;
  if (format === "percent") return `${number.toFixed(2)}%`;
  if (format === "speed") return number.toFixed(4);
  if (format === "percentNumber") return number.toFixed(2);
  return null;
}

function frameForPhase(frames, phase) {
  return frames.find((frame) => frame?.phase === phase) ?? null;
}

function resultDownloadUrl(playbackUrl) {
  if (!playbackUrl) return null;
  let filename;
  try {
    const pathname = new URL(playbackUrl, PMI_API_BASE).pathname;
    filename = decodeURIComponent(pathname.split("/").pop() || "");
  } catch {
    return null;
  }
  if (!filename.toLowerCase().endsWith(".mp4")) return null;
  if (filename.includes("/") || filename.includes("\\")) return null;
  return pmiUrl(`/download/${encodeURIComponent(filename)}`);
}

function MetricCard({ label, value, unit, description, hideValue = false }) {
  const available = !hideValue && value !== null && value !== undefined;
  return (
    <article className="rounded-2xl border border-border/70 bg-card p-4 shadow-sm">
      <p className="text-sm font-medium text-textSecondary">{label}</p>
      {hideValue ? null : (
        <p className={available ? "mt-2 text-2xl font-medium tracking-tight text-textPrimary" : "mt-2 text-sm text-textMuted"}>
          {available ? value : "Not available"}
        </p>
      )}
      {available && unit ? <p className="mt-1 text-xs text-textSecondary">{unit}</p> : null}
      {description ? <p className="mt-1 text-xs text-textSecondary">{description}</p> : null}
    </article>
  );
}

function BodyMetrics({ frames, summary }) {
  return (
    <div className="flex flex-col gap-6">
      {BODY_SECTIONS.map((section) => {
        const metrics = frameForPhase(frames, section.phase)?.metrics ?? null;
        const summaryCards = (section.summary ?? []).filter((card) =>
          Object.prototype.hasOwnProperty.call(summary, card.key),
        );
        return (
          <section key={section.phase}>
            <h3 className="mb-3 text-lg font-semibold text-textPrimary">{section.title}</h3>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-3">
              {section.metrics.map((card) => (
                <MetricCard
                  key={card.label}
                  label={card.label}
                  description={card.description}
                  value={formatValue(metrics?.[card.key], card.format)}
                />
              ))}
              {summaryCards.map((card) => (
                <MetricCard
                  key={card.key}
                  label={card.label}
                  description={card.description}
                  value={formatValue(summary[card.key], card.format)}
                />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function ClubMetrics({ club }) {
  const tracked = club?.available === true;
  return (
    <div className="flex flex-col gap-6">
      <section>
        <h3 className="mb-3 text-lg font-semibold text-textPrimary">Clubhead Path</h3>
        <MetricCard
          label="Clubhead Path"
          value={null}
          hideValue={tracked}
          description="Tracked clubhead trajectory through the analyzed swing."
        />
      </section>
      <section>
        <h3 className="mb-3 text-lg font-semibold text-textPrimary">Peak Clubhead Speed</h3>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-3">
          <MetricCard
            label="Peak Clubhead Speed"
            value={formatValue(club?.peak_normalized_speed_per_s, "speed")}
            unit="frame-widths/s"
            description="Peak image-space clubhead movement speed."
          />
        </div>
      </section>
      <section>
        <h3 className="mb-3 text-lg font-semibold text-textPrimary">2D Clubhead Path Deviation</h3>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-3">
          <MetricCard
            label="2D Clubhead Path Deviation"
            value={formatValue(club?.path_deviation_pct_frame_width, "percentNumber")}
            unit="% of frame width"
            description="How much the tracked clubhead path varies from its best-fit 2D path."
          />
        </div>
      </section>
    </div>
  );
}

function Player({ src }) {
  const videoRef = useRef(null);
  const downloadHref = resultDownloadUrl(src);
  const [playing, setPlaying] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [playbackError, setPlaybackError] = useState(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.playbackRate = playbackRate;
  }, [playbackRate]);

  function togglePlay() {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play().catch(() => {
        setPlaybackError("The analyzed video could not be played.");
      });
    } else {
      video.pause();
    }
  }

  function toggleFullscreen() {
    const video = videoRef.current;
    if (!video) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      video.requestFullscreen?.();
    }
  }

  return (
    <div className={cn(designSystem.card.root, "overflow-hidden p-0 hover:translate-y-0 hover:shadow-md")}>
      <video
        ref={videoRef}
        className="block max-h-[640px] w-full bg-[#0B0F12]"
        src={src}
        controls
        playsInline
        preload="metadata"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onError={() => setPlaybackError("The analyzed video could not be played.")}
      />
      {playbackError ? (
        <p className="border-t border-danger/30 bg-danger/10 px-4 py-2.5 text-sm text-danger" role="alert">
          {playbackError}
        </p>
      ) : null}
      <div className="flex flex-wrap items-center gap-2 border-t border-border px-4 py-3">
        <Button type="button" variant="secondary" onClick={togglePlay}>
          {playing ? "Pause" : "Play"}
        </Button>
        <div className="inline-flex gap-1" role="group" aria-label="Playback speed">
          {SPEEDS.map((rate) => (
            <button
              key={rate}
              type="button"
              className={cn(
                "rounded-lg px-3 py-2 text-sm font-medium",
                playbackRate === rate ? "bg-primary text-white" : "text-textSecondary",
              )}
              onClick={() => setPlaybackRate(rate)}
              aria-pressed={playbackRate === rate}
            >
              {rate}x
            </button>
          ))}
        </div>
        <Button type="button" variant="secondary" onClick={toggleFullscreen}>
          Fullscreen
        </Button>
        {downloadHref ? (
          <a className={cn(designSystem.button.base, designSystem.button.secondary)} href={downloadHref}>
            Download Video
          </a>
        ) : (
          <Button type="button" variant="secondary" disabled>
            Download Video
          </Button>
        )}
      </div>
    </div>
  );
}

function AnalyzedVideo({ src }) {
  if (!src) {
    return (
      <div className={cn(panelClass, "text-center text-sm text-textSecondary")} role="status">
        Analyzed video is not available.
      </div>
    );
  }
  return <Player key={src} src={src} />;
}

export function AnalysisResults({ bodyAnalysis, clubAnalysis, onReset, initialTab = "body" }) {
  const hasBody = Boolean(bodyAnalysis);
  const hasClub = Boolean(clubAnalysis);
  const resultsRef = useRef(null);
  const [tab, setTab] = useState(initialTab);
  const active = hasBody && hasClub ? tab : hasBody ? "body" : "club";

  useEffect(() => {
    resultsRef.current?.scrollIntoView?.({ block: "start" });
  }, [bodyAnalysis, clubAnalysis]);
  const frames = Array.isArray(bodyAnalysis?.frames) ? bodyAnalysis.frames : [];
  const summary = bodyAnalysis?.metrics_summary && typeof bodyAnalysis.metrics_summary === "object"
    ? bodyAnalysis.metrics_summary
    : {};
  const videoPath = active === "body" ? bodyAnalysis?.overlay_video_url : clubAnalysis?.swingtrace_video_url;
  const videoSrc = resolvePmiUrl(videoPath);

  return (
    <div ref={resultsRef} className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" variant="secondary" onClick={onReset}>
          New Analysis
        </Button>
        <Button type="button" variant="secondary" disabled aria-describedby="share-unavailable">
          Share with Skills Coach
        </Button>
        <span id="share-unavailable" className="sr-only">
          Coach sharing is not available yet.
        </span>
      </div>

      {hasBody && hasClub ? (
        <div className="flex overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm" role="tablist" aria-label="Analysis views">
          {TABS.map((item) => {
            const selected = tab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                role="tab"
                id={`tab-${item.id}`}
                aria-selected={selected}
                aria-controls={`panel-${item.id}`}
                className={cn(
                  "min-h-11 flex-1 border-b-4 px-3 py-2 text-sm font-medium",
                  selected ? "border-primary font-semibold" : "border-transparent",
                )}
                onClick={() => setTab(item.id)}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      ) : null}

      <div role="tabpanel" id={`panel-${active}`} aria-labelledby={hasBody && hasClub ? `tab-${active}` : undefined} className="flex flex-col gap-6">
        <AnalyzedVideo src={videoSrc} />
        {active === "body" ? (
          <BodyMetrics frames={frames} summary={summary} />
        ) : (
          <ClubMetrics club={clubAnalysis?.swingtrace_club_metrics ?? null} />
        )}
      </div>
    </div>
  );
}

function VideoUpload({
  title,
  description,
  dropLabel,
  buttonLabel,
  guidance,
  viewNote,
  phase,
  error,
  onAnalyze,
}) {
  const inputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);
  const [file, setFile] = useState(null);
  const [fileError, setFileError] = useState(null);
  const busy = phase === "analyzing";

  function handleFile(nextFile) {
    if (!nextFile) return;
    if (isClearlyNonMp4(nextFile)) {
      setFile(null);
      setFileError("Please choose an MP4 video.");
      return;
    }
    setFileError(null);
    setFile(nextFile);
  }

  return (
    <section className={cn(panelClass, "space-y-4")} aria-busy={busy}>
      <div className={designSystem.card.accent} />
      <h3 className={designSystem.card.header.title}>{title}</h3>
      <p className={designSystem.card.header.subtitle}>{description}</p>
      <div
        className={cn(
          "flex cursor-pointer flex-col items-center gap-2 rounded-xl border border-dashed border-border bg-bg px-5 py-10 text-center hover:border-primary hover:bg-primaryLight",
          dragOver && "border-primary bg-primaryLight",
        )}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          handleFile(e.dataTransfer.files[0]);
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept="video/mp4,.mp4"
          className="hidden"
          onChange={(e) => handleFile(e.target.files[0])}
        />
        <p className="text-base font-semibold text-textPrimary">{file ? file.name : dropLabel}</p>
        <p className="text-sm text-textSecondary">or click to browse — MP4 up to 100 MB</p>
      </div>
      {viewNote}
      {guidance.map((paragraph) => (
        <p key={paragraph} className="text-sm text-textSecondary">{paragraph}</p>
      ))}
      {fileError ? <p className="text-sm text-danger" role="alert">{fileError}</p> : null}
      {busy ? (
        <p className="flex items-center gap-2 text-base font-medium text-primaryDark">
          <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-primaryLight border-t-primary" aria-hidden="true" />
          Analyzing...
        </p>
      ) : null}
      {phase === "ready" ? <p className="text-base font-semibold text-textPrimary">{title} — Completed</p> : null}
      {error ? <Alert variant="danger">{error}</Alert> : null}
      <Button type="button" variant="primary" disabled={!file || busy} onClick={() => onAnalyze(file)}>
        {buttonLabel}
      </Button>
    </section>
  );
}

const BODY_GUIDANCE = [
  "Clear full-body view recommended. Keep the camera stationary where practical.",
  "For best results, position the camera far enough away to capture the athlete’s full body, the ball, and the complete club swing throughout the movement.",
  "Body Movement Analysis supports both Back / Down-the-Line and Side / Face-On views.",
  "For best results, upload an MP4 recorded at 120 fps. Minimum supported frame rate: 29 fps.",
];

const CLUB_GUIDANCE = [
  "For Club Tracking, record the golfer from a Back / Down-the-Line camera position.",
  "Clear full-body view recommended. Keep the camera stationary where practical.",
  "For best results, position the camera far enough away to capture the athlete’s full body, the ball, and the complete club swing throughout the movement.",
  "Club Tracking currently supports Back / Down-the-Line videos only.",
  "For best results, upload an MP4 recorded at 120 fps. Minimum supported frame rate: 29 fps.",
];

async function postVideo(path, file) {
  const form = new FormData();
  form.append("video", file);
  const response = await fetch(pmiUrl(path), { method: "POST", body: form });
  const data = await readJson(response);
  if (!response.ok) throw new Error(errorMessage(data, response.status));
  return data;
}

export function PeakFlowSwingPageContent() {
  const bodyRequestRef = useRef(0);
  const clubRequestRef = useRef(0);
  const bodyInFlightRef = useRef(false);
  const clubInFlightRef = useRef(false);
  const [resetToken, setResetToken] = useState(0);
  const [bodyPhase, setBodyPhase] = useState("idle");
  const [clubPhase, setClubPhase] = useState("idle");
  const [bodyAnalysis, setBodyAnalysis] = useState(null);
  const [clubAnalysis, setClubAnalysis] = useState(null);
  const [bodyError, setBodyError] = useState(null);
  const [clubError, setClubError] = useState(null);

  function handleReset() {
    bodyRequestRef.current += 1;
    clubRequestRef.current += 1;
    bodyInFlightRef.current = false;
    clubInFlightRef.current = false;
    setBodyPhase("idle");
    setClubPhase("idle");
    setBodyAnalysis(null);
    setClubAnalysis(null);
    setBodyError(null);
    setClubError(null);
    setResetToken((token) => token + 1);
  }

  async function handleAnalyzeBody(file) {
    if (bodyInFlightRef.current) return;
    bodyInFlightRef.current = true;
    const requestId = bodyRequestRef.current + 1;
    bodyRequestRef.current = requestId;
    setBodyError(null);
    setBodyAnalysis(null);
    setBodyPhase("analyzing");
    try {
      const data = await postVideo("/analyze/body", file);
      if (bodyRequestRef.current !== requestId) return;
      if (!data?.analysis) throw new Error("The body analysis response was incomplete.");
      setBodyAnalysis(data.analysis);
      setBodyPhase("ready");
      bodyInFlightRef.current = false;
    } catch (err) {
      if (bodyRequestRef.current !== requestId) return;
      setBodyError(err.message);
      setBodyPhase("error");
      bodyInFlightRef.current = false;
    }
  }

  async function handleAnalyzeClub(file) {
    if (clubInFlightRef.current) return;
    clubInFlightRef.current = true;
    const requestId = clubRequestRef.current + 1;
    clubRequestRef.current = requestId;
    setClubError(null);
    setClubAnalysis(null);
    setClubPhase("analyzing");
    try {
      const data = await postVideo("/analyze/club/upload", file);
      if (clubRequestRef.current !== requestId) return;
      if (!data) throw new Error("The club analysis response was incomplete.");
      setClubAnalysis(data);
      setClubPhase("ready");
      clubInFlightRef.current = false;
    } catch (err) {
      if (clubRequestRef.current !== requestId) return;
      setClubError(err.message);
      setClubPhase("error");
      clubInFlightRef.current = false;
    }
  }

  return (
    <div className="flex w-full min-w-0 flex-col gap-4">
      <PageHeader
        title="PeakFlow Swing"
        subtitle="AI-assisted golf movement analysis"
        trailing={
          <p className="text-sm text-textSecondary">
            Upload a golf swing to review body movement and club tracking.
          </p>
        }
      />

      <VideoUpload
        key={`body-${resetToken}`}
        title="Body Movement Analysis"
        description="Upload a golf swing video to analyze body movement and biomechanics."
        dropLabel="Drop a Body Movement video here"
        buttonLabel="Analyze Body Movement"
        guidance={BODY_GUIDANCE}
        phase={bodyPhase}
        error={bodyError}
        onAnalyze={handleAnalyzeBody}
        viewNote={
          <ul className="space-y-1 text-sm font-semibold text-primaryDark">
            <li>✓ Back / Down-the-Line View</li>
            <li>✓ Side / Face-On View</li>
          </ul>
        }
      />
      <VideoUpload
        key={`club-${resetToken}`}
        title="Club Tracking"
        description="Upload a golf swing video to track club movement through the swing."
        dropLabel="Drop a Club Tracking video here"
        buttonLabel="Analyze Club Tracking"
        guidance={CLUB_GUIDANCE}
        phase={clubPhase}
        error={clubError}
        onAnalyze={handleAnalyzeClub}
        viewNote={
          <p className="rounded-lg border border-primary/40 bg-primaryLight px-3 py-2 text-sm font-semibold text-primaryDark">
            REQUIRED VIEW: Back / Down-the-Line View
          </p>
        }
      />

      {bodyAnalysis || clubAnalysis ? (
        <AnalysisResults
          bodyAnalysis={bodyAnalysis}
          clubAnalysis={clubAnalysis}
          onReset={handleReset}
        />
      ) : null}
    </div>
  );
}
