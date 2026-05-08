import { cn } from "@/lib/utils";
import { useState } from "react";

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

function getDays(centerDate: Date, range = 3) {
  return Array.from({ length: range * 2 + 1 }, (_, i) => {
    const d = new Date(centerDate);
    d.setDate(centerDate.getDate() - range + i);

    return {
      label: DAY_LABELS[d.getDay()],
      date: d.getDate(),
      fullDate: new Date(d.setHours(0, 0, 0, 0)),
    };
  });
}

export default function DatePicker({
  selectedDate,
  onSelect,
}: {
  selectedDate: Date;
  onSelect: (d: Date) => void;
}) {
  const [cursorDate, setCursorDate] = useState(new Date());
  const days = getDays(cursorDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <div className="flex items-center justify-between border-y px-2 py-2">
      {days.map((day) => {
        const isSelected = isSameDay(day.fullDate, selectedDate);
        const isToday = isSameDay(day.fullDate, today);
        return (
          <button
            key={day.fullDate.toISOString()}
            onClick={() => onSelect(day.fullDate)}
            className={cn(
              "relative flex flex-col items-center gap-0.5 rounded-md px-1.5 py-1 text-xs transition-all",
              isSelected
                ? "bg-black font-semibold text-white"
                : "font-medium text-zinc-500 hover:text-zinc-200",
            )}
          >
            <span className="font-medium">{day.label}</span>
            <span
              className={cn(
                "text-[15px]",
                isSelected ? "font-bold" : "font-semibold",
              )}
            >
              {day.date.toString().padStart(2, "0")}
            </span>
            {isToday && (
              <span
                className={cn(
                  "absolute -bottom-0.5 left-1/2 h-1 w-3 -translate-x-1/2 rounded-full",
                  isSelected ? "bg-primary" : "bg-zinc-400",
                )}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
