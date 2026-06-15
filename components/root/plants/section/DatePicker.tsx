"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";

// ─── Config ───────────────────────────────────────────────────────────────────

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const TOTAL_DAYS = 180; // how far back the strip reaches
const VISIBLE = 7;     // days visible at once
const ITEM_W = 40;     // px — each day button (fixed, not %)
const ITEM_GAP = 4;    // px — gap-1

const STEP = VISIBLE * (ITEM_W + ITEM_GAP); // one "page" of scroll in px

// ─── Helpers ─────────────────────────────────────────────────────────────────

const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

function buildDays(totalDays: number) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Array.from({ length: totalDays }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (totalDays - 1 - i)); // oldest → today
    d.setHours(0, 0, 0, 0);
    return { label: DAY_LABELS[d.getDay()], date: d.getDate(), fullDate: new Date(d) };
  });
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function DatePicker({
  selectedDate,
  onSelect,
}: {
  selectedDate: Date;
  onSelect: (d: Date) => void;
}) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const days = buildDays(TOTAL_DAYS);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [calOpen, setCalOpen] = useState(false);

  // Scroll so the item at `idx` is roughly centered in the viewport
  const scrollToIndex = useCallback((idx: number, behavior: ScrollBehavior = "smooth") => {
    const el = scrollRef.current;
    if (!el) return;
    const target = idx * (ITEM_W + ITEM_GAP) - (el.clientWidth / 2 - ITEM_W / 2);
    el.scrollTo({ left: Math.max(0, target), behavior });
  }, []);

  // Mount: scroll to today (rightmost item)
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    requestAnimationFrame(() => {
      el.scrollLeft = el.scrollWidth;
    });
  }, []);

  function scrollWeek(dir: -1 | 1) {
    scrollRef.current?.scrollBy({ left: dir * STEP, behavior: "smooth" });
  }

  function handleDayClick(day: (typeof days)[number], idx: number) {
    onSelect(day.fullDate);
    scrollToIndex(idx);
  }

  function handleCalendarSelect(date: Date | undefined) {
    if (!date) return;
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    onSelect(d);
    setCalOpen(false);
    const idx = days.findIndex((day) => isSameDay(day.fullDate, d));
    if (idx >= 0) setTimeout(() => scrollToIndex(idx), 50);
  }

  return (
    <div className="border-y">
      {/* ── Top row: month label + calendar button ── */}
      <div className="flex items-center justify-between px-3 pt-2 pb-1.5">
        <span className="text-[11px] font-semibold text-zinc-400">
          {format(selectedDate, "MMMM yyyy")}
        </span>

        <Popover open={calOpen} onOpenChange={setCalOpen}>
          <PopoverTrigger asChild>
            <button className="flex items-center gap-1 rounded-md border border-zinc-700 px-2 py-0.5 text-[10px] font-medium text-zinc-400 transition-colors hover:border-zinc-500 hover:text-zinc-200">
              <CalendarDays className="h-3 w-3" />
              Jump to date
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end" sideOffset={6}>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={handleCalendarSelect}
              disabled={(date) => date > today}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* ── Strip + nav arrows ── */}
      <div className="flex items-center gap-1 px-1 pb-2">
        {/* Left arrow */}
        <button
          onClick={() => scrollWeek(-1)}
          className="flex h-7 w-5 shrink-0 items-center justify-center rounded text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-200"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </button>

        {/* Scroll strip — overflow:hidden clips content, JS scrollLeft navigates */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-hidden"
        >
          <div className="flex" style={{ gap: ITEM_GAP }}>
            {days.map((day, idx) => {
              const isSelected = isSameDay(day.fullDate, selectedDate);
              const isToday = isSameDay(day.fullDate, today);
              return (
                <button
                  key={day.fullDate.toISOString()}
                  onClick={() => handleDayClick(day, idx)}
                  style={{ minWidth: ITEM_W, width: ITEM_W }}
                  className={cn(
                    "relative flex shrink-0 flex-col items-center gap-0.5 rounded-lg py-1 text-xs transition-all",
                    isSelected
                      ? "bg-foreground text-background font-semibold"
                      : "text-zinc-500 hover:bg-zinc-800/60 hover:text-zinc-300",
                  )}
                >
                  <span className="text-[9px] uppercase tracking-wide leading-none">
                    {day.label}
                  </span>
                  <span className={cn("text-sm leading-tight", isSelected ? "font-bold" : "font-semibold")}>
                    {day.date.toString().padStart(2, "0")}
                  </span>
                  {isToday && (
                    <span
                      className={cn(
                        "h-1 w-1 rounded-full",
                        isSelected ? "bg-primary" : "bg-zinc-600",
                      )}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right arrow */}
        <button
          onClick={() => scrollWeek(1)}
          className="flex h-7 w-5 shrink-0 items-center justify-center rounded text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-200"
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
