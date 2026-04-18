"use server";

import { revalidatePath } from "next/cache";
import { redirect }       from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { validateSignIn, validateSignUp } from "./validation";
import type { AuthResult, SignInFields, SignUpFields } from "./types";

function mapError(msg: string): string {
  if (msg.includes("Invalid login credentials")) return "Incorrect email or password";
  if (msg.includes("Email not confirmed"))        return "Please verify your email first";
  if (msg.includes("already registered"))         return "An account with this email already exists";
  if (msg.includes("rate limit"))                 return "Too many attempts — please wait";
  return "Something went wrong — please try again";
}

export async function signInAction(
  fields: SignInFields
): Promise<AuthResult<{ redirectTo: string }>> {
  const err = validateSignIn(fields);
  if (err) return { success: false, error: err };

  const supabase = createServerClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email:    fields.email.trim().toLowerCase(),
    password: fields.password,
  });

  if (error) return { success: false, error: mapError(error.message) };

  const role = (data.user?.app_metadata?.["role"] as string) ?? "parent";
  return { success: true, data: { redirectTo: role === "student" ? "/home" : "/dashboard" } };
}

export async function signUpAction(
  fields: SignUpFields
): Promise<AuthResult<void>> {
  const errors = validateSignUp(fields);
  if (Object.keys(errors).length > 0) {
    return { success: false, error: Object.values(errors)[0]! };
  }

  const supabase = createServerClient();
  const { data, error } = await supabase.auth.signUp({
    email:    fields.email.trim().toLowerCase(),
    password: fields.password,
    options: {
      data: {
        full_name: fields.displayName.trim(),
        role:      "parent",
      },
    },
  });

  if (error) return { success: false, error: mapError(error.message) };
  if (data.user?.identities?.length === 0) {
    return { success: false, error: "An account with this email already exists" };
  }
  return { success: true, data: undefined };
}

export async function forgotPasswordAction(email: string): Promise<AuthResult<void>> {
  if (!email.trim()) return { success: false, error: "Email is required" };
  const supabase = createServerClient();
  await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
    redirectTo: `${process.env["NEXT_PUBLIC_APP_URL"]}/reset-password`,
  });
  return { success: true, data: undefined };
}

export async function signOutAction(): Promise<void> {
  const supabase = createServerClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}
