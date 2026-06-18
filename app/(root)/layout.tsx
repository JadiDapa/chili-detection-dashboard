import { ReactNode } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import DashboardSidebar from "@/components/root/DashboardSidebar";
import DashboardNavbar from "@/components/root/DashboardNavbar";
import MobileNav from "@/components/root/MobileNav";
import { getCurrentUser } from "../actions/user.actions";

type Props = {
  children: ReactNode;
};
export default async function DashboardLayout({ children }: Props) {
  const user = await getCurrentUser();

  return (
    <SidebarProvider>
      <div className="bg-muted relative flex min-h-screen w-full flex-col">
        {/* Mobile / tablet navigation: top bar with drawer + bottom tab bar */}
        <MobileNav user={user} />

        {/* Navbar spans full width on top (desktop only) */}
        <div className="hidden px-2 pt-2 md:block">
          <DashboardNavbar user={user} />
        </div>

        {/* Sidebar + content side by side below */}
        <div className="flex flex-1 overflow-hidden md:ps-20">
          <div className="fixed left-0">
            <DashboardSidebar user={user} />
          </div>
          {/* pb on mobile leaves room for the fixed bottom tab bar */}
          <main className="flex w-full flex-col gap-2 overflow-hidden px-2 pt-2 pb-24 md:px-0 md:pt-2 md:pe-2 md:pb-2">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
