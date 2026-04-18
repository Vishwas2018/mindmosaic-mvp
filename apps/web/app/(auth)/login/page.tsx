import { AuthCard } from "@/components/auth/AuthCard";

export const metadata = { title: "Sign in — MindMosaic" };

export default function LoginPage() {
  return <AuthCard initialView="sign-in" />;
}
