"use client";

import {
  Home,
  Settings,
  Moon,
  Sun,
  HelpCircle,
  Activity,
  Leaf,
  DatabaseZapIcon,
  CalendarClock,
} from "lucide-react";
import { usePathname } from "next/navigation";
import { useClerk } from "@clerk/nextjs";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const menuItems = [
  { title: "Dashboard", url: "/", icon: Home },
  { title: "Environments", url: "/environments", icon: Activity },
  { title: "Plants", url: "/plants", icon: Leaf },
  { title: "Schedule", url: "/schedule", icon: CalendarClock },
  { title: "Dataset Collection", url: "/dataset", icon: DatabaseZapIcon },
];

const bottomItems = [{ title: "Pengaturan", url: "/settings", icon: Settings }];

export default function DashboardSidebar() {
  const pathname = usePathname();
  const { signOut } = useClerk();
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const isLight = mounted ? resolvedTheme === "light" : false;
  const isDark = mounted ? resolvedTheme === "dark" : false;

  return (
    <TooltipProvider delayDuration={150}>
      <aside className="bg-muted hidden h-full w-20 shrink-0 flex-col items-center gap-6 py-4 md:flex">
        {/* ── Theme Toggle ── */}
        <div className="flex shrink-0 flex-col items-center gap-6">
          <div className="bg-card flex flex-col items-center gap-1 rounded-full p-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setTheme("light")}
                  className={`flex size-10 cursor-pointer items-center justify-center rounded-full transition-all duration-200 ${
                    isLight
                      ? "bg-accent text-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent/60"
                  } `}
                  aria-label="Light mode"
                >
                  <Sun className="size-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">Light mode</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setTheme("dark")}
                  className={`flex size-10 cursor-pointer items-center justify-center rounded-full transition-all duration-200 ${
                    isDark
                      ? "bg-accent text-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent/60"
                  } `}
                  aria-label="Dark mode"
                >
                  <Moon className="size-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">Dark mode</TooltipContent>
            </Tooltip>
          </div>

          {/* ── Divider ── */}
          <div className="bg-foreground h-px w-8" />
        </div>

        {/* ── Menu Items ── */}
        <div className="flex min-h-0 flex-1 items-start overflow-y-auto">
          <nav className="bg-card flex flex-col items-center gap-2 rounded-full p-1">
            {menuItems.map((item) => {
              const active = pathname === item.url;
              return (
                <Tooltip key={item.title}>
                  <TooltipTrigger asChild>
                    <Link
                      href={item.url}
                      className={`flex size-10 items-center justify-center rounded-full transition-all duration-200 ${
                        active
                          ? "bg-foreground text-background border-foreground shadow-sm"
                          : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/30 hover:bg-accent/50"
                      } `}
                    >
                      <item.icon className="size-4.5" />
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="right">{item.title}</TooltipContent>
                </Tooltip>
              );
            })}
          </nav>
        </div>

        {/* ── Bottom: Settings + Help + Avatar ── */}
        <div className="bg-card relative flex shrink-0 flex-col items-center gap-2 rounded-full p-1">
          {bottomItems.map((item) => {
            const active = pathname === item.url;
            return (
              <Tooltip key={item.title}>
                <TooltipTrigger asChild>
                  <Link
                    href={item.url}
                    className={`flex size-10 items-center justify-center rounded-full transition-all duration-200 ${
                      active
                        ? "bg-foreground text-background border-foreground shadow-sm"
                        : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/30 hover:bg-accent/50"
                    } `}
                  >
                    <item.icon className="size-4.5" />
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right">{item.title}</TooltipContent>
              </Tooltip>
            );
          })}

          {/* Help */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button className="text-muted-foreground hover:text-foreground hover:border-foreground/30 hover:bg-accent/50 flex size-10 cursor-pointer items-center justify-center rounded-full transition-all duration-200">
                <HelpCircle className="size-4.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">Help</TooltipContent>
          </Tooltip>

          {/* Avatar / Logout */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => signOut({ redirectUrl: "/" })}
                className="bg-primary text-primary-foreground flex size-10 cursor-pointer items-center justify-center rounded-full text-sm font-semibold transition-opacity hover:opacity-80"
                aria-label="Log out"
              >
                GH
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">Log Out</TooltipContent>
          </Tooltip>
        </div>
      </aside>
    </TooltipProvider>
  );
}
