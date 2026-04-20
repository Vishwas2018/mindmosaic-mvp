"use client";

import { signOutAction } from "@/lib/auth/actions";

export default function LogoutButton() {
  return (
    <form action={signOutAction}>
      <button
        type="submit"
        className="text-sm text-slate-500 hover:text-brand-500 font-medium transition-colors"
      >
        Sign out
      </button>
    </form>
  );
}
