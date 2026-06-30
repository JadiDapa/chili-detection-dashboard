"use client";

import { useEffect, useState } from "react";
import { PanelRightOpen } from "lucide-react";

import {
  Sheet,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import SessionSidebar from "./SessionSidebar";

// Responsive placement for the sessions sidebar:
//   • Desktop (lg+) — rendered inline as the right column. The wrapper is
//     `relative` with the sidebar absolutely filling it, so the wrapper itself
//     contributes no intrinsic height: the flex row's height is driven by the
//     LEFT column, and the sidebar stretches to match it and scrolls internally
//     (via its own ScrollArea) when its content is taller.
//   • Mobile (<lg) — moved behind a right-side sheet opened by a floating button,
//     so it doesn't push the live feed and stats down the page.
//
// Exactly one SessionSidebar is mounted at a time (matchMedia-driven), so we
// never open two SSE streams to the RPi for the same live session.
export default function SessionSidebarPanel() {
  // Desktop-first default keeps SSR + first paint stable (this dashboard is
  // primarily used on desktop); the effect corrects it on small screens.
  const [isDesktop, setIsDesktop] = useState(true);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)"); // Tailwind `lg`
    const update = () => setIsDesktop(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  if (isDesktop) {
    return (
      <div className="relative hidden lg:block lg:w-100 lg:shrink-0">
        <div className="absolute inset-0">
          <SessionSidebar />
        </div>
      </div>
    );
  }

  return (
    <>
      <Button
        variant="outline"
        onClick={() => setOpen(true)}
        className="fixed right-4 bottom-[calc(6rem+env(safe-area-inset-bottom))] z-30 shadow-lg lg:hidden"
      >
        <PanelRightOpen />
        Sessions
      </Button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-full p-0 sm:max-w-md">
          <SheetTitle className="sr-only">Sessions</SheetTitle>
          <div className="min-h-0 flex-1 py-2">
            <SessionSidebar />
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
