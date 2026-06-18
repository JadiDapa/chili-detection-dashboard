import { LiveCamera } from "@/components/root/LiveCamera";
import PageHeader from "@/components/root/PageHeader";
import SessionOverview from "@/components/root/sessions/SessionOverview";
import "swiper/css";
import "swiper/css/free-mode";
import SessionCaptures from "@/components/root/sessions/SessionCaptures";
import { SessionService } from "@/server/services/session.service";
import SessionControl from "@/components/root/sessions/SessionControl";

// Always render fresh from the DB so a just-created session is available on
// first navigation (no stale Full Route / Router Cache "Session Not Found").
export const dynamic = "force-dynamic";

export default async function DashboardPage({
  params,
}: {
  params: { id: string };
}) {
  const p = await params;

  const session = await SessionService.getById(Number(p.id));

  if (!session) {
    return (
      <main className="min-h-screen w-full space-y-8 overflow-hidden border bg-white p-4 md:rounded-2xl lg:p-6">
        <PageHeader title="Session Not Found" subtitle="Session not found" />
      </main>
    );
  }

  return (
    <main className="min-h-screen w-full space-y-8 overflow-hidden border bg-white p-4 md:rounded-2xl lg:p-6">
      {/* PAGE HEADER */}
      <div className="flex flex-col items-start justify-between gap-4 lg:flex-row lg:items-center">
        <PageHeader
          title={`Session #${session?.title}`}
          subtitle="Control and monitor your session details here."
        />

        <div className="flex gap-3">
          <SessionControl />
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-10">
        {/* LIVE CAMERA */}
        <LiveCamera />
        <SessionOverview session={session} />
      </div>

      {/* HISTORY SECTION */}
      <SessionCaptures captures={session.captures} id={p.id} />
    </main>
  );
}
