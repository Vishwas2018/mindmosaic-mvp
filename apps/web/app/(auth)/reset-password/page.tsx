import type { Metadata } from "next";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";

export const metadata: Metadata = { title: "Reset Password — MindMosaic" };

export default function ResetPasswordPage({
  searchParams,
}: {
  searchParams: { code?: string };
}) {
  return <ResetPasswordForm code={searchParams.code} />;
}
