"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams, useParams } from "next/navigation";
import { SlidersHorizontal, AlignJustify, RefreshCw } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { piApi, PiSession } from "@/lib/pi";
import LiveSession from "./LiveSession";
import SessionDetail from "./SessionDetail";
import DatePicker from "./DatePicker";
import SessionList from "../../sessions/SessionList";

interface ClassCount {
  Ripe: number;
  Unripe: number;
  Turning: number;
  Broken: number;
}

const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

/** Map Pi lowercase class keys → display ClassCount */
export function piRipenessToClassCount(
  ripeness: PiSession["ripeness"],
): ClassCount {
  return {
    Ripe: ripeness?.ripe ?? 0,
    Unripe: ripeness?.unripe ?? 0,
    Turning: ripeness?.turning ?? 0,
    Broken: ripeness?.broken ?? 0,
  };
}

export function formatTime(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function sessionDate(session: PiSession): Date {
  const raw = session.created_at ?? session.started_at;
  const d = raw ? new Date(raw) : new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

type View = "list" | "detail" | "live";

export default function PlantSessionSidebar() {
  const [startingSessionId, setStartingSessionId] = useState<string | null>(
    null,
  );

  const router = useRouter();
  const searchParams = useSearchParams();
  const params = useParams();

  const section = params?.section as string | undefined;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [selectedDate, setSelectedDate] = useState<Date>(today);

  // ── Real API state ──
  const [allSessions, setAllSessions] = useState<PiSession[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);

  const sessionParam = searchParams.get("session");

  // Fetch all sessions from Pi
  const fetchSessions = useCallback(async () => {
    setLoadingSessions(true);
    try {
      const data = await piApi.listSessions();
      setAllSessions(data);
    } catch {
      // Pi unreachable — keep empty list, user can retry
    } finally {
      setLoadingSessions(false);
    }
  }, []);

  // Load on mount and when coming back from live session
  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  // Filter sessions by selected date (client-side)
  const sessionsForDate = allSessions.filter((s) =>
    isSameDay(sessionDate(s), selectedDate),
  );

  const activeSession = sessionParam
    ? (allSessions.find((s) => s.session_id === sessionParam) ?? null)
    : null;

  const isLiveSession =
    !!activeSession &&
    ["created", "running", "stopped", "error"].includes(activeSession.status);

  const view: View = !sessionParam ? "list" : isLiveSession ? "live" : "detail";

  const hasRunningSession = allSessions.some((s) => s.status === "running");

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

  async function handleStartSession() {
    try {
      const session = await piApi.createSession();

      setStartingSessionId(session.session_id);
      await fetchSessions();

      const p = new URLSearchParams(searchParams.toString());
      p.set("session", session.session_id);
      router.push(`?${p.toString()}`);
    } catch (e) {
      console.error("Failed to start session", e);
    }
  }
  function handleDateSelect(date: Date) {
    setSelectedDate(date);
    handleBack();
  }

  // When live session ends, refresh the list so the new session appears
  function handleLiveBack() {
    setStartingSessionId(null);
    handleBack();
    fetchSessions();
  }

  return (
    <div className="bg-card text-foreground flex h-[120vh] w-full flex-2 flex-col rounded-xl px-3">
      {/* Header */}
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

      {/* Date Picker */}
      {view === "list" && (
        <DatePicker selectedDate={selectedDate} onSelect={handleDateSelect} />
      )}

      {/* Content */}
      <ScrollArea className="min-h-0 flex-1">
        <div className="pb-4">
          {view === "list" && (
            <SessionList
              sessions={sessionsForDate}
              loading={loadingSessions}
              onSelectSession={handleSelectSession}
              onStartSession={handleStartSession}
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
              sessionId={activeSession.session_id}
              onBack={handleLiveBack}
            />
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
