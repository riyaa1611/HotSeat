import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import HCaptcha from "@hcaptcha/react-hcaptcha";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import { updateProfile } from "../services/api";
import { Grain, Logo, ThemeToggle } from "../components/shared";

const HCAPTCHA_SITE_KEY = import.meta.env.VITE_HCAPTCHA_SITE_KEY || "";
const OTP_RESEND_COOLDOWN = 60;

function OTPInput({ onComplete }) {
  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const refs = useRef([]);

  function handleChange(i, val) {
    const v = val.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[i] = v;
    setDigits(next);
    if (v && i < 5) refs.current[i + 1]?.focus();
    if (next.every((d) => d !== "")) onComplete(next.join(""));
  }

  function handleKeyDown(i, e) {
    if (e.key === "Backspace" && !digits[i] && i > 0) {
      refs.current[i - 1]?.focus();
    }
  }

  function handlePaste(e) {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      const next = pasted.split("");
      setDigits(next);
      refs.current[5]?.focus();
      onComplete(pasted);
    }
    e.preventDefault();
  }

  return (
    <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => (refs.current[i] = el)}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={d}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={handlePaste}
          style={{
            width: 48, height: 56, textAlign: "center", fontSize: 22,
            fontWeight: 700, fontFamily: "JetBrains Mono, monospace",
            border: `1px solid ${d ? "var(--accent-red)" : "var(--border-default)"}`,
            background: "var(--bg-input)", color: "var(--text-primary)",
            borderRadius: 0, outline: "none",
            transition: "border-color 150ms ease",
          }}
          autoFocus={i === 0}
        />
      ))}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="mono" style={{ fontSize: 10, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--text-muted)", display: "block", marginBottom: 6 }}>
        {label}
      </label>
      {children}
    </div>
  );
}

export default function Auth() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { state: navState } = useLocation();
  const [mode, setMode] = useState(() => navState?.mode ?? "login");
  const [step, setStep] = useState("form"); // "form" | "otp" | "forgot" | "reset_sent" | "reset"

  useEffect(() => {
    if (user && step !== "reset") navigate("/app", { replace: true });
  }, [user, step]);

  // Detect Supabase password-recovery redirect (URL hash contains type=recovery)
  useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes("type=recovery")) {
      setStep("reset");
      // Clean the hash so it doesn't persist on reload
      window.history.replaceState(null, "", window.location.pathname);
    }
  }, []);

  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const captchaRef = useRef(null);
  const cooldownRef = useRef(null);

  function resetCaptcha() {
    setCaptchaToken("");
    captchaRef.current?.resetCaptcha();
  }

  function startCooldown() {
    setResendCooldown(OTP_RESEND_COOLDOWN);
    cooldownRef.current = setInterval(() => {
      setResendCooldown((v) => {
        if (v <= 1) { clearInterval(cooldownRef.current); return 0; }
        return v - 1;
      });
    }, 1000);
  }

  useEffect(() => () => clearInterval(cooldownRef.current), []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (HCAPTCHA_SITE_KEY && !captchaToken) {
      setError("Please complete the CAPTCHA.");
      return;
    }

    if (mode === "signup" && !displayName.trim()) {
      setError("Display name is required.");
      return;
    }

    if (mode === "signup" && password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    const captchaOptions = captchaToken ? { options: { captchaToken } } : {};

    if (mode === "signup") {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        phone: phone || undefined,
        ...captchaOptions,
      });
      if (error && !error.message.toLowerCase().includes("sending confirmation email")) {
        setError(error.message);
        resetCaptcha();
      } else {
        setStep("otp");
        startCooldown();
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
        ...captchaOptions,
      });
      if (error) { setError(error.message); resetCaptcha(); }
    }
    setLoading(false);
  }

  const handleOTPComplete = useCallback(async (token) => {
    setError("");
    setLoading(true);
    const { error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: "signup",
    });
    if (error) {
      setError(error.message.includes("expired") ? "Code expired. Request a new one." : "Invalid code. Check your email and try again.");
    } else if (displayName.trim()) {
      try { await updateProfile({ display_name: displayName.trim() }); } catch { /* non-fatal */ }
    }
    setLoading(false);
  }, [email]);

  async function handleForgotPassword(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth`,
    });
    if (error) {
      setError(error.message);
    } else {
      setStep("reset_sent");
    }
    setLoading(false);
  }

  async function handleResetPassword(e) {
    e.preventDefault();
    setError("");
    if (password !== confirm) { setError("Passwords do not match."); return; }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setError(error.message);
    } else {
      await supabase.auth.signOut();
      setStep("form");
      setPassword("");
      setConfirm("");
      setError("");
    }
    setLoading(false);
  }

  async function handleResend() {
    if (resendCooldown > 0) return;
    setError("");
    setLoading(true);
    const { error } = await supabase.auth.resend({ type: "signup", email });
    if (error) {
      setError(error.message);
    } else {
      startCooldown();
    }
    setLoading(false);
  }

  function switchMode() {
    setMode(mode === "login" ? "signup" : "login");
    setStep("form");
    setError("");
    setDisplayName("");
    resetCaptcha();
  }

  const inputStyle = { width: "100%", boxSizing: "border-box", padding: "14px 16px", fontSize: 15 };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Grain />

      <header style={{ padding: "20px 32px", borderBottom: "1px solid var(--border-default)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Logo size="sm" />
        <ThemeToggle />
      </header>

      <main style={{ flex: 1, display: "grid", placeItems: "center", padding: "40px 24px" }}>
        <div style={{ width: "100%", maxWidth: 400 }}>

          {/* ── Reset password step ── */}
          {step === "reset" ? (
            <>
              <div className="mono" style={{ fontSize: 10, letterSpacing: "0.22em", textTransform: "uppercase", color: "var(--accent-red)", marginBottom: 12 }}>
                New Password
              </div>
              <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.03em", margin: "0 0 12px" }}>
                Choose a new password.
              </h1>
              <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.6, margin: "0 0 28px" }}>
                Pick something strong. You won't be able to reuse the old one.
              </p>
              <form onSubmit={handleResetPassword} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <Field label="New Password">
                  <div style={{ position: "relative" }}>
                    <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="••••••••" minLength={6} style={{ ...inputStyle, paddingRight: 48 }} />
                    <button type="button" onClick={() => setShowPassword(p => !p)} style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: 13, padding: 0 }}>
                      {showPassword ? "HIDE" : "SHOW"}
                    </button>
                  </div>
                </Field>
                <Field label="Confirm Password">
                  <div style={{ position: "relative" }}>
                    <input
                      type={showConfirm ? "text" : "password"}
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      required
                      placeholder="••••••••"
                      minLength={6}
                      style={{
                        ...inputStyle, paddingRight: 48,
                        borderColor: confirm && confirm !== password ? "var(--accent-red)" : confirm && confirm === password ? "var(--accent-green)" : "var(--border-default)",
                      }}
                    />
                    <button type="button" onClick={() => setShowConfirm(p => !p)} style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: 13, padding: 0 }}>
                      {showConfirm ? "HIDE" : "SHOW"}
                    </button>
                  </div>
                  {confirm && confirm !== password && (
                    <div className="mono" style={{ fontSize: 10, color: "var(--accent-red)", marginTop: 4, letterSpacing: "0.1em" }}>Passwords do not match</div>
                  )}
                </Field>
                {error && (
                  <div style={{ padding: "12px 14px", background: "var(--accent-red-soft)", borderLeft: "2px solid var(--accent-red)", color: "var(--accent-red)", fontSize: 13 }}>
                    {error}
                  </div>
                )}
                <button type="submit" className="btn btn-primary" disabled={loading} style={{ marginTop: 4 }}>
                  {loading ? "…" : "Set New Password"}
                </button>
              </form>
            </>
          ) : step === "reset_sent" ? (
            <>
              <div className="mono" style={{ fontSize: 10, letterSpacing: "0.22em", textTransform: "uppercase", color: "var(--accent-red)", marginBottom: 12 }}>
                Check Your Email
              </div>
              <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.03em", margin: "0 0 12px" }}>
                Reset link sent.
              </h1>
              <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.6, margin: "0 0 28px" }}>
                We sent a password reset link to <strong style={{ color: "var(--text-primary)" }}>{email}</strong>. Click the link in the email — it'll bring you back here to set a new password.
              </p>
              <button
                className="btn btn-ghost"
                onClick={() => { setStep("form"); setError(""); }}
                style={{ fontSize: 13, padding: "10px 16px" }}
              >
                ← Back to Sign In
              </button>
            </>
          ) : step === "forgot" ? (
            <>
              <div className="mono" style={{ fontSize: 10, letterSpacing: "0.22em", textTransform: "uppercase", color: "var(--accent-red)", marginBottom: 12 }}>
                Forgot Password
              </div>
              <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.03em", margin: "0 0 12px" }}>
                Reset your password.
              </h1>
              <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.6, margin: "0 0 28px" }}>
                Enter the email you signed up with. We'll send a reset link.
              </p>
              <form onSubmit={handleForgotPassword} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <Field label="Email">
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@example.com" style={inputStyle} autoFocus />
                </Field>
                {error && (
                  <div style={{ padding: "12px 14px", background: "var(--accent-red-soft)", borderLeft: "2px solid var(--accent-red)", color: "var(--accent-red)", fontSize: 13 }}>
                    {error}
                  </div>
                )}
                <button type="submit" className="btn btn-primary" disabled={loading} style={{ marginTop: 4 }}>
                  {loading ? "…" : "Send Reset Link"}
                </button>
              </form>
              <div style={{ marginTop: 16, textAlign: "center" }}>
                <button className="btn btn-ghost" onClick={() => { setStep("form"); setError(""); }} style={{ fontSize: 13, color: "var(--text-muted)" }}>
                  ← Back to Sign In
                </button>
              </div>
            </>
          ) : /* ── OTP step ── */
          step === "otp" ? (
            <>
              <div className="mono" style={{ fontSize: 10, letterSpacing: "0.22em", textTransform: "uppercase", color: "var(--accent-red)", marginBottom: 12 }}>
                Verify Email
              </div>
              <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.03em", margin: "0 0 12px" }}>
                Check your inbox.
              </h1>
              <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.6, margin: "0 0 28px" }}>
                We sent a 6-digit code to <strong style={{ color: "var(--text-primary)" }}>{email}</strong>. Enter it below to verify your account.
              </p>

              <OTPInput onComplete={handleOTPComplete} />

              {loading && (
                <div className="mono" style={{ textAlign: "center", fontSize: 11, color: "var(--text-muted)", letterSpacing: "0.16em", marginTop: 20 }}>
                  Verifying…
                </div>
              )}

              {error && (
                <div style={{ marginTop: 16, padding: "12px 14px", background: "var(--accent-red-soft)", borderLeft: "2px solid var(--accent-red)", color: "var(--accent-red)", fontSize: 13 }}>
                  {error}
                </div>
              )}

              <div style={{ marginTop: 24, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <button
                  className="btn btn-ghost"
                  onClick={handleResend}
                  disabled={resendCooldown > 0 || loading}
                  style={{ fontSize: 12, padding: "8px 14px" }}
                >
                  {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend code"}
                </button>
                <button
                  className="btn btn-ghost"
                  onClick={() => { setStep("form"); setError(""); }}
                  style={{ fontSize: 12, padding: "8px 14px", color: "var(--text-muted)" }}
                >
                  ← Back
                </button>
              </div>
            </>
          ) : (
            /* ── Form step ── */
            <>
              <div className="mono" style={{ fontSize: 10, letterSpacing: "0.22em", textTransform: "uppercase", color: "var(--accent-red)", marginBottom: 12 }}>
                {mode === "login" ? "Sign In" : "Create Account"}
              </div>
              <h1 style={{ fontSize: 32, fontWeight: 800, letterSpacing: "-0.03em", margin: "0 0 28px" }}>
                {mode === "login" ? "Welcome back." : "Get on the Hot Seat."}
              </h1>

              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {mode === "signup" && (
                  <Field label="Display Name *">
                    <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} required placeholder="How you'll appear on the leaderboard" maxLength={80} style={inputStyle} autoFocus />
                  </Field>
                )}
                <Field label="Email">
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@example.com" style={inputStyle} />
                </Field>

                {mode === "signup" && (
                  <Field label="Phone (optional)">
                    <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 98765 43210" style={inputStyle} />
                  </Field>
                )}

                <Field label="Password">
                  <div style={{ position: "relative" }}>
                    <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="••••••••" minLength={6} style={{ ...inputStyle, paddingRight: 48 }} />
                    <button type="button" onClick={() => setShowPassword(p => !p)} style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: 13, padding: 0 }}>
                      {showPassword ? "HIDE" : "SHOW"}
                    </button>
                  </div>
                </Field>

                {mode === "login" && (
                  <div style={{ textAlign: "right", marginTop: -6 }}>
                    <button
                      type="button"
                      className="btn btn-ghost"
                      onClick={() => { setStep("forgot"); setError(""); }}
                      style={{ fontSize: 11, padding: "4px 0", color: "var(--text-muted)", border: "none", background: "none" }}
                    >
                      Forgot password?
                    </button>
                  </div>
                )}

                {mode === "signup" && (
                  <Field label="Confirm Password">
                    <div style={{ position: "relative" }}>
                      <input
                        type={showConfirm ? "text" : "password"}
                        value={confirm}
                        onChange={(e) => setConfirm(e.target.value)}
                        required
                        placeholder="••••••••"
                        minLength={6}
                        style={{
                          ...inputStyle, paddingRight: 48,
                          borderColor: confirm && confirm !== password ? "var(--accent-red)" : confirm && confirm === password ? "var(--accent-green)" : "var(--border-default)",
                        }}
                      />
                      <button type="button" onClick={() => setShowConfirm(p => !p)} style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: 13, padding: 0 }}>
                        {showConfirm ? "HIDE" : "SHOW"}
                      </button>
                    </div>
                    {confirm && confirm !== password && (
                      <div className="mono" style={{ fontSize: 10, color: "var(--accent-red)", marginTop: 4, letterSpacing: "0.1em" }}>Passwords do not match</div>
                    )}
                  </Field>
                )}

                {error && (
                  <div style={{ padding: "12px 14px", background: "var(--accent-red-soft)", borderLeft: "2px solid var(--accent-red)", color: "var(--accent-red)", fontSize: 13 }}>
                    {error}
                  </div>
                )}

                {HCAPTCHA_SITE_KEY && (
                  <div style={{ display: "flex", justifyContent: "center", margin: "4px 0" }}>
                    <HCaptcha
                      ref={captchaRef}
                      sitekey={HCAPTCHA_SITE_KEY}
                      theme="dark"
                      onVerify={(token) => setCaptchaToken(token)}
                      onExpire={resetCaptcha}
                    />
                  </div>
                )}

                <button type="submit" className="btn btn-primary" disabled={loading || (HCAPTCHA_SITE_KEY && !captchaToken)} style={{ marginTop: 4 }}>
                  {loading ? "…" : mode === "login" ? "Sign In" : "Create Account"}
                </button>
              </form>

              <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "20px 0 4px" }}>
                <div style={{ flex: 1, height: 1, background: "var(--border-default)" }} />
                <span className="mono" style={{ fontSize: 10, color: "var(--text-muted)", letterSpacing: "0.16em" }}>OR</span>
                <div style={{ flex: 1, height: 1, background: "var(--border-default)" }} />
              </div>

              <button
                type="button"
                className="btn"
                style={{ width: "100%", gap: 10, fontSize: 13 }}
                onClick={async () => {
                  await supabase.auth.signInWithOAuth({
                    provider: "google",
                    options: { redirectTo: `${window.location.origin}/` },
                  });
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Continue with Google
              </button>

              <div style={{ marginTop: 16, textAlign: "center" }}>
                <button className="btn btn-ghost" onClick={switchMode} style={{ fontSize: 13, color: "var(--text-muted)" }}>
                  {mode === "login" ? "No account? Sign up" : "Have an account? Sign in"}
                </button>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
