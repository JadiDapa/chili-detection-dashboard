/**
 * lib/pi.ts — Raspberry Pi FastAPI client
 *
 * Add to your .env.local:
 *   RASPBERRY_PI_URL=http://100.127.114.61:8000
 */

export const PI_URL =
  process.env.RASPBERRY_PI_URL ?? "http://100.127.114.61:8000";

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
      plant_id: number;
      image_url: string;
      detections: PiDetection[];
      height_cm?: number;
      moisture_pct?: number;
    }
  | {
      type: "sensor_read";
      session_id: string;
      plant_id: number;
      height_cm: number;
      moisture_pct: number;
    }
  | {
      type: "plant_watered";
      session_id: string;
      plant_id: number;
      valve_duration_sec: number;
      reason: string;
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

// ─── API ──────────────────────────────────────────────────────────────────────

export const piApi = {
  startSession: (id: string) =>
    request<{ session_id: string; status: string }>(`/sessions/${id}/start`, {
      method: "POST",
    }),

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
