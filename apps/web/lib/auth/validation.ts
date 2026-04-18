import type { SignInFields, SignUpFields, PasswordRuleSet } from "./types";

const EMAIL_RE   = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const SPECIAL_RE = /[!@#$%^&*()\-_=+[\]{};':"\\|,.<>/?`~]/;

export function evalPasswordRules(pw: string): PasswordRuleSet {
  return {
    len:     pw.length >= 8,
    upper:   /[A-Z]/.test(pw),
    lower:   /[a-z]/.test(pw),
    num:     /[0-9]/.test(pw),
    special: SPECIAL_RE.test(pw),
  };
}

export function isStrongPassword(pw: string): boolean {
  const r = evalPasswordRules(pw);
  return r.len && r.upper && r.lower && r.num && r.special;
}

export function validateSignIn(f: SignInFields): string | null {
  if (!f.email.trim())          return "Email is required";
  if (!EMAIL_RE.test(f.email))  return "Enter a valid email address";
  if (!f.password)              return "Password is required";
  return null;
}

export function validateSignUp(
  f: SignUpFields
): Partial<Record<keyof SignUpFields, string>> {
  const e: Partial<Record<keyof SignUpFields, string>> = {};
  if (f.displayName.trim().length < 1)    e.displayName     = "Display name is required";
  if (!EMAIL_RE.test(f.email))            e.email           = "Enter a valid email address";
  if (!isStrongPassword(f.password))      e.password        = "Password must meet all requirements";
  if (f.confirmPassword !== f.password)   e.confirmPassword = "Passwords do not match";
  return e;
}
