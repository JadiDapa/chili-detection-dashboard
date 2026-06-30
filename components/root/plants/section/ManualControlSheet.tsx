"use client";

import { useState } from "react";
import { SlidersHorizontal } from "lucide-react";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import ServoPanTiltControl from "./ServoPanTiltControl";
import GantryControl from "./GantryControl";
import HardwarePanel from "./HardwarePanel";

// Direct hardware control (servo pan/tilt, gantry move/home, actuator relays and
// limit-switch readout) lives behind this right-side sheet so it stays out of the
// main scanning view but is one click away. The panels keep their own polling and
// "session running — disabled" guards; this only changes where they're shown.
export default function ManualControlSheet() {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" className="shrink-0">
          <SlidersHorizontal />
          <span className="hidden sm:inline">Manual Control</span>
        </Button>
      </SheetTrigger>

      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Manual Control</SheetTitle>
          <SheetDescription>
            Direct servo, gantry, actuator and limit-switch control. Disabled
            automatically while a session is running.
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-3 px-4 pb-6">
          <ServoPanTiltControl />
          <GantryControl />
          <HardwarePanel />
        </div>
      </SheetContent>
    </Sheet>
  );
}
