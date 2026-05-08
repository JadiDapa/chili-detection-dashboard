# CLAUDE.md — Next.js Dashboard

Greenhouse UNSRI Chili Harvesting System. This app is the **persistence layer and UI** for a
CNC gantry robot (2×6m) scanning 16 chili plants (2×8 grid) at Universitas Sriwijaya, showing ability to monitor realtime sensor readings and live session from raspberry pi 4 - fast api .

## Commands

```bash
npm run dev                  # localhost:3000
npx prisma migrate dev       # apply migrations
npx prisma generate          # regenerate client → generated/prisma/
npx prisma db seed           # tsx prisma/seed.ts
npx prettier --write .       # format + Tailwind class sort
```

## Critical — read before touching anything

- **Prisma client** imports from `@/generated/prisma`, never `@prisma/client`
- **Middleware** is `proxy.ts`, not `middleware.ts` — intentional, do not rename
- **Prisma schema** is split across `prisma/schema/` files — add new models there
- **`components/ui/`** is shadcn-managed — never edit directly
- **TypeScript errors suppressed** in `next.config.ts` — don't rely on build to catch type issues

## Architecture

**Route groups**

- `app/(auth)/` — Clerk sign-in/sign-up
- `app/(root)/` — protected; layout wraps all pages with sidebar + navbar

**Data flow — always follow this order**

1. Prisma schema in `prisma/schema/`
2. Service functions in `server/services/` — all DB queries go here
3. Server actions in `app/actions/` (`"use server"`) — call services, run `revalidatePath`
4. API routes in `app/api/` — for RPi ingestion and client fetches
5. Client components — TanStack Query v5 for fetching, mutations via server actions

Never query `prisma` directly in route handlers or components — always go through services.

**Auth** — use `getCurrentUser()` from `app/actions/user.actions.ts` in server components.

**File uploads** — RPi-posted images saved to `uploads/` via `lib/file-upload.ts`,
served at `/api/uploads/[filename]`. Store full URL (`NEXT_PUBLIC_BASE_URL/api/uploads/<name>`) in DB.

**Client fetching** — axios instance at `lib/networks/axiosInstance.ts` reads
`NEXT_PUBLIC_BASE_API_URL`. TanStack Query configured in `providers/Providers.tsx`.

## Domain model

```
Bed (piUrl → Raspberry Pi HTTP API)
 ├── Plant (row/col position; caches last ripeness + sensor state)
 └── Session (PENDING → RUNNING → COMPLETED / STOPPED / ERROR)
      └── Capture (per-plant: ripeness counts, height, moisture, watering duration)

Dataset → DatasetCapture (labeled images for YOLOv11 training)
```

## RPi integration — how the two systems connect

**SSE is owned entirely by RPi.** The browser connects directly to `PI_URL/sessions/{id}/events`.
Next.js is never in the SSE path. Do not add an SSE relay or proxy here.

**`lib/pi.ts`** is the typed client for direct browser→RPi calls. Keep all RPi communication here.
The `PI_URL` reads from `NEXT_PUBLIC_RASPBERRY_PI_URL` env var (not `NEXT_PUBLIC_BASE_API_URL`).

**After a session ends**, RPi POSTs the full session result to Next.js for persistence:

```
POST /api/sessions/sync          — full session + all plant scans after completion
```

This is the only time Next.js receives data from RPi. During a live session,
Next.js is not involved — browser talks directly to RPi.

**RPi payload shape** (mirrors `PiSession` + `PiPlantScan[]` from `lib/pi.ts`):

```typescript
{
  session_id: string           // RPi's own ID — stored as externalId in Prisma
  status: "complete" | "stopped" | "error"
  bed_id: string               // which Bed this session belongs to
  started_at: string
  completed_at: string
  plant_scans: PiPlantScan[]   // full array, one per scanned plant
  summary: {
    total_plants: number
    avg_height_cm: number
    avg_moisture_pct: number
    total_water_sec: number
    ripeness: { ripe: number, turning: number, unripe: number, broken: number }
    harvest_ready_ids: number[]
  }
}
```

## Migration status

**Currently:** live sessions are 100% on RPi (SQLite). Next.js Prisma has no Session/Capture
data. The `/api/sessions/sync` endpoint does not exist yet. `Capture` model in Prisma may be
missing fields: `moisture_pct`, `valve_duration_sec`, `watering_reason`, `height_cm`.

**Target:** RPi POSTs to `/api/sessions/sync` after every session ends. History, summaries,
and analytics are all served from Next.js Prisma. Live session UI (`lib/pi.ts`, `LiveSession`
component) stays unchanged.

**Before writing any session/capture queries, check `prisma/schema/` for what fields
actually exist.** Do not assume the target schema is in place.

## Pages

- `/dashboard` — live sensor readings, task list, CCTV feed (`piApi.streamUrl()`), graphs
- `/plants` — 2×8 planter bed grid, start/monitor sessions via `LiveSession` component
- `/dataset` — create folders, trigger capture for YOLOv11 training data
- `/testing` — direct ESP32 HTTP control (dev/debug, no backend proxy)

## Environment variables

| Variable                            | Purpose                                                |
| ----------------------------------- | ------------------------------------------------------ |
| `DATABASE_URL`                      | PostgreSQL connection string                           |
| `NEXT_PUBLIC_BASE_URL`              | This app's public URL (for building stored image URLs) |
| `NEXT_PUBLIC_RASPBERRY_PI_URL`      | RPi base URL — read by `lib/pi.ts` as `PI_URL`         |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk public key                                       |
| `CLERK_SECRET_KEY`                  | Clerk secret key                                       |
