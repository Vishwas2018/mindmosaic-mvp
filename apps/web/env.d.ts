declare namespace NodeJS {
  interface ProcessEnv {
    readonly NEXT_PUBLIC_SUPABASE_URL:      string;
    readonly NEXT_PUBLIC_SUPABASE_ANON_KEY: string;
    /** SERVER-SIDE ONLY — never reference in client components, "use client" files, or middleware */
    readonly SUPABASE_SERVICE_ROLE_KEY:     string;
    readonly NEXT_PUBLIC_APP_URL:           string;
  }
}
