"use client";

import {
  Home,
  Settings,
  Moon,
  Sun,
  HelpCircle,
  Activity,
  Leaf,
  Cylinder,
  DatabaseZapIcon,
  Menu,
  LogOut,
} from "lucide-react";
import { usePathname } from "next/navigation";
import { useClerk } from "@clerk/nextjs";
import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { User } from "@/generated/prisma";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const menuItems = [
  { title: "Dashboard", url: "/", icon: Home },
  { title: "Environments", url: "/environments", icon: Activity },
  { title: "Plants", url: "/plants", icon: Leaf },
  { title: "Dataset Collection", url: "/dataset", icon: DatabaseZapIcon },
];

// Primary destinations shown in the bottom tab bar (kept to 5 for thumb reach).
const bottomBarItems = menuItems;

const isActivePath = (pathname: string, url: string) =>
  url === "/"
    ? pathname === "/"
    : pathname === url || pathname.startsWith(url + "/");

export default function MobileNav({ user }: { user: User }) {
  const pathname = usePathname();
  const { signOut } = useClerk();
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => setMounted(true), []);

  const isLight = mounted ? resolvedTheme === "light" : false;
  const isDark = mounted ? resolvedTheme === "dark" : false;

  // Close the drawer whenever the route changes.
  useEffect(() => setOpen(false), [pathname]);

  return (
    <>
      {/* ── Top bar (mobile / tablet only) ── */}
      <header className="bg-card sticky top-0 z-40 flex items-center justify-between rounded-2xl px-3 py-2 md:hidden">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="bg-primary relative flex size-9 items-center justify-center overflow-hidden rounded-full">
            <Image
              src="https://icon2.cleanpng.com/20190216/yfi/kisspng-sriwijaya-university-syiah-kuala-university-univer-5c681318068569.0150597415503245040267.jpg"
              fill
              className="object-contain object-center p-1"
              alt="UNSRI"
            />
          </div>
          <span className="text-foreground text-lg font-black tracking-wide uppercase">
            ELEKTRO
          </span>
        </Link>

        {/* Avatar + Hamburger */}
        <div className="flex items-center gap-2">
          <Image
            src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ4YreOWfDX3kK-QLAbAL4ufCPc84ol2MA8Xg&s"
            width={32}
            height={32}
            alt="avatar"
            className="border-border size-8 rounded-full border object-cover"
          />
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <button
                className="text-muted-foreground hover:bg-muted hover:text-foreground rounded-full p-2 transition-colors"
                aria-label="Open menu"
              >
                <Menu className="size-5" />
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80 max-w-[85vw] gap-0 p-0">
              <SheetHeader className="border-b">
                <SheetTitle className="flex items-center gap-3">
                  <Image
                    src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ4YreOWfDX3kK-QLAbAL4ufCPc84ol2MA8Xg&s"
                    width={40}
                    height={40}
                    alt="avatar"
                    className="border-border size-10 rounded-full border object-cover"
                  />
                  <span className="flex flex-col leading-tight">
                    <span className="text-sm font-semibold">
                      {user?.name || "User"}
                    </span>
                    <span className="text-muted-foreground text-xs font-normal">
                      {user?.role || "User"}
                    </span>
                  </span>
                </SheetTitle>
              </SheetHeader>

              {/* Menu links */}
              <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
                {menuItems.map((item) => {
                  const active = isActivePath(pathname, item.url);
                  return (
                    <Link
                      key={item.title}
                      href={item.url}
                      className={cn(
                        "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                        active
                          ? "bg-foreground text-background"
                          : "text-muted-foreground hover:bg-accent hover:text-foreground",
                      )}
                    >
                      <item.icon className="size-5" />
                      {item.title}
                    </Link>
                  );
                })}

                <div className="bg-border my-2 h-px" />

                <Link
                  href="/settings"
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                    isActivePath(pathname, "/settings")
                      ? "bg-foreground text-background"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground",
                  )}
                >
                  <Settings className="size-5" />
                  Pengaturan
                </Link>
                <button className="text-muted-foreground hover:bg-accent hover:text-foreground flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors">
                  <HelpCircle className="size-5" />
                  Help
                </button>
              </nav>

              {/* Theme toggle + logout */}
              <div className="space-y-3 border-t p-3">
                <div className="bg-muted flex items-center gap-1 rounded-full p-1">
                  <button
                    onClick={() => setTheme("light")}
                    className={cn(
                      "flex flex-1 items-center justify-center gap-2 rounded-full py-2 text-sm transition-colors",
                      isLight
                        ? "bg-card text-foreground shadow-sm"
                        : "text-muted-foreground",
                    )}
                  >
                    <Sun className="size-4" /> Light
                  </button>
                  <button
                    onClick={() => setTheme("dark")}
                    className={cn(
                      "flex flex-1 items-center justify-center gap-2 rounded-full py-2 text-sm transition-colors",
                      isDark
                        ? "bg-card text-foreground shadow-sm"
                        : "text-muted-foreground",
                    )}
                  >
                    <Moon className="size-4" /> Dark
                  </button>
                </div>
                <button
                  onClick={() => signOut({ redirectUrl: "/" })}
                  className="bg-primary text-primary-foreground flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition-opacity hover:opacity-90"
                >
                  <LogOut className="size-4" /> Log Out
                </button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      {/* ── Bottom tab bar (mobile / tablet only) ── */}
      <nav className="bg-card fixed inset-x-0 bottom-0 z-40 flex items-center justify-around border-t px-1 pt-1.5 pb-[max(0.375rem,env(safe-area-inset-bottom))] md:hidden">
        {bottomBarItems.map((item) => {
          const active = isActivePath(pathname, item.url);
          return (
            <Link
              key={item.title}
              href={item.url}
              className={cn(
                "flex flex-1 flex-col items-center gap-0.5 rounded-xl py-1.5 text-[10px] font-medium transition-colors",
                active
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <span
                className={cn(
                  "flex size-9 items-center justify-center rounded-full transition-colors",
                  active && "bg-foreground text-background",
                )}
              >
                <item.icon className="size-4.5" />
              </span>
              <span className="max-w-full truncate">{item.title}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
