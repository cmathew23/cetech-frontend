"use client";

import { Modal } from "@/components/ui/Modal";
import { sandCDemonstrationVideosFromUnknown } from "@/lib/sandCExerciseVideos";
import { X } from "lucide-react";
import { useState } from "react";

export function SandCExerciseDemonstrationVideos({ videos }: { videos: unknown }) {
  const clips = sandCDemonstrationVideosFromUnknown(videos);
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const openClip = openIndex !== null ? clips[openIndex] ?? null : null;

  if (clips.length === 0) return null;

  return (
    <div className="min-w-0 space-y-1">
      <p className="text-xs font-medium text-textSecondary">Demonstration Videos</p>
      <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-sm">
        {clips.map((clip, index) => (
          <span key={clip.id} className="inline-flex min-w-0 items-center gap-2">
            {index > 0 ? (
              <span aria-hidden="true" className="text-textSecondary">
                |
              </span>
            ) : null}
            <button
              type="button"
              className="text-primary underline-offset-2 hover:underline"
              onClick={() => setOpenIndex(index)}
            >
              {clip.label}
            </button>
          </span>
        ))}
      </div>
      {openClip ? (
        <Modal
          className="w-full min-w-0 max-w-[min(100%,48rem)] overflow-hidden rounded-xl bg-card p-0 shadow-lg"
          aria-labelledby="sandc-demo-video-title"
        >
          <div className="flex min-w-0 items-start justify-between gap-3 px-3 py-2 sm:px-4">
            <h2
              id="sandc-demo-video-title"
              className="min-w-0 truncate pt-1 text-sm font-medium text-textPrimary sm:text-base"
            >
              {openClip.label}
            </h2>
            <button
              type="button"
              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-textSecondary hover:bg-bg hover:text-textPrimary"
              aria-label="Close"
              onClick={() => setOpenIndex(null)}
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
          <div className="min-w-0 w-full overflow-hidden">
            <div className="relative aspect-video w-full bg-black">
              <iframe
                key={openClip.id}
                title={openClip.label}
                src={openClip.embedSrc}
                className="absolute inset-0 h-full w-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                referrerPolicy="strict-origin-when-cross-origin"
              />
            </div>
          </div>
        </Modal>
      ) : null}
    </div>
  );
}
