"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { WifiOff, RefreshCw, Camera } from "lucide-react";
import { CrosshairOverlay } from "./CrosshairOverlay";

type StreamState = "connecting" | "live" | "error" | "offline";

type Props = {
  label: string;
  streamUrl: string;
  /** Show a live indicator dot. Default true. */
  showLiveIndicator?: boolean;
};

export function PlantsCam({
  label,
  streamUrl,
  showLiveIndicator = true,
}: Props) {
  const [state, setState] = useState<StreamState>("connecting");
  const [retryCount, setRetryCount] = useState(0);
  const imgRef = useRef<HTMLImageElement>(null);
  const retryTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Append a cache-busting param so the browser doesn't serve a stale 404
  const bustedUrl = `${streamUrl}${streamUrl.includes("?") ? "&" : "?"}_r=${retryCount}`;

  const retry = useCallback(() => {
    setState("connecting");
    setRetryCount((c) => c + 1);
  }, []);

  // Auto-retry once after 5 s on error (in case Pi is booting)
  useEffect(() => {
    if (state === "error") {
      retryTimer.current = setTimeout(retry, 5000);
    }
    return () => {
      if (retryTimer.current) clearTimeout(retryTimer.current);
    };
  }, [state, retry]);

  // A backgrounded tab freezes the MJPEG <img> WITHOUT firing onError, so on
  // return it shows a stale frame and never recovers. Force a reconnect (new
  // cache-busted URL) whenever the tab/window becomes visible again — this also
  // covers returning from another window or a soft refresh.
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") retry();
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
    };
  }, [retry]);

  return (
    <div className="relative h-full w-full overflow-hidden bg-zinc-950">
      {/* ── MJPEG img — always mounted so the stream starts immediately ── */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={imgRef}
        src={bustedUrl}
        alt={`${label} live stream`}
        className={`h-full w-full object-cover transition-opacity duration-500 ${
          state === "live" ? "opacity-100" : "opacity-0"
        }`}
        // First valid frame received → mark as live
        onLoad={() => setState("live")}
        // Any fetch/decode error → mark as error
        onError={() => setState("error")}
      />

      {/* ── Connecting state ── */}
      {state === "connecting" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-zinc-900">
          <div className="relative flex items-center justify-center">
            <span className="absolute inline-flex h-10 w-10 animate-ping rounded-full bg-green-500/20" />
            <Camera className="relative size-5 text-zinc-400" />
          </div>
          <p className="text-[11px] font-medium tracking-widest text-zinc-500 uppercase">
            Connecting
          </p>
        </div>
      )}

      {/* ── Error / offline state ── */}
      {(state === "error" || state === "offline") && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-zinc-900">
          <WifiOff className="size-5 text-zinc-600" />
          <div className="text-center">
            <p className="text-[11px] font-medium text-zinc-500">No signal</p>
            <p className="mt-0.5 text-[10px] text-zinc-600">Retrying…</p>
          </div>
          <button
            onClick={retry}
            className="flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800 px-2.5 py-1.5 text-[11px] text-zinc-400 transition hover:bg-zinc-700 active:scale-95"
          >
            <RefreshCw className="size-3" />
            Retry now
          </button>
        </div>
      )}

      {/* ── Center crosshair (over the live feed) ── */}
      {state === "live" && <CrosshairOverlay />}

      {/* ── Live indicator (top-left) ── */}
      {showLiveIndicator && state === "live" && (
        <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 rounded-md bg-black/50 px-2 py-1 backdrop-blur-sm">
          <span className="relative flex size-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex size-1.5 rounded-full bg-red-500" />
          </span>
          <span className="text-[10px] font-semibold tracking-widest text-white/80 uppercase">
            Live
          </span>
        </div>
      )}

      {/* ── Label (bottom-left) ── */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent px-3 py-2">
        <p className="truncate text-[11px] font-medium text-white/70">
          {label}
        </p>
      </div>
    </div>
  );
}
