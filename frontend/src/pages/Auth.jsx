import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import HCaptcha from "@hcaptcha/react-hcaptcha";
import { supabase } from "../lib/supabase";
import { Grain, Logo } from "../components/shared";

const HCAPTCHA_SITE_KEY = import.meta.env.VITE_HCAPTCHA_SITE_KEY || "";

function Toast({ message, onDismiss }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 25000);
    return () => clearTimeout(t);
  }, [onDismiss]);

  return (
    <div style={{
      position: "fixed", top: 32, left: "50%", transform: "translateX(-50%)",
      zIndex: 100, background: "#0d2e1f", border: "2px solid var(--accent-green)",
      padding: "20px 24px", display: "flex", alignItems: "flex-start", gap: 16,
      minWidth: 360, maxWidth: 520,
      boxShadow: "0 0 0 4px rgba(93,202,165,0.15), 0 12px 48px rgba(0,0,0,0.8)",
      animation: "fadeIn 0.25s ease",
    }}>
      <span style={{ color: "var(--accent-green)", fontSize: 24, lineHeight: 1, marginTop: 2 }}>✓</span>
      <div style={{ flex: 1 }}>
        <div className="mono" style={{ fontSize: 12, letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--accent-green)", marginBottom: 6, fontWeight: 700 }}>
          Verification Email Sent
        </div>
        <div style={{ fontSize: 14, color: "#d1fae5", lineHeight: 1.5 }}>{message}</div>
      </div>
      <button onClick={onDismiss} style={{ background: "none", border: "none", color: "var(--accent-green)", cursor: "pointer", fontSize: 20, padding: "0 4px", lineHeight: 1, opacity: 0.7 }}>×</button>
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
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [loading, setLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const captchaRef = useRef(null);

  function resetCaptcha() {
    setCaptchaToken("");
    captchaRef.current?.resetCaptcha();
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (HCAPTCHA_SITE_KEY && !captchaToken) {
      setError("Please complete the CAPTCHA.");
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
        setError(error.message); resetCaptcha();
      } else {
        setToast(`Verification link sent to ${email}. Check your inbox and click the link to activate your account.`);
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
        ...captchaOptions,
      });
      if (error) { setError(error.message); resetCaptcha(); }
      else navigate("/");
    }
    setLoading(false);
  }

  function switchMode() {
    setMode(mode === "login" ? "signup" : "login");
    setError("");
    setToast("");
    resetCaptcha();
  }

  const inputStyle = { width: "100%", boxSizing: "border-box", padding: "14px 16px", fontSize: 15 };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Grain />
      {toast && <Toast message={toast} onDismiss={() => setToast("")} />}

      <header style={{ padding: "20px 32px", borderBottom: "1px solid var(--border-default)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Logo size="sm" />
      </header>

      <main style={{ flex: 1, display: "grid", placeItems: "center", padding: "40px 24px" }}>
        <div style={{ width: "100%", maxWidth: 400 }}>
          <div className="mono" style={{ fontSize: 10, letterSpacing: "0.22em", textTransform: "uppercase", color: "var(--accent-red)", marginBottom: 12 }}>
            {mode === "login" ? "Sign In" : "Create Account"}
          </div>
          <h1 style={{ fontSize: 32, fontWeight: 800, letterSpacing: "-0.03em", margin: "0 0 28px" }}>
            {mode === "login" ? "Welcome back." : "Get on the Hot Seat."}
          </h1>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
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

          <div style={{ marginTop: 24, textAlign: "center" }}>
            <button className="btn btn-ghost" onClick={switchMode} style={{ fontSize: 13, color: "var(--text-muted)" }}>
              {mode === "login" ? "No account? Sign up" : "Have an account? Sign in"}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
