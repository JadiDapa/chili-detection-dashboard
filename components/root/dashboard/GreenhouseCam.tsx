// components/GreenhouseCam.tsx
"use client";

import { useState } from "react";
import {
  Camera,
  CameraOff,
  Maximize2,
  Minus,
  Plus,
  Radio,
  Search,
} from "lucide-react";

type StreamType = "mjpeg" | "hls" | "webrtc";

interface GreenhouseCamProps {
  /** e.g. "http://192.168.1.100/stream" for MJPEG */
  streamUrl?: string;
  streamType?: StreamType;
  label?: string;
}

export function GreenhouseCam({
  streamUrl,
  streamType = "mjpeg",
  label = "Greenhouse A — Cam 01",
}: GreenhouseCamProps) {
  const [error, setError] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);

  const content = (
    <div
      className={`relative overflow-hidden rounded-xl bg-green-800 ${
        fullscreen ? "fixed inset-4 z-50 shadow-2xl" : "h-118 w-full"
      }`}
    >
      {/* ── Stream ── */}
      {streamUrl && !error ? (
        streamType === "mjpeg" ? (
          // MJPEG: browser natively renders as a motion JPEG
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={streamUrl}
            alt="Live greenhouse feed"
            className="h-full w-full object-cover"
            onError={() => setError(true)}
          />
        ) : (
          // HLS / mp4 fallback
          <video
            src={streamUrl}
            autoPlay
            muted
            playsInline
            className="h-full w-full object-cover"
            onError={() => setError(true)}
          />
        )
      ) : (
        // ── Disabled / error state ──
        <div className="flex h-full min-h-50 flex-col items-center justify-center gap-2 text-white/80">
          <CameraOff className="size-8" />
          <p className="text-xs">
            {error ? "Stream unavailable" : "Camera is disabled"}
          </p>
        </div>
      )}

      {/* ── Top bar overlay ── */}
      <div className="from-green/60 absolute inset-x-0 top-0 flex items-center justify-between bg-linear-to-b to-transparent px-3 py-2">
        <div className="flex items-center gap-1.5">
          {/* Live dot */}
          {streamUrl && !error && (
            <span className="flex items-center gap-1 rounded-full bg-red-500/90 px-2 py-0.5 text-[10px] font-semibold text-white">
              <Radio className="size-2.5 animate-pulse" /> LIVE
            </span>
          )}
          <span className="rounded-full bg-white/25 p-2 px-4 text-sm text-white/80 backdrop-blur-sm">
            {label}
          </span>
          <button className="bg-green/40 hover:bg-green/60 rounded-full bg-white/25 p-3 text-sm text-white/80 backdrop-blur-sm transition-colors">
            <Search className="size-4" />
          </button>
        </div>
        <button
          onClick={() => setFullscreen((f) => !f)}
          className="bg-green/40 hover:bg-green/60 rounded-full bg-white/25 p-2 text-sm text-white/80 backdrop-blur-sm transition-colors"
        >
          <Maximize2 className="size-5" />
        </button>
      </div>

      {/* ── Bottom timestamp overlay ── */}
      <div className="from-green/60 absolute inset-x-0 bottom-0 bg-linear-to-t to-transparent px-3 py-2">
        <p className="w-max rounded-full bg-white/30 px-3 py-1 text-sm text-white/60 backdrop-blur-sm">
          {new Date().toLocaleString("en-GB", {
            dateStyle: "long",
            timeStyle: "short",
          })}
        </p>
      </div>

      <div className="absolute right-3 bottom-3 flex flex-col items-center gap-2">
        <button
          onClick={() => setFullscreen((f) => !f)}
          className="bg-green/40 hover:bg-green/60 rounded-full bg-white/25 p-2 text-sm text-white/80 backdrop-blur-sm transition-colors"
        >
          <Plus className="size-5" />
        </button>

        <button
          onClick={() => setFullscreen((f) => !f)}
          className="bg-green/40 hover:bg-green/60 rounded-full bg-white/25 p-2 text-sm text-white/80 backdrop-blur-sm transition-colors"
        >
          <Minus className="size-5" />
        </button>
      </div>

      {/* ── Fullscreen backdrop close ── */}
      {fullscreen && (
        <button
          onClick={() => setFullscreen(false)}
          className="bg-green/80 absolute inset-0 -z-10"
          aria-label="Close fullscreen"
        />
      )}
    </div>
  );

  return <div className="rounded-2xl">{content}</div>;
}
