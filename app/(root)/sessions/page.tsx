import PageHeader from "@/components/root/PageHeader";
import { Input } from "@/components/ui/input";
import SessionCard from "@/components/root/sessions/SessionCard";
import CreateSessionDialog from "@/components/root/sessions/CreateSessionDialog";
import { SessionService } from "@/server/services/session.service";
import { Search } from "lucide-react";

type PageProps = {
  searchParams?: {
    year?: string;
    month?: string;
    q?: string;
    status?: string;
  };
};

export default async function SessionsPage({ searchParams }: PageProps) {
  const params = await searchParams;

  const q = params?.q ?? "";

  const sessions = await SessionService.list();

  return (
    <main className="min-h-full w-full space-y-8 border bg-white p-4 md:rounded-2xl lg:p-6">
      <div className="flex flex-col items-start justify-between gap-4 lg:flex-row lg:items-center">
        <PageHeader
          title="Session List"
          subtitle="These are all the sessions that you have created!"
        />

        <div className="flex gap-3">
          <CreateSessionDialog />
        </div>
      </div>

      {/* SEARCH BAR */}
      <div>
        <div className="bg-card flex w-full items-center justify-between rounded-2xl border p-2 sm:px-6">
          <div className="bg-card flex w-full items-center gap-3 rounded-full border px-4 py-1 sm:w-100">
            <Search />
            <Input
              placeholder="Search Session Name..."
              className="border-none bg-transparent p-0 text-sm shadow-none focus-visible:ring-0"
              value={q}
            />
          </div>
        </div>
      </div>

      {/* REGION LIST */}
      {sessions.length ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {sessions.map((session) => (
            <SessionCard key={session.id} session={session} />
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground mt-6">
          No sessions found for &quot;{q}&quot;
        </p>
      )}
    </main>
  );
}
