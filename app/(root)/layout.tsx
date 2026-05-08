import { ReactNode } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import DashboardSidebar from "@/components/root/DashboardSidebar";
import DashboardNavbar from "@/components/root/DashboardNavbar";
import { getCurrentUser } from "../actions/user.actions";

type Props = {
  children: ReactNode;
};
export default async function DashboardLayout({ children }: Props) {
  const user = await getCurrentUser();

  return (
    <SidebarProvider>
      <div className="bg-muted relative flex min-h-screen w-full flex-col">
        {/* Navbar spans full width on top */}
        <div className="px-2 pt-2">
          <DashboardNavbar user={user} />
        </div>

        {/* Sidebar + content side by side below */}
        <div className="flex flex-1 overflow-hidden ps-20">
          <div className="fixed left-0">
            <DashboardSidebar user={user} />
          </div>
          <main className="flex w-full flex-col gap-2 overflow-hidden py-2 pe-2">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
