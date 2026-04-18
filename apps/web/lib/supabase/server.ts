import { createServerClient as _createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Use bracket notation: tsconfig has noPropertyAccessFromIndexSignature
const SUPABASE_URL  = process.env["NEXT_PUBLIC_SUPABASE_URL"]!;
const SUPABASE_ANON = process.env["NEXT_PUBLIC_SUPABASE_ANON_KEY"]!;

export function createServerClient() {
  const cookieStore = cookies();

  return _createServerClient(SUPABASE_URL, SUPABASE_ANON, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Server Component — cookie writes are no-ops; middleware handles refresh
        }
      },
    },
  });
}
