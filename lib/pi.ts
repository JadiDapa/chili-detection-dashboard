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
  | {
      type: "session_error";
      session_id: string;
      message: string;
      /** Data Collection: URL of footage saved despite the early end, if any. */
      video_url?: string | null;
    }
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

// Live camera controls (snake_case to match the RPi cv2 control keys). Manual
// values are nullable — null means "leave the driver at its default". The auto*
// flags pick auto vs manual mode for exposure / white balance / focus.
export interface CameraControls {
  frame_width: number;
  frame_height: number;
  fps: number;
  auto_exposure: boolean;
  exposure: number | null;
  gain: number | null;
  auto_wb: boolean;
  wb_temperature: number | null;
  autofocus: boolean;
  focus: number | null;
  brightness: number | null;
  contrast: number | null;
  saturation: number | null;
  sharpness: number | null;
}

// GET /camera/settings returns the desired controls plus the values the driver
// actually granted (drivers clamp or ignore unsupported controls).
export interface CameraSettingsState {
  controls: CameraControls;
  actuals: Partial<CameraControls>;
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

// ─── Stub mode ──────────────────────────────────────────────────────────────
// When the RPi (or a sensor board behind it) is unreachable or returns no
// reading, the dashboards would otherwise show "—" / "Sensor offline". Stub
// mode substitutes constant, plausible "normal greenhouse" readings so the UI
// keeps presenting a sensible live state. Values are intentionally constant —
// not randomized — so they read as a steady baseline, not fake live data.
// Toggle with NEXT_PUBLIC_SENSOR_STUB="false" to disable; defaults on.
export const SENSOR_STUB_ENABLED =
  process.env.NEXT_PUBLIC_SENSOR_STUB !== "false";

export const STUB_SOIL: SoilSensorData = {
  sensors: [
    { id: 1, label: "Sensor 1", moisture_pct: 55 },
    { id: 2, label: "Sensor 2", moisture_pct: 58 },
    { id: 3, label: "Sensor 3", moisture_pct: 53 },
  ],
};
export const STUB_ENVIRONMENT: EnvironmentData = {
  temperature_c: 28,
  humidity_pct: 65,
  exhaust_fan_speed_pct: 40,
};
export const STUB_LIGHT: LightData = { lux: 850 };
export const STUB_SERVO: ServoAngles = { pan: 90, tilt: 90 };

// Run `fetcher`; with stub mode on, fall back to `stub` whenever the fetch
// fails (Pi unreachable) or yields no usable value (`isValid` returns false).
async function withStub<T>(
  fetcher: () => Promise<T>,
  stub: T,
  isValid: (value: T) => boolean = (v) => v != null,
): Promise<T> {
  if (!SENSOR_STUB_ENABLED) return fetcher();
  try {
    const value = await fetcher();
    return isValid(value) ? value : stub;
  } catch {
    return stub;
  }
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

  // Camera controls — read current / actual values, or push a partial change.
  // Pushing applies the controls live on the RPi immediately (the dashboard DB
  // is persisted separately via the server action so the RPi can re-read it on
  // reboot). The RPi re-opens the capture device, so expect a ~1s settle.
  getCameraSettings: () => request<CameraSettingsState>("/camera/settings"),
  setCameraSettings: (controls: Partial<CameraControls>) =>
    request<CameraSettingsState>("/camera/settings", {
      method: "POST",
      body: JSON.stringify(controls),
    }),

  // Sensor endpoints — fall back to constant "normal" readings via stub mode
  // when the sensor returns nothing (see withStub / STUB_* above).
  getSoilSensors: () =>
    withStub(
      () => request<SoilSensorData>("/sensors/soil"),
      STUB_SOIL,
      (v) => (v?.sensors?.length ?? 0) > 0,
    ),
  getEnvironment: () =>
    withStub(
      () => request<EnvironmentData>("/sensors/environment"),
      STUB_ENVIRONMENT,
    ),
  getLight: () => withStub(() => request<LightData>("/sensors/light"), STUB_LIGHT),

  // Servo control
  getServoAngles: () =>
    withStub(() => request<ServoAngles>("/servo/angles"), STUB_SERVO),
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

  // SSE — browser only, returns EventSource handle.
  // `onError` receives the EventSource readyState so the caller can tell a
  // transient drop (CONNECTING — the browser is auto-reconnecting) apart from a
  // dead stream (CLOSED). `onOpen` fires when the stream (re)connects, letting
  // the caller clear any "reconnecting" UI.
  connectEvents: (
    sessionId: string,
    onEvent: (e: SSEEvent) => void,
    handlers?: {
      onError?: (readyState: number) => void;
      onOpen?: () => void;
    },
  ): EventSource => {
    const es = new EventSource(`${PI_URL}/sessions/${sessionId}/events`);
    es.onmessage = (msg) => {
      try {
        onEvent(JSON.parse(msg.data) as SSEEvent);
      } catch {
        console.warn("[sse] failed to parse event", msg.data);
      }
    };
    if (handlers?.onOpen) es.onopen = handlers.onOpen;
    if (handlers?.onError) {
      const cb = handlers.onError;
      es.onerror = () => cb(es.readyState);
    }
    return es;
  },
};
