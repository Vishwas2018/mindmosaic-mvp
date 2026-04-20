import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";

export default async function ParentLayout({ children }: { children: React.ReactNode }) {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const role = (user.app_metadata?.["role"] as string) ?? "parent";
  if (role === "student") redirect("/home");

  return <div className="min-h-screen bg-slate-50">{children}</div>;
}
