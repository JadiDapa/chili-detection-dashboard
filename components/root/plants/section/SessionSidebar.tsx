"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams, useParams } from "next/navigation";
import { SlidersHorizontal, AlignJustify, RefreshCw } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SessionType } from "@/server/validators/session.validator";
import { createSessionAction } from "@/app/actions/sessions.actions";
import LiveSession from "./LiveSession";
import SessionDetail from "./SessionDetail";
import DatePicker from "./DatePicker";
import SessionList from "../../sessions/SessionList";
import { ClassCount } from "./LiveSession";
import StartSessionDialog from "@/components/root/scan-configs/StartSessionDialog";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

export function sessionToClassCount(session: SessionType): ClassCount {
  return {
    Ripe: session.totalRipe ?? 0,
    Unripe: session.totalUnripe ?? 0,
    Turning: session.totalTurning ?? 0,
    Broken: session.totalDamaged ?? 0,
  };
}

export function formatTime(iso: string | Date | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function sessionDate(session: SessionType): Date {
  const d = new Date(session.createdAt);
  d.setHours(0, 0, 0, 0);
  return d;
}

type View = "list" | "detail" | "live";

// ─── Component ────────────────────────────────────────────────────────────────

export default function PlantSessionSidebar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const params = useParams();
  const section = params?.section as string | undefined;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [selectedDate, setSelectedDate] = useState<Date>(today);

  const [allSessions, setAllSessions] = useState<SessionType[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);

  const sessionParam = searchParams.get("session");

  const fetchSessions = useCallback(async () => {
    setLoadingSessions(true);
    try {
      const res = await fetch("/api/sessions");
      const data: SessionType[] = await res.json();
      setAllSessions(data);
    } catch {
      // dashboard unreachable — keep empty list
    } finally {
      setLoadingSessions(false);
    }
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const sessionsForDate = allSessions.filter((s) =>
    isSameDay(sessionDate(s), selectedDate),
  );

  const activeSession = sessionParam
    ? (allSessions.find((s) => String(s.id) === sessionParam) ?? null)
    : null;

  const isLiveSession =
    !!activeSession && ["PENDING", "RUNNING"].includes(activeSession.status);

  const view: View = !sessionParam ? "list" : isLiveSession ? "live" : "detail";

  const hasRunningSession = allSessions.some((s) => s.status === "RUNNING");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [startPending, setStartPending] = useState(false);

  function handleSelectSession(id: string) {
    const p = new URLSearchParams(searchParams.toString());
    p.set("session", id);
    router.push(`?${p.toString()}`);
  }

  function handleBack() {
    const p = new URLSearchParams(searchParams.toString());
    p.delete("session");
    router.push(`?${p.toString()}`);
  }

  function handleStartClick() {
    setDialogOpen(true);
  }

  async function handleStartSession(
    sessionType: "SCAN" | "WATERING",
    configId: number | null,
  ) {
    setStartPending(true);
    try {
      const { id } = await createSessionAction(
        1,
        undefined,
        sessionType === "SCAN" ? (configId ?? undefined) : undefined,
        sessionType,
        sessionType === "WATERING" ? (configId ?? undefined) : undefined,
      );
      setDialogOpen(false);
      const p = new URLSearchParams(searchParams.toString());
      p.set("session", String(id));
      router.push(`?${p.toString()}`);
    } catch (e) {
      console.error("Failed to create session", e);
    } finally {
      setStartPending(false);
    }
  }

  function handleDateSelect(date: Date) {
    setSelectedDate(date);
    handleBack();
  }

  function handleLiveBack() {
    handleBack();
    fetchSessions();
  }

  return (
    <div className="bg-card text-foreground flex h-full w-100 flex-col rounded-xl px-3">
      {view === "list" && (
        <div className="flex items-center justify-between px-1 pt-5 pb-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Sessions</h1>
            {section && (
              <p className="text-[11px] text-zinc-500 capitalize">
                {decodeURIComponent(section).replace(/-/g, " ")}
              </p>
            )}
          </div>
          <div className="flex items-center gap-3 text-zinc-400">
            <button
              onClick={fetchSessions}
              className="hover:text-foreground transition-colors"
              title="Refresh"
            >
              <RefreshCw
                size={16}
                className={loadingSessions ? "animate-spin" : ""}
              />
            </button>
            <button className="hover:text-foreground transition-colors">
              <SlidersHorizontal size={18} />
            </button>
            <button className="hover:text-foreground transition-colors">
              <AlignJustify size={18} />
            </button>
          </div>
        </div>
      )}

      {view === "list" && (
        <DatePicker selectedDate={selectedDate} onSelect={handleDateSelect} />
      )}

      <ScrollArea className="min-h-0 flex-1">
        <div className="pb-4">
          {view === "list" && (
            <SessionList
              sessions={sessionsForDate}
              loading={loadingSessions}
              onSelectSession={handleSelectSession}
              onStartSession={handleStartClick}
              onRefresh={fetchSessions}
              disableStart={hasRunningSession}
            />
          )}

          {view === "detail" && activeSession && (
            <SessionDetail session={activeSession} onBack={handleBack} />
          )}

          {view === "detail" && !activeSession && (
            <div className="px-4 py-8 text-center text-[12px] text-zinc-500">
              Session not found.{" "}
              <button
                className="text-foreground underline"
                onClick={handleBack}
              >
                Go back
              </button>
            </div>
          )}

          {view === "live" && activeSession && (
            <LiveSession
              sessionId={String(activeSession.id)}
              onBack={handleLiveBack}
              sessionType={activeSession.sessionType as "SCAN" | "WATERING"}
              scanConfig={
                activeSession.scanConfigSnapshot as Record<
                  string,
                  unknown
                > | null
              }
              wateringConfig={
                activeSession.wateringConfigSnapshot as Record<
                  string,
                  unknown
                > | null
              }
            />
          )}
        </div>
      </ScrollArea>

      <StartSessionDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onConfirm={handleStartSession}
        isPending={startPending}
      />
    </div>
  );
}
