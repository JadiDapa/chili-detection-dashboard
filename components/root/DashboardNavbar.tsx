"use client";

import { Bell, Search, Info, ChevronDown } from "lucide-react";
import Image from "next/image";
import { User } from "@/generated/prisma";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const menuItems = [
  { title: "Dashboard", href: "/" },
  { title: "Environments", href: "/environments" },
  { title: "Plants", href: "/plants" },
  { title: "Schedule", href: "/schedule" },
  { title: "Dataset", href: "/dataset" },
];

export default function Navbar({ user }: { user: User }) {
  const pathname = usePathname();

  return (
    <header className="hidden w-full grid-cols-3 items-center justify-between rounded-2xl px-2 py-3 md:grid">
      {/* Logo */}
      <Link
        href="/"
        className="group bg-card flex max-w-fit items-center gap-2 rounded-full p-1 pe-3"
      >
        <div className="relative flex size-11 items-center justify-center overflow-hidden rounded-full">
          <Image
            src="/hme-logo.png"
            fill
            className="object-contain object-center p-1"
            alt="UNSRI"
          />
        </div>
        <span className="text-foreground text-xl font-black tracking-wide uppercase">
          TE-UNSRI
        </span>
      </Link>

      {/* Center Nav */}
      <nav className="border-border bg-card flex items-center gap-1 justify-self-center rounded-full px-2 py-1.5">
        {menuItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "rounded-full px-4 py-2 text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-foreground text-background shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {item.title}
            </Link>
          );
        })}
      </nav>

      {/* Right Side: Icons + User */}
      <div className="flex items-center justify-end gap-1.5">
        {/* Icon buttons */}
        <div className="bg-card flex items-center justify-end gap-2 rounded-full p-1.5">
          <button className="text-muted-foreground hover:bg-muted hover:text-foreground rounded-full p-2 transition-colors">
            <Search className="size-4" />
          </button>
          <button className="text-muted-foreground hover:bg-muted hover:text-foreground relative rounded-full p-2 transition-colors">
            <Bell className="size-4" />
            {/* Optional notification dot */}
            <span className="absolute top-1.5 right-1.5 size-1.5 rounded-full bg-green-500" />
          </button>
          <button className="text-muted-foreground hover:bg-muted hover:text-foreground rounded-full p-2 transition-colors">
            <Info className="size-4" />
          </button>
        </div>

        {/* Divider */}
        <div className="mx-1 h-8 w-px bg-slate-300" />

        {/* Profile */}
        <Link
          href={`/users/${user.username}`}
          className="hover:bg-muted bg-card flex cursor-pointer items-center gap-2 rounded-full px-2 py-1 transition-colors"
        >
          <Image
            src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ4YreOWfDX3kK-QLAbAL4ufCPc84ol2MA8Xg&s"
            width={34}
            height={34}
            alt="avatar"
            className="border-border rounded-full border object-cover"
          />
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-semibold">
              {user?.name || "User"}
            </span>
            <span className="text-muted-foreground text-xs">
              {user?.role || "User"}
            </span>
          </div>
          <ChevronDown className="text-muted-foreground ml-1 size-4" />
        </Link>
      </div>
    </header>
  );
}
