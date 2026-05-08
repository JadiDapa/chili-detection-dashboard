import { LiveCamera } from "@/components/root/LiveCamera";
import PageHeader from "@/components/root/PageHeader";
import SessionOverview from "@/components/root/sessions/SessionOverview";
import "swiper/css";
import "swiper/css/free-mode";
import SessionCaptures from "@/components/root/sessions/SessionCaptures";
import { SessionService } from "@/server/services/leave.service";
import SessionControl from "@/components/root/sessions/SessionControl";

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
      <div className="flex flex-col items-center justify-between lg:flex-row">
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
