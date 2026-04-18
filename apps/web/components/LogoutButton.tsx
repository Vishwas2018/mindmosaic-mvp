"use client";

import { signOutAction } from "@/lib/auth/actions";

export default function LogoutButton() {
  return (
    <form action={signOutAction}>
      <button
        type="submit"
        className="text-sm text-[#7C7399] hover:text-[#5925a8] font-medium transition-colors"
      >
        Sign out
      </button>
    </form>
  );
}
