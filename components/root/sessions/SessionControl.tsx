"use client";

import React, { useEffect, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Play, Pause, Square, RotateCcw } from "lucide-react";
import { toast } from "sonner";

import {
  getSessionStatus,
  startSession,
  stopSession,
  pauseSession,
  resumeSession,
  restartSession,
} from "@/lib/networks/session";

type SessionStatus = "IDLE" | "RUNNING" | "PAUSED" | "STOPPED";

export default function SessionControl() {
  const [status, setStatus] = useState<SessionStatus>("IDLE");
  const [isPending, startTransition] = useTransition();

  const fetchStatus = async () => {
    try {
      const data = await getSessionStatus();
      setStatus(data);
    } catch {
      toast.error("Failed to fetch session status");
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const action = (fn: () => Promise<any>, successMsg: string) => {
    startTransition(async () => {
      try {
        await fn();
        await fetchStatus();
        toast.success(successMsg);
      } catch {
        toast.error("Session action failed");
      }
    });
  };

  return (
    <div className="bg-background flex flex-col gap-4 rounded-xl border p-6 shadow-sm">
      {/* STATUS */}
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground text-sm font-medium">
          Session Status
        </span>
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            status === "RUNNING"
              ? "bg-green-100 text-green-700"
              : status === "PAUSED"
                ? "bg-yellow-100 text-yellow-700"
                : "bg-gray-100 text-gray-600"
          }`}
        >
          {status}
        </span>
      </div>

      {/* CONTROLS */}
      <div className="flex gap-3">
        {status === "IDLE" && (
          <Button
            disabled={isPending}
            onClick={() => action(startSession, "Session started")}
          >
            <Play className="mr-2 h-4 w-4" />
            Start
          </Button>
        )}

        {status === "RUNNING" && (
          <>
            <Button
              variant="secondary"
              disabled={isPending}
              onClick={() => action(pauseSession, "Session paused")}
            >
              <Pause className="mr-2 h-4 w-4" />
              Pause
            </Button>

            <Button
              variant="destructive"
              disabled={isPending}
              onClick={() => action(stopSession, "Session stopped")}
            >
              <Square className="mr-2 h-4 w-4" />
              Stop
            </Button>
          </>
        )}

        {status === "PAUSED" && (
          <>
            <Button
              variant="secondary"
              disabled={isPending}
              onClick={() => action(resumeSession, "Session resumed")}
            >
              <Play className="mr-2 h-4 w-4" />
              Resume
            </Button>

            <Button
              variant="destructive"
              disabled={isPending}
              onClick={() => action(stopSession, "Session stopped")}
            >
              <Square className="mr-2 h-4 w-4" />
              Stop
            </Button>
          </>
        )}

        {status === "STOPPED" && (
          <Button
            variant="outline"
            disabled={isPending}
            onClick={() => action(restartSession, "Session restarted")}
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            Restart Session
          </Button>
        )}
      </div>
    </div>
  );
}
