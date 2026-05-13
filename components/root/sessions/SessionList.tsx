import { cn } from "@/lib/utils";
import { ClassCount } from "../plants/section/LiveSession";
import { Loader2, RefreshCw, Play } from "lucide-react";
import { formatTime, sessionToClassCount } from "../plants/section/SessionSidebar";
import { SessionType } from "@/server/validators/session.validator";

type FruitClass = "Ripe" | "Unripe" | "Turning" | "Broken";

const CLASS_BADGE_COLOR: Record<FruitClass, string> = {
  Ripe: "bg-emerald-600 text-emerald-100",
  Unripe: "bg-sky-600 text-sky-100",
  Turning: "bg-amber-600 text-amber-100",
  Broken: "bg-red-600 text-red-100",
};

function ClassBadge({ label, count }: { label: FruitClass; count: number }) {
  return (
    <span
      className={cn(
        "inline-flex items-center justify-between gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium",
        CLASS_BADGE_COLOR[label],
      )}
    >
      {label}
      <span className="font-bold">{count}</span>
    </span>
  );
}

function ClassGrid({ classes }: { classes: ClassCount }) {
  return (
    <div className="grid grid-cols-2 gap-1">
      {(Object.entries(classes) as [FruitClass, number][]).map(([k, v]) => (
        <ClassBadge key={k} label={k} count={v} />
      ))}
    </div>
  );
}

export default function SessionList({
  sessions,
  loading,
  onSelectSession,
  onStartSession,
  onRefresh,
  disableStart,
}: {
  sessions: SessionType[];
  loading: boolean;
  onSelectSession: (id: string) => void;
  onStartSession: () => void;
  onRefresh: () => void;
  disableStart: boolean;
}) {
  return (
    <div className="mt-2 space-y-1 p-1">
      {loading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 size={18} className="animate-spin text-zinc-500" />
        </div>
      )}

      {!loading && sessions.length === 0 && (
        <div className="px-3 py-6 text-center">
          <p className="text-xs text-zinc-500">No sessions for this day.</p>
          <button
            onClick={onRefresh}
            className="mx-auto mt-2 flex items-center gap-1 text-[11px] text-zinc-400 transition-colors hover:text-zinc-200"
          >
            <RefreshCw size={11} />
            Refresh
          </button>
        </div>
      )}

      {!loading &&
        sessions.map((session, idx) => {
          const classes = sessionToClassCount(session);
          const total = Object.values(classes).reduce((a, b) => a + b, 0);
          const isComplete = session.status === "COMPLETED";
          return (
            <button
              key={session.id}
              onClick={() => onSelectSession(String(session.id))}
              className="bg-muted group relative flex w-full items-start gap-3 rounded-lg p-3 text-left transition-colors hover:bg-zinc-800/60"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-[11px] font-bold text-zinc-300 group-hover:bg-zinc-700">
                {idx + 1}
              </div>
              <div className="flex w-full min-w-0 flex-col gap-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-foreground truncate text-base font-semibold">
                    Session #{session.id}
                  </span>
                  <span className="text-muted-foreground shrink-0 text-[10px]">
                    {formatTime(session.startedAt)}
                  </span>
                </div>
                {!isComplete && (
                  <span
                    className={cn(
                      "w-fit rounded px-1.5 py-0.5 text-[10px] font-medium",
                      session.status === "RUNNING" &&
                        "bg-emerald-600/20 text-emerald-400",
                      session.status === "ERROR" &&
                        "bg-red-600/20 text-red-400",
                      session.status === "STOPPED" &&
                        "bg-zinc-600/20 text-zinc-400",
                      session.status === "PENDING" &&
                        "bg-zinc-600/20 text-zinc-400",
                    )}
                  >
                    {session.status.toLowerCase()}
                  </span>
                )}
                {isComplete && total > 0 && <ClassGrid classes={classes} />}
              </div>
            </button>
          );
        })}

      <div className="flex items-center gap-3 py-1">
        <span className="h-px w-full bg-zinc-200 dark:bg-zinc-800" />
        <span className="text-muted-foreground shrink-0 text-xs">or</span>
        <span className="h-px w-full bg-zinc-200 dark:bg-zinc-800" />
      </div>

      <button
        onClick={onStartSession}
        disabled={disableStart}
        className={`group hover:bg-primary/10 flex w-full items-center gap-3 rounded-xl border-2 border-dashed border-zinc-300 px-4 py-3 text-left transition-colors dark:border-zinc-700 ${disableStart ? "cursor-not-allowed opacity-50" : ""}`}
      >
        <div className="bg-primary/20 text-primary group-hover:bg-primary/30 flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors">
          <Play size={13} fill="currentColor" />
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-foreground text-[13px] font-semibold">
            Start Session
          </span>
          <span className="text-[11px] text-zinc-500">
            Create a new scanning session
          </span>
        </div>
      </button>
    </div>
  );
}
