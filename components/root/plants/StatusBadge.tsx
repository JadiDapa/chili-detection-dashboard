import { cn } from "@/lib/utils";

type Status = "idle" | "scanning" | "error" | "offline";

const statusConfig: Record<
  Status,
  { label: string; dot: string; badge: string }
> = {
  idle: {
    label: "Idle",
    dot: "bg-green-500",
    badge: "bg-green-100 text-green-800",
  },
  scanning: {
    label: "Scanning",
    dot: "bg-blue-500 animate-pulse",
    badge: "bg-blue-100 text-blue-800",
  },
  error: {
    label: "Error",
    dot: "bg-red-500",
    badge: "bg-red-100 text-red-800",
  },
  offline: {
    label: "Offline",
    dot: "bg-gray-400",
    badge: "bg-gray-100 text-gray-600",
  },
};

export function StatusBadge({ status }: { status: Status }) {
  const { label, dot, badge } = statusConfig[status];
  return (
    <span
      className={cn(
        "flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium uppercase",
        badge,
      )}
    >
      <span className={cn("size-1.5 rounded-full", dot)} />
      {label}
    </span>
  );
}
