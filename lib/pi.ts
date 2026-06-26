/**
 * lib/pi.ts — Raspberry Pi FastAPI client
 *
 * This client runs in the BROWSER (SSE, camera <img>, sensor fetches), so the
 * URL must be NEXT_PUBLIC_* to be inlined into the client bundle at build time,
 * and must be reachable from each user's browser (e.g. a Tailscale Funnel/Serve
 * HTTPS endpoint — plain http://100.x will be blocked as mixed content on HTTPS).
 *
 * Add to your .env (set at BUILD time):
 *   NEXT_PUBLIC_RASPBERRY_PI_URL=https://<rpi-host>.<tailnet>.ts.net
 */

export const PI_URL =
  process.env.NEXT_PUBLIC_RASPBERRY_PI_URL ?? "http://100.127.114.61:8000";

// ─── Types ────────────────────────────────────────────────────────────────────

export type SessionStatus =
  | "created"
  | "running"
  | "complete"
  | "error"
  | "stopped";

export interface PiSession {
  session_id: string;
  status: SessionStatus;
  notes: string | null;
  created_at: string | null;
  started_at: string | null;
  completed_at: string | null;
  total_plants: number | null;
  avg_height_cm: number | null;
  avg_moisture_pct: number | null;
  total_water_sec: number | null;
  ripeness: {
    ripe: number;
    turning: number;
    unripe: number;
    broken: number;
  } | null;
  harvest_ready_ids: number[] | null;
}

export interface PiDetection {
  cls: "ripe" | "turning" | "unripe" | "broken";
  count: number;
  confidence: number;
}

export interface PiPlantScan {
  plant_id: number;
  row: number;
  col: number;
  scanned_at: string | null;
  image_url: string | null;
  annotated_image_url: string | null;
  total_fruits: number | null;
  ripe_count: number | null;
  turning_count: number | null;
  unripe_count: number | null;
  broken_count: number | null;
  detections: PiDetection[];
  height_cm: number | null;
  moisture_pct: number | null;
  valve_duration_sec: number | null;
  watering_reason: string | null;
}

// ─── SSE event union ──────────────────────────────────────────────────────────

export type SSEEvent =
  // ── Shared ──
  | {
      type: "session_started";
      session_id: string;
      timestamp: string;
      total_plants: number;
    }
  | {
      type: "motors_homed";
      session_id: string;
      position: { x: number; y: number; z: number };
    }
  | {
      type: "session_complete";
      session_id: string;
      summary: Record<string, unknown>;
    }
  | { type: "session_error"; session_id: string; message: string }
  | {
      type: "session_reconnect";
      session_id: string;
      status: string;
      plant_count: number;
    }
  // ── SCAN session events ──
  | {
      type: "gantry_moving";
      session_id: string;
      plant_id: number;
      row: number;
      col: number;
    }
  | {
      type: "gantry_moved";
      session_id: string;
      plant_id: number;
      row: number;
      col: number;
      x: number;
      y: number;
      z: number;
    }
  | {
      type: "plant_scanned";
      session_id: string;
      plant_id: number;
      image_url: string;
      annotated_image_url: string | null;
      detections: PiDetection[];
      total_fruits: number;
    }
  // ── DATA_COLLECTION session events ──
  | {
      type: "recording_started";
      session_id: string;
      total_rows: number;
    }
  | {
      type: "pass_progress";
      session_id: string;
      row: number;
      rows_swept: number;
      total_rows: number;
    }
  | {
      type: "video_uploading";
      session_id: string;
      size_mb: number;
    }
  // ── WATERING session events ──
  | {
      type: "tof_sweep_started";
      session_id: string;
      total_positions: number;
    }
  | {
      type: "tof_position_scanned";
      session_id: string;
      row: number;
      col: number;
      height_cm: number;
      position: number;
      total: number;
    }
  | {
      type: "tof_sweep_complete";
      session_id: string;
      max_height_cm: number;
    }
  | {
      type: "moisture_read_before";
      session_id: string;
      sensors: [number, number, number];
      avg_pct: number;
    }
  | {
      type: "fuzzy_computed";
      session_id: string;
      max_height_cm: number;
      avg_moisture_pct: number;
      duration_sec: number;
    }
  | {
      type: "watering_stop";
      session_id: string;
      stop_index: number;
      x_mm: number;
      y_mm: number;
      duration_sec: number;
    }
  | {
      type: "moisture_read_after";
      session_id: string;
      sensors: [number, number, number];
      avg_pct: number;
    };

// ─── Sensor & servo types ─────────────────────────────────────────────────────

export interface SoilSensor {
  id: number;
  label: string;
  moisture_pct: number;
}
export interface SoilSensorData {
  sensors: SoilSensor[];
}
export interface EnvironmentData {
  temperature_c: number;
  humidity_pct: number;
  exhaust_fan_speed_pct: number;
}
export interface LightData {
  lux: number;
}
export interface ServoAngles {
  pan: number;
  tilt: number;
}

// ─── Fetch helper ─────────────────────────────────────────────────────────────

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${PI_URL}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Pi API ${path} → ${res.status}: ${text}`);
  }
  return res.json();
}

// Remove an empty `capture_offsets` so the RPi applies its built-in default
// instead of rejecting an empty list. Returns the config unchanged otherwise.
function stripEmptyCaptureOffsets(
  config: Record<string, unknown>,
): Record<string, unknown> {
  const offsets = config.capture_offsets;
  if (Array.isArray(offsets) && offsets.length === 0) {
    const { capture_offsets: _omit, ...rest } = config;
    return rest;
  }
  return config;
}

// ─── API ──────────────────────────────────────────────────────────────────────

export const piApi = {
  startSession: (
    id: string,
    sessionType: "SCAN" | "WATERING" | "DATA_COLLECTION" = "SCAN",
    config?: Record<string, unknown> | null,
  ) => {
    // The scan config UI treats capture offsets as optional ("RPi will use
    // built-in defaults"). The RPi requires capture_offsets to be non-empty
    // (min_length=1) and only falls back to its default when the field is
    // absent — an empty list is a 422. So drop an empty capture_offsets here
    // to honor that contract for both fresh and previously-stored snapshots.
    const scanConfig =
      sessionType === "SCAN" && config
        ? stripEmptyCaptureOffsets(config)
        : config;

    return request<{ session_id: string; status: string }>(
      `/sessions/${id}/start`,
      {
        method: "POST",
        body: JSON.stringify({
          session_type: sessionType,
          ...(sessionType === "SCAN" && scanConfig
            ? { scan_config: scanConfig }
            : {}),
          ...(sessionType === "WATERING" && config
            ? { watering_config: config }
            : {}),
          ...(sessionType === "DATA_COLLECTION" && config
            ? { dataset_config: config }
            : {}),
        }),
      },
    );
  },

  stopSession: (id: string) =>
    request<{ session_id: string; status: string }>(`/sessions/${id}/stop`, {
      method: "POST",
    }),

  // Camera URLs (used directly as <img> src)
  streamUrl: () => `${PI_URL}/camera/stream`,
  snapshotUrl: () => `${PI_URL}/camera/snapshot`,

  // Sensor endpoints
  getSoilSensors: () => request<SoilSensorData>("/sensors/soil"),
  getEnvironment: () => request<EnvironmentData>("/sensors/environment"),
  getLight: () => request<LightData>("/sensors/light"),

  // Servo control
  getServoAngles: () => request<ServoAngles>("/servo/angles"),
  setServoAngles: (pan: number, tilt: number) =>
    request<ServoAngles>("/servo/control", {
      method: "POST",
      body: JSON.stringify({ pan, tilt }),
    }),

  // Gantry control (routes through RPi — returns 409 if session active or gantry busy)
  gantryPosition: () =>
    request<{
      x: number;
      y: number;
      z: number;
      busy: boolean;
      homed: boolean;
      session_active: boolean;
    }>("/gantry/position"),

  gantryMove: (x: number, y: number, z: number, speed = 500) =>
    request<{ ok: boolean; position: { x: number; y: number; z: number } }>(
      "/gantry/move",
      { method: "POST", body: JSON.stringify({ x, y, z, speed }) },
    ),

  gantryHome: () =>
    request<{ ok: boolean; position: { x: number; y: number; z: number } }>(
      "/gantry/home",
      { method: "POST" },
    ),

  gantryStop: () =>
    request<{ ok: boolean; stopped: boolean }>("/gantry/stop", {
      method: "POST",
    }),

  gantryRelay: (channel: "sol" | "dc", on: boolean) =>
    request<{ ok: boolean; channel: string; on: boolean }>("/gantry/relay", {
      method: "POST",
      body: JSON.stringify({ channel, on }),
    }),

  gantryLimits: () =>
    request<{ l1: number; l2: number; l3: number; l4: number }>(
      "/gantry/limits",
    ),

  // SSE — browser only, returns EventSource handle
  connectEvents: (
    sessionId: string,
    onEvent: (e: SSEEvent) => void,
    onError?: () => void,
  ): EventSource => {
    const es = new EventSource(`${PI_URL}/sessions/${sessionId}/events`);
    es.onmessage = (msg) => {
      try {
        onEvent(JSON.parse(msg.data) as SSEEvent);
      } catch {
        console.warn("[sse] failed to parse event", msg.data);
      }
    };
    if (onError) es.onerror = onError;
    return es;
  },
};
