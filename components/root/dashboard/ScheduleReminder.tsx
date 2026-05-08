import { Card } from "@/components/ui/card";

export default function ScheduleReminder() {
  return (
    <Card className="border-none p-4 shadow-none">
      <div className="flex gap-3">
        {/* Left: title + count */}
        <span className="bg-foreground mt-2 inline-block size-2 rounded-xs" />

        <div className="flex h-full flex-1 flex-col justify-between">
          {/* Top: title */}
          <div>
            <div className="flex items-center gap-1.5">
              <p className="text-lg font-semibold">Schedule</p>
            </div>
            <p className="text-muted-foreground text-xs">
              Today&apos;s Field Activities
            </p>
          </div>

          {/* Bottom: date */}
          <div className="flex items-end">
            <p className="text-5xl leading-none tracking-tighter">
              {new Date().getDate().toString().padStart(2, "0")}{" "}
            </p>
            <p className="text-muted-foreground text-sm">
              {new Date().toLocaleString("en-GB", { month: "long" })}
            </p>
          </div>
        </div>
        {/* Right: task list */}
        <div className="flex flex-1 flex-col gap-2">
          {[
            {
              name: "Pruning Task",
              sub: "Currently active",
              status: "Ongoing",
              v: "green" as const,
            },
            {
              name: "Fertilizing Task",
              sub: "Currently active",
              status: "Ongoing",
              v: "orange" as const,
            },
          ].map((t) => (
            <div
              key={t.name}
              className="bg-muted/50 h-20 rounded-xl px-2.5 py-2"
            >
              <div className="mb-0.5 flex items-start justify-between gap-1">
                <p className="leading-tight font-semibold">{t.name}</p>
                <StatusPill label={t.status} variant={t.v} />
              </div>
              <p className="text-muted-foreground text-[10px]">{t.sub}</p>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

function StatusPill({
  label,
  variant = "green",
}: {
  label: string;
  variant?: "green" | "orange" | "blue";
}) {
  const cls = {
    green:
      "bg-green-600 text-green-100 dark:bg-green-900/40 dark:text-green-400",
    orange:
      "bg-orange-600 text-orange-100 dark:bg-orange-900/40 dark:text-orange-400",
    blue: "bg-sky-600 text-sky-100 dark:bg-sky-900/40 dark:text-sky-400",
  }[variant];
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${cls}`}
    >
      {label}
    </span>
  );
}
