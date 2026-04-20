import { createServerClient } from "@/lib/supabase/server";
import LogoutButton from "@/components/LogoutButton";

export default async function DashboardPage() {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  const displayName =
    (user?.user_metadata?.["full_name"] as string | undefined) ??
    user?.email ??
    "there";

  return (
    <main className="max-w-5xl mx-auto p-6 md:p-10">
      {/* Nav */}
      <header className="flex items-center justify-between mb-10">
        <span className="text-lg font-extrabold tracking-tight">
          <span className="text-brand-500">Mind</span>
          <span style={{ color: "#ef6843" }}>Mosaic</span>
        </span>
        <LogoutButton />
      </header>

      {/* Welcome */}
      <h1 className="text-2xl font-bold text-brand-900 mb-1">
        Welcome back, {displayName.split(" ")[0]}
      </h1>
      <p className="text-sm text-slate-500 mb-8">{user?.email}</p>

      {/* Empty state card */}
      <div className="rounded-2xl border border-slate-100 bg-white p-12 text-center">
        <div className="text-4xl mb-4">👤</div>
        <h2 className="text-base font-bold text-brand-900 mb-2">
          Add your first child to get started
        </h2>
        <p className="text-sm text-slate-500 mb-6 max-w-xs mx-auto">
          Once you add a child, you&apos;ll see their exam progress, learning plan,
          and session history here.
        </p>
        <button
          disabled
          title="Child management built in PR 4"
          className="px-6 py-2.5 bg-brand-500 text-white rounded-xl text-sm font-semibold opacity-50 cursor-not-allowed"
        >
          Add child
        </button>
      </div>
    </main>
  );
}
