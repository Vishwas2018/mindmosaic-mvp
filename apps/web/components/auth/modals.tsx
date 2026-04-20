"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { forgotPasswordAction } from "@/lib/auth/actions";

// ── Focus trap + Escape key ───────────────────────────────────────────────────
function useModalBehaviour(
  boxRef: React.RefObject<HTMLDivElement>,
  onClose: () => void
) {
  useEffect(() => {
    const box = boxRef.current;
    if (!box) return;

    // Focus the first focusable element on mount
    const focusable = box.querySelectorAll<HTMLElement>(
      'button, input, textarea, select, a[href], [tabindex]:not([tabindex="-1"])'
    );
    focusable[0]?.focus();

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") { onClose(); return; }
      if (e.key !== "Tab") return;
      const first = focusable[0];
      const last  = focusable[focusable.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last?.focus(); }
      } else {
        if (document.activeElement === last)  { e.preventDefault(); first?.focus(); }
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [boxRef, onClose]);
}

function CloseBtn({ onClose }: { onClose: () => void }) {
  return (
    <button className="close-btn" onClick={onClose} aria-label="Close">
      <svg viewBox="0 0 24 24">
        <line x1="18" y1="6" x2="6" y2="18"/>
        <line x1="6" y1="6" x2="18" y2="18"/>
      </svg>
    </button>
  );
}

// ── Forgot Password ───────────────────────────────────────────────────────────
export function ForgotPasswordModal({ onClose }: { onClose: () => void }) {
  const [email,   setEmail]   = useState("");
  const [status,  setStatus]  = useState<"idle" | "loading" | "ok" | "fail">("idle");
  const [message, setMessage] = useState("");
  const boxRef = useRef<HTMLDivElement>(null);
  const stableClose = useCallback(onClose, [onClose]);
  useModalBehaviour(boxRef, stableClose);

  async function handleSend() {
    if (!email.trim()) { setStatus("fail"); setMessage("Enter your email address."); return; }
    setStatus("loading");
    const r = await forgotPasswordAction(email);
    if (r.success) {
      setStatus("ok");
      setMessage(`Reset link sent to ${email}. Check your inbox.`);
    } else {
      setStatus("fail");
      setMessage(r.error);
    }
  }

  return (
    <div
      className="modal-overlay"
      role="dialog" aria-modal="true" aria-labelledby="forgot-title"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="modal-box" ref={boxRef}>
        <CloseBtn onClose={onClose} />
        <h2 id="forgot-title">Reset your password</h2>
        <p>Enter the email address associated with your account and we&apos;ll send you a link to reset your password.</p>

        {status !== "ok" ? (
          <>
            <input
              type="email" className="modal-input"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSend()}
            />
            {status === "fail" && (
              <div className="auth-notice error" role="alert" style={{ marginTop: ".75rem" }}>
                {message}
              </div>
            )}
            <div className="modal-actions">
              <button className="modal-btn-secondary" onClick={onClose}>Cancel</button>
              <button
                className="modal-btn-primary"
                onClick={handleSend}
                disabled={status === "loading"}
              >
                {status === "loading" ? "Sending…" : "Send reset link"}
              </button>
            </div>
          </>
        ) : (
          <div className="auth-notice success" role="status" style={{ marginTop: ".75rem" }}>
            {message}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Free Trial ────────────────────────────────────────────────────────────────
export function TrialModal({ onClose }: { onClose: () => void }) {
  const boxRef = useRef<HTMLDivElement>(null);
  const stableClose = useCallback(onClose, [onClose]);
  useModalBehaviour(boxRef, stableClose);

  return (
    <div
      className="modal-overlay"
      role="dialog" aria-modal="true" aria-labelledby="trial-title"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="modal-box" ref={boxRef}>
        <CloseBtn onClose={onClose} />
        <h2 id="trial-title">Try MindMosaic free</h2>
        <p>Explore sample exams and see how adaptive learning works — no account needed.</p>
        <ul className="placeholder-features">
          {[
            "NAPLAN practice papers (Years 3–9)",
            "ICAS sample questions across all subjects",
            "Instant scoring and worked solutions",
            "See how the adaptive engine adjusts difficulty",
          ].map(text => (
            <li key={text}>
              <svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
              {text}
            </li>
          ))}
        </ul>
        <div className="modal-actions">
          <button className="modal-btn-secondary" onClick={onClose}>Maybe later</button>
          <button className="modal-btn-primary" onClick={onClose}>Start sample exam</button>
        </div>
      </div>
    </div>
  );
}

// ── Contact ───────────────────────────────────────────────────────────────────
export function ContactModal({ onClose }: { onClose: () => void }) {
  const boxRef = useRef<HTMLDivElement>(null);
  const stableClose = useCallback(onClose, [onClose]);
  useModalBehaviour(boxRef, stableClose);

  return (
    <div
      className="modal-overlay"
      role="dialog" aria-modal="true" aria-labelledby="contact-title"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="modal-box" ref={boxRef}>
        <CloseBtn onClose={onClose} />
        <h2 id="contact-title">Get in touch</h2>
        <p>Our support team is happy to help with any questions about your account or the platform.</p>
        <ul className="placeholder-features">
          {[
            { icon: <svg viewBox="0 0 24 24"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M22 7l-10 6L2 7"/></svg>, text: "support@mindmosaic.com.au" },
            { icon: <svg viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 015.19 12.8 19.79 19.79 0 012.12 4.18 2 2 0 014.11 2h3a2 2 0 012 1.72c.13.81.36 1.61.68 2.37a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.76.32 1.56.55 2.37.68A2 2 0 0122 16.92z"/></svg>, text: "1800 MIND (placeholder)" },
            { icon: <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg>, text: "help.mindmosaic.com.au (placeholder)" },
          ].map(({ icon, text }) => (
            <li key={text}>{icon}{text}</li>
          ))}
        </ul>
        <div className="modal-actions">
          <button className="modal-btn-primary" onClick={onClose}>Got it</button>
        </div>
      </div>
    </div>
  );
}
