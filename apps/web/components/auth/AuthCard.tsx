"use client";

import { useState, useCallback } from "react";
import { useRouter }             from "next/navigation";
import { ForgotPasswordModal, TrialModal, ContactModal } from "./modals";
import { evalPasswordRules }     from "@/lib/auth/validation";
import { signInAction, signUpAction } from "@/lib/auth/actions";
import { MindMosaicLogo } from "@/components/branding/MindMosaicLogo";
import styles from "./auth.module.css";

// Allow the HTML `inert` attribute in JSX (@types/react experimental.d.ts uses boolean)
declare module "react" {
  interface HTMLAttributes<T> { // eslint-disable-line @typescript-eslint/no-unused-vars
    inert?: boolean;
  }
}

type Modal = "forgot" | "trial" | "contact" | null;

// ── Social button data ────────────────────────────────────────────────────────
const SOCIAL_PROVIDERS = [
  {
    key: "google",
    label: "Google",
    icon: (
      <svg viewBox="0 0 24 24" width="18" height="18">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.96 10.96 0 001 12c0 1.77.42 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
      </svg>
    ),
  },
  {
    key: "facebook",
    label: "Facebook",
    icon: (
      <svg viewBox="0 0 24 24" width="18" height="18">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" fill="#1877F2"/>
      </svg>
    ),
  },
  {
    key: "apple",
    label: "Apple",
    icon: (
      <svg viewBox="0 0 24 24" width="18" height="18">
        <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" fill="#000"/>
      </svg>
    ),
  },
  {
    key: "microsoft",
    label: "Microsoft",
    icon: (
      <svg viewBox="0 0 24 24" width="18" height="18">
        <rect x="1"  y="1"  width="10" height="10" fill="#F25022"/>
        <rect x="13" y="1"  width="10" height="10" fill="#7FBA00"/>
        <rect x="1"  y="13" width="10" height="10" fill="#00A4EF"/>
        <rect x="13" y="13" width="10" height="10" fill="#FFB900"/>
      </svg>
    ),
  },
] as const;

// ── Password rule list ────────────────────────────────────────────────────────
const PW_RULES = [
  { key: "len"     as const, label: "8+ chars"     },
  { key: "upper"   as const, label: "Uppercase"    },
  { key: "lower"   as const, label: "Lowercase"    },
  { key: "num"     as const, label: "Number"       },
  { key: "special" as const, label: "Special char" },
];

// ── Eye icon ──────────────────────────────────────────────────────────────────
function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg viewBox="0 0 24 24">
      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/>
      <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
      <path d="M14.12 14.12a3 3 0 01-4.24-4.24"/>
    </svg>
  ) : (
    <svg viewBox="0 0 24 24">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  );
}

// ── AuthCard ──────────────────────────────────────────────────────────────────
export function AuthCard({ initialView = "sign-in" }: { initialView?: "sign-in" | "sign-up" }) {
  const router = useRouter();

  const [view,      setView]     = useState<"sign-in" | "sign-up">(initialView);
  const [loginTab,  setLoginTab] = useState<"parent" | "student">("parent");
  const [modal,     setModal]    = useState<Modal>(null);

  // Sign-in state (parent)
  const [siEmail,    setSiEmail]    = useState("");
  const [siPassword, setSiPassword] = useState("");
  const [siShowPw,   setSiShowPw]   = useState(false);
  const [siError,    setSiError]    = useState("");
  const [siLoading,  setSiLoading]  = useState(false);

  // Student login state
  const [stUsername, setStUsername] = useState("");
  const [stPin,      setStPin]      = useState("");
  const [stShowPin,  setStShowPin]  = useState(false);
  const [stError,    setStError]    = useState("");
  const [stLoading,  setStLoading]  = useState(false);

  // Sign-up state
  const [suName,     setSuName]     = useState("");
  const [suEmail,    setSuEmail]    = useState("");
  const [suPassword, setSuPassword] = useState("");
  const [suConfirm,  setSuConfirm]  = useState("");
  const [suShowPw,   setSuShowPw]   = useState(false);
  const [suShowCf,   setSuShowCf]   = useState(false);
  const [suError,    setSuError]    = useState("");
  const [suLoading,  setSuLoading]  = useState(false);

  const pwRules     = evalPasswordRules(suPassword);
  const confirmHint: "success" | "error" | null =
    suConfirm === "" ? null : suConfirm === suPassword ? "success" : "error";
  const suFormValid =
    Object.values(pwRules).every(Boolean) &&
    confirmHint === "success" &&
    suName.trim().length > 0 &&
    suEmail.trim().length > 0;

  const switchView = useCallback((next: "sign-in" | "sign-up") => {
    setSiEmail(""); setSiPassword(""); setSiShowPw(false); setSiError(""); setSiLoading(false);
    setStUsername(""); setStPin(""); setStShowPin(false); setStError(""); setStLoading(false);
    setSuName(""); setSuEmail(""); setSuPassword(""); setSuConfirm("");
    setSuShowPw(false); setSuShowCf(false); setSuError(""); setSuLoading(false);
    setLoginTab("parent");
    setView(next);
  }, []);

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setSiLoading(true); setSiError("");
    const result = await signInAction({ email: siEmail, password: siPassword });
    if (result.success) {
      router.push(result.data.redirectTo);
    } else {
      setSiError(result.error);
      setSiLoading(false);
    }
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setSuLoading(true); setSuError("");
    const result = await signUpAction({
      displayName: suName, email: suEmail,
      password: suPassword, confirmPassword: suConfirm,
    });
    if (result.success) {
      router.push(result.data.redirectTo);
    } else {
      setSuError(result.error);
      setSuLoading(false);
    }
  }

  async function handleStudentLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!stUsername.trim() || !/^\d{6}$/.test(stPin)) return;
    setStLoading(true); setStError("");
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/student-login`,
        {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({ username: stUsername.trim(), pin: stPin }),
        }
      );
      const data = await res.json() as { access_token?: string; refresh_token?: string; error?: string; message?: string };
      if (!res.ok) {
        if (res.status === 429) {
          setStError("Too many attempts. Please try again in 15 minutes.");
        } else {
          setStError("Invalid username or PIN.");
        }
        setStLoading(false);
        return;
      }
      if (data.access_token && data.refresh_token) {
        const { createBrowserSupabaseClient } = await import("@/lib/supabase/browser");
        const supabase = createBrowserSupabaseClient();
        await supabase.auth.setSession({ access_token: data.access_token, refresh_token: data.refresh_token });
        router.push("/dashboard");
      }
    } catch {
      setStError("Something went wrong. Please try again.");
      setStLoading(false);
    }
  }

  const isSignIn = view === "sign-in";

  return (
    <>
      <div className={styles.authPageWrapper}>
        {/* Brand pill (top-right) */}
        <a href="/" className="brand-pill" aria-label="MindMosaic home">
          <MindMosaicLogo className="brand-logo-img" />
        </a>

        {/* Back to home (top-left) */}
        <a href="/" className="back-to-home">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M19 12H5"/>
            <path d="M12 19l-7-7 7-7"/>
          </svg>
          Back to Home
        </a>

        {/* ── Main card ─────────────────────────────────────── */}
        <div className={`${styles.authCard} ${isSignIn ? styles.signIn : styles.signUp}`}>
          <div className={styles.authRow}>

            {/* ── Sign-up column (LEFT) — inert when sign-in is active ── */}
            <div className={styles.authCol} {...(isSignIn ? { inert: true } : {})}>
              <div className={`${styles.formCard} ${!isSignIn ? styles.active : ""}`}>
                <div className={styles.formHeader}>
                  <h1>Create your account</h1>
                  <p>Join thousands of students building exam confidence with MindMosaic.</p>
                </div>

                {suError && <div className="auth-notice error" role="alert">{suError}</div>}

                <form onSubmit={handleSignUp} noValidate>
                  {/* Display name */}
                  <div className="input-group">
                    <input id="su-name" type="text" placeholder=" " autoComplete="name"
                      value={suName} onChange={e => setSuName(e.target.value)} />
                    <label className="floating-label" htmlFor="su-name">Display name</label>
                    <span className="input-icon">
                      <svg viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    </span>
                  </div>

                  {/* Email */}
                  <div className="input-group">
                    <input id="su-email" type="email" placeholder=" " autoComplete="email"
                      value={suEmail} onChange={e => setSuEmail(e.target.value)} />
                    <label className="floating-label" htmlFor="su-email">Email address</label>
                    <span className="input-icon">
                      <svg viewBox="0 0 24 24"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M22 7l-10 6L2 7"/></svg>
                    </span>
                  </div>

                  {/* Password + rules */}
                  <div className="input-group">
                    <input id="su-password" type={suShowPw ? "text" : "password"} placeholder=" "
                      autoComplete="new-password"
                      value={suPassword} onChange={e => setSuPassword(e.target.value)} />
                    <label className="floating-label" htmlFor="su-password">Password</label>
                    <span className="input-icon">
                      <svg viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
                    </span>
                    <button type="button" className="toggle-visibility"
                      aria-label={suShowPw ? "Hide password" : "Show password"}
                      onClick={() => setSuShowPw(v => !v)}>
                      <EyeIcon open={suShowPw} />
                    </button>
                    <ul className="pw-rules" aria-live="polite">
                      {PW_RULES.map(({ key, label }) => (
                        <li key={key} className={pwRules[key] ? "ok" : ""}>
                          <span className="rule-icon">
                            {pwRules[key]
                              ? <svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
                              : <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/></svg>
                            }
                          </span>
                          {label}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Confirm password */}
                  <div className="input-group">
                    <input id="su-confirm" type={suShowCf ? "text" : "password"} placeholder=" "
                      autoComplete="new-password"
                      value={suConfirm} onChange={e => setSuConfirm(e.target.value)} />
                    <label className="floating-label" htmlFor="su-confirm">Confirm password</label>
                    <span className="input-icon">
                      <svg viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
                    </span>
                    <button type="button" className="toggle-visibility"
                      aria-label={suShowCf ? "Hide password" : "Show password"}
                      onClick={() => setSuShowCf(v => !v)}>
                      <EyeIcon open={suShowCf} />
                    </button>
                    {confirmHint && (
                      <div className={`field-hint ${confirmHint}`}>
                        {confirmHint === "success" ? "Passwords match ✓" : "Passwords don\u2019t match"}
                      </div>
                    )}
                  </div>

                  <button type="submit" className="btn-primary" disabled={suLoading || !suFormValid}>
                    {suLoading ? "Creating account…" : "Create account"}
                  </button>
                </form>

                <p className="trial-link">
                  Just exploring?
                  <a href="#" onClick={e => { e.preventDefault(); setModal("trial"); }}>
                    Try sample exams →
                  </a>
                </p>
                <p className="form-footer">
                  Already have an account?&nbsp;
                  <button type="button" className="link-btn" onClick={() => switchView("sign-in")}>
                    Sign in
                  </button>
                </p>

                <div className="social-divider">Or continue with</div>
                <div className="social-list">
                  {SOCIAL_PROVIDERS.map(({ key, label, icon }) => (
                    <button key={key} type="button" className="social-btn"
                      onClick={() => setModal("contact")}
                      aria-label={`Sign up with ${label}`}>
                      <span className="social-icon">{icon}</span>
                      <span className="social-label">Sign up with {label}</span>
                    </button>
                  ))}
                </div>

                <div className="help-block">
                  <a href="#" onClick={e => { e.preventDefault(); setModal("contact"); }}>Need help?</a>
                  <span className="sep" />
                  <a href="#" onClick={e => { e.preventDefault(); setModal("contact"); }}>Contact us</a>
                </div>
              </div>
            </div>

            {/* ── Sign-in column (RIGHT) — inert when sign-up is active ── */}
            <div className={styles.authCol} {...(!isSignIn ? { inert: true } : {})}>
              <div className={`${styles.formCard} ${isSignIn ? styles.active : ""}`}>
                <div className={styles.formHeader}>
                  <h1>{loginTab === "student" ? "Student sign in" : "Welcome back"}</h1>
                  <p>{loginTab === "student" ? "Enter your username and PIN to continue." : "Sign in to continue your learning journey."}</p>
                </div>

                {/* ── Login tab toggle ─── */}
                <div style={{ display: "flex", gap: ".3rem", marginBottom: ".75rem", background: "var(--surface-alt)", borderRadius: "10px", padding: ".25rem" }}>
                  {(["parent", "student"] as const).map(tab => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => { setLoginTab(tab); setSiError(""); setStError(""); }}
                      style={{
                        flex: 1, height: "34px", border: "none", cursor: "pointer", borderRadius: "8px", fontSize: ".76rem",
                        fontWeight: 600, fontFamily: "inherit", transition: "all .2s",
                        background: loginTab === tab ? "var(--surface)" : "transparent",
                        color: loginTab === tab ? "var(--primary)" : "var(--muted)",
                        boxShadow: loginTab === tab ? "0 1px 4px rgba(89,37,168,.1)" : "none",
                      }}
                    >
                      {tab === "parent" ? "Parent / Teacher" : "Student"}
                    </button>
                  ))}
                </div>

                {/* ── Parent / Teacher sign-in ── */}
                {loginTab === "parent" && (
                  <>
                    {siError && <div className="auth-notice error" role="alert">{siError}</div>}
                    <form onSubmit={handleSignIn} noValidate>
                      <div className="input-group">
                        <input id="si-email" type="email" placeholder=" " autoComplete="email"
                          value={siEmail} onChange={e => setSiEmail(e.target.value)} />
                        <label className="floating-label" htmlFor="si-email">Email address</label>
                        <span className="input-icon">
                          <svg viewBox="0 0 24 24"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M22 7l-10 6L2 7"/></svg>
                        </span>
                      </div>
                      <div className="input-group">
                        <input id="si-password" type={siShowPw ? "text" : "password"} placeholder=" "
                          autoComplete="current-password"
                          value={siPassword} onChange={e => setSiPassword(e.target.value)} />
                        <label className="floating-label" htmlFor="si-password">Password</label>
                        <span className="input-icon">
                          <svg viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
                        </span>
                        <button type="button" className="toggle-visibility"
                          aria-label={siShowPw ? "Hide password" : "Show password"}
                          onClick={() => setSiShowPw(v => !v)}>
                          <EyeIcon open={siShowPw} />
                        </button>
                      </div>
                      <div className="inline-row">
                        <span />
                        <button type="button" className="link-btn" onClick={() => setModal("forgot")}>
                          Forgot password?
                        </button>
                      </div>
                      <button type="submit" className="btn-primary" disabled={siLoading}>
                        {siLoading ? "Signing in…" : "Sign in"}
                      </button>
                    </form>
                  </>
                )}

                {/* ── Student sign-in ── */}
                {loginTab === "student" && (
                  <>
                    {stError && <div className="auth-notice error" role="alert">{stError}</div>}
                    <form onSubmit={handleStudentLogin} noValidate>
                      <div className="input-group">
                        <input id="st-username" type="text" placeholder=" " autoComplete="username"
                          value={stUsername} onChange={e => setStUsername(e.target.value)} />
                        <label className="floating-label" htmlFor="st-username">Username</label>
                        <span className="input-icon">
                          <svg viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                        </span>
                      </div>
                      <div className="input-group">
                        <input id="st-pin" type={stShowPin ? "text" : "password"} placeholder=" "
                          autoComplete="current-password" inputMode="numeric"
                          maxLength={6} pattern="\d{6}"
                          value={stPin} onChange={e => setStPin(e.target.value.replace(/\D/g, "").slice(0, 6))} />
                        <label className="floating-label" htmlFor="st-pin">6-digit PIN</label>
                        <span className="input-icon">
                          <svg viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
                        </span>
                        <button type="button" className="toggle-visibility"
                          aria-label={stShowPin ? "Hide PIN" : "Show PIN"}
                          onClick={() => setStShowPin(v => !v)}>
                          <EyeIcon open={stShowPin} />
                        </button>
                      </div>
                      <button type="submit" className="btn-primary"
                        disabled={stLoading || stUsername.trim().length < 3 || stPin.length !== 6}>
                        {stLoading ? "Signing in…" : "Sign in"}
                      </button>
                    </form>
                  </>
                )}

                <p className="trial-link">
                  New here?
                  <a href="#" onClick={e => { e.preventDefault(); setModal("trial"); }}>
                    Start a free trial →
                  </a>
                </p>
                <p className="form-footer">
                  Don&apos;t have an account?&nbsp;
                  <button type="button" className="link-btn" onClick={() => switchView("sign-up")}>
                    Create an account
                  </button>
                </p>

                {loginTab === "parent" && (
                  <>
                    <div className="social-divider">Or continue with</div>
                    <div className="social-list">
                      {SOCIAL_PROVIDERS.map(({ key, label, icon }) => (
                        <button key={key} type="button" className="social-btn"
                          onClick={() => setModal("contact")}
                          aria-label={`Sign in with ${label}`}>
                          <span className="social-icon">{icon}</span>
                          <span className="social-label">Sign in with {label}</span>
                        </button>
                      ))}
                    </div>
                  </>
                )}

                <div className="help-block">
                  <a href="#" onClick={e => { e.preventDefault(); setModal("contact"); }}>Need help?</a>
                  <span className="sep" />
                  <a href="#" onClick={e => { e.preventDefault(); setModal("contact"); }}>Contact us</a>
                </div>
              </div>
            </div>

          </div>

          {/* ── Overlay text (z-index 8) ─────────────────────── */}
          <div className={styles.contentRow}>
            {/* Left overlay — sign-in text (on blob when in sign-in mode) */}
            <div className={`${styles.overlayCol} ${styles.overlaySignin}`}>
              <div className={styles.overlayText}>
                <div className={styles.overlayLogo}>
                  <MindMosaicLogo className={styles.overlayLogoImg} />
                </div>
                <h2>Your streak is waiting</h2>
                <p>Every session sharpens your edge. Keep the momentum going.</p>
                <ul className={styles.overlayBenefits}>
                  <li>
                    <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
                    Resume exactly where you left off
                  </li>
                  <li>
                    <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
                    Your adaptive quiz path is ready
                  </li>
                  <li>
                    <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
                    Pinpoint insights on your weak spots
                  </li>
                </ul>
              </div>
            </div>

            {/* Right overlay — sign-up text (on blob when in sign-up mode) */}
            <div className={`${styles.overlayCol} ${styles.overlaySignup}`}>
              <div className={styles.overlayText}>
                <div className={styles.overlayLogo}>
                  <MindMosaicLogo className={styles.overlayLogoImg} />
                </div>
                <h2>Begin your journey</h2>
                <p>Build your personalised learning path and master exam prep that actually sticks.</p>
                <ul className={styles.overlayBenefits}>
                  <li>
                    <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
                    AI-powered personalised learning
                  </li>
                  <li>
                    <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
                    Daily progress tracking &amp; streaks
                  </li>
                  <li>
                    <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
                    Exam-ready confidence, faster
                  </li>
                </ul>
              </div>
            </div>
          </div>

        </div>
      </div>

      {modal === "forgot"  && <ForgotPasswordModal onClose={() => setModal(null)} />}
      {modal === "trial"   && <TrialModal          onClose={() => setModal(null)} />}
      {modal === "contact" && <ContactModal        onClose={() => setModal(null)} />}
    </>
  );
}
