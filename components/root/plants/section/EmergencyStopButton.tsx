"use client";

import { useState } from "react";
import { OctagonX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { piApi } from "@/lib/pi";

/**
 * Always-visible kill switch for the plant page header.
 *
 * Hits the RPi `/gantry/stop` endpoint, which cancels any running session,
 * halts the gantry, cuts motor power, and closes every relay. Best-effort: if
 * the RPi is unreachable there is nothing more the browser can do, so we just
 * surface the error and re-enable the button.
 */
export default function EmergencyStopButton() {
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  async function handleEmergencyStop() {
    setBusy(true);
    setFailed(false);
    try {
      await piApi.gantryStop();
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button
      variant="destructive"
      className="shrink-0 font-bold tracking-wide uppercase"
      onClick={handleEmergencyStop}
      disabled={busy}
      title="Kill everything: cancel the running session, halt the gantry, cut motor power, and close all relays"
    >
      {busy ? <Spinner className="h-4 w-4" /> : <OctagonX />}
      <span className="hidden sm:inline">
        {failed ? "Retry E-Stop" : "Emergency Stop"}
      </span>
    </Button>
  );
}
