"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";
import { resetPasswordAction } from "@/lib/auth/actions";
import { evalPasswordRules } from "@/lib/auth/validation";
import { MindMosaicLogo } from "@/components/branding/MindMosaicLogo";

const PW_RULES = [
  { key: "len"     as const, label: "8+ chars"     },
  { key: "upper"   as const, label: "Uppercase"    },
  { key: "lower"   as const, label: "Lowercase"    },
  { key: "num"     as const, label: "Number"       },
  { key: "special" as const, label: "Special char" },
];

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

export function ResetPasswordForm({ code }: { code?: string }) {
  const router = useRouter();

  const [ready,         setReady]         = useState(false);
  const [exchangeError, setExchangeError] = useState("");
  const [password,      setPassword]      = useState("");
  const [confirm,       setConfirm]       = useState("");
  const [showPw,        setShowPw]        = useState(false);
  const [showCf,        setShowCf]        = useState(false);
  const [error,         setError]         = useState("");
  const [loading,       setLoading]       = useState(false);
  const [success,       setSuccess]       = useState(false);
  const firstInputRef = useRef<HTMLInputElement>(null);

  // Exchange the one-time code for a session before allowing password update
  useEffect(() => {
    if (!code) {
      setExchangeError("Invalid or expired reset link. Please request a new one.");
      return;
    }
    const supabase = createBrowserSupabaseClient();
    void (async () => {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) {
        setExchangeError("This reset link has expired or already been used. Please request a new one.");
      } else {
        setReady(true);
      }
    })();
  }, [code]);

  // Focus the first input once the form is ready
  useEffect(() => {
    if (ready) firstInputRef.current?.focus();
  }, [ready]);

  const pwRules   = evalPasswordRules(password);
  const allValid  = Object.values(pwRules).every(Boolean);
  const confirmOk = confirm !== "" && confirm === password;
  const canSubmit = allValid && confirmOk && !loading;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setLoading(true);
    setError("");
    const result = await resetPasswordAction(password);
    if (result.success) {
      setSuccess(true);
      setTimeout(() => router.push("/login"), 2500);
    } else {
      setError(result.error);
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "2rem",
      background: "var(--bg)",
    }}>
      <div style={{ width: "100%", maxWidth: "26rem" }}>

        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <a href="/" aria-label="MindMosaic home">
            <MindMosaicLogo
              className="brand-logo-img"
              style={{ height: "52px", display: "inline-block" }}
            />
          </a>
        </div>

        <div className="form-card-standalone">
          <div style={{ marginBottom: "1.25rem" }}>
            <h1 style={{
              fontFamily: "var(--font-dm-serif), 'DM Serif Display', serif",
              fontSize: "1.5rem",
              fontWeight: 400,
              letterSpacing: "-.02em",
              color: "var(--text)",
              lineHeight: 1.15,
              marginBottom: ".3rem",
            }}>
              Set a new password
            </h1>
            <p style={{ fontSize: ".8rem", color: "var(--muted)", lineHeight: 1.5 }}>
              Choose a strong password for your MindMosaic account.
            </p>
          </div>

          {/* Exchange error (bad/expired link) */}
          {exchangeError && (
            <div className="auth-notice error" role="alert" style={{ marginBottom: "1rem" }}>
              {exchangeError}
              <br />
              <a href="/login" style={{ color: "inherit", fontWeight: 600 }}>
                Back to sign in →
              </a>
            </div>
          )}

          {/* Success */}
          {success && (
            <div className="auth-notice success" role="status" style={{ marginBottom: "1rem" }}>
              Password updated! Redirecting to sign in…
            </div>
          )}

          {/* Form — only shown when code exchanged successfully */}
          {ready && !success && (
            <form onSubmit={handleSubmit} noValidate>
              {error && <div className="auth-notice error" role="alert">{error}</div>}

              {/* New password */}
              <div className="input-group">
                <input
                  ref={firstInputRef}
                  id="rp-password"
                  type={showPw ? "text" : "password"}
                  placeholder=" "
                  autoComplete="new-password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
                <label className="floating-label" htmlFor="rp-password">New password</label>
                <span className="input-icon">
                  <svg viewBox="0 0 24 24">
                    <rect x="3" y="11" width="18" height="11" rx="2"/>
                    <path d="M7 11V7a5 5 0 0110 0v4"/>
                  </svg>
                </span>
                <button
                  type="button" className="toggle-visibility"
                  aria-label={showPw ? "Hide password" : "Show password"}
                  onClick={() => setShowPw(v => !v)}
                >
                  <EyeIcon open={showPw} />
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
                <input
                  id="rp-confirm"
                  type={showCf ? "text" : "password"}
                  placeholder=" "
                  autoComplete="new-password"
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  className={confirm === "" ? "" : confirmOk ? "success-field" : "error-field"}
                />
                <label className="floating-label" htmlFor="rp-confirm">Confirm password</label>
                <span className="input-icon">
                  <svg viewBox="0 0 24 24">
                    <rect x="3" y="11" width="18" height="11" rx="2"/>
                    <path d="M7 11V7a5 5 0 0110 0v4"/>
                  </svg>
                </span>
                <button
                  type="button" className="toggle-visibility"
                  aria-label={showCf ? "Hide password" : "Show password"}
                  onClick={() => setShowCf(v => !v)}
                >
                  <EyeIcon open={showCf} />
                </button>
                {confirm !== "" && (
                  <div className={`field-hint ${confirmOk ? "success" : "error"}`}>
                    {confirmOk ? "Passwords match ✓" : "Passwords don\u2019t match"}
                  </div>
                )}
              </div>

              <button type="submit" className="btn-primary" disabled={!canSubmit}>
                {loading ? "Updating password…" : "Set new password"}
              </button>
            </form>
          )}

          {/* No code at all — show fallback */}
          {!code && !exchangeError && (
            <div className="auth-notice info" role="alert">
              No reset code found. Please use the link from your email.
            </div>
          )}

          <p className="form-footer" style={{ marginTop: "1rem" }}>
            <a href="/login" className="link-btn" style={{ textDecoration: "underline", textUnderlineOffset: "2px" }}>
              ← Back to sign in
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
