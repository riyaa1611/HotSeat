import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { Grain, Logo } from "../components/shared";

function Toast({ message, onDismiss }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 25000);
    return () => clearTimeout(t);
  }, [onDismiss]);

  return (
    <div style={{
      position: "fixed", top: 24, left: "50%", transform: "translateX(-50%)",
      zIndex: 100, background: "var(--bg-card)", border: "1px solid var(--accent-green)",
      borderLeft: "3px solid var(--accent-green)", padding: "14px 20px",
      display: "flex", alignItems: "center", gap: 12, minWidth: 320, maxWidth: 480,
      boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
      animation: "fadeIn 0.2s ease",
    }}>
      <span style={{ color: "var(--accent-green)", fontSize: 18 }}>✓</span>
      <div>
        <div className="mono" style={{ fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--accent-green)", marginBottom: 3 }}>
          Verification Email Sent
        </div>
        <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>{message}</div>
      </div>
      <button
        onClick={onDismiss}
        style={{ marginLeft: "auto", background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: 16, padding: "0 4px" }}
      >
        ×
      </button>
    </div>
  );
}

export default function Auth() {
  const navigate = useNavigate();
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setToast("");
    setLoading(true);

    if (mode === "signup") {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) setError(error.message);
      else setToast(`We sent a confirmation link to ${email}. Click it to activate your account.`);
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setError(error.message);
      else navigate("/");
    }
    setLoading(false);
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Grain />
      {toast && <Toast message={toast} onDismiss={() => setToast("")} />}

      <header style={{
        padding: "20px 32px", borderBottom: "1px solid var(--border-default)",
        display: "flex", justifyContent: "space-between", alignItems: "center",
      }}>
        <Logo size="sm" />
      </header>

      <main style={{ flex: 1, display: "grid", placeItems: "center", padding: "40px 24px" }}>
        <div style={{ width: "100%", maxWidth: 400 }}>
          <div className="mono" style={{
            fontSize: 10, letterSpacing: "0.22em", textTransform: "uppercase",
            color: "var(--accent-red)", marginBottom: 12,
          }}>
            {mode === "login" ? "Sign In" : "Create Account"}
          </div>
          <h1 style={{ fontSize: 32, fontWeight: 800, letterSpacing: "-0.03em", margin: "0 0 32px" }}>
            {mode === "login" ? "Welcome back." : "Get on the Hot Seat."}
          </h1>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label className="mono" style={{ fontSize: 10, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--text-muted)", display: "block", marginBottom: 6 }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                style={{ width: "100%", boxSizing: "border-box", padding: "14px 16px", fontSize: 15 }}
              />
            </div>
            <div>
              <label className="mono" style={{ fontSize: 10, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--text-muted)", display: "block", marginBottom: 6 }}>
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                minLength={6}
                style={{ width: "100%", boxSizing: "border-box", padding: "14px 16px", fontSize: 15 }}
              />
            </div>

            {error && (
              <div style={{
                padding: "12px 14px", background: "var(--accent-red-soft)",
                borderLeft: "2px solid var(--accent-red)", color: "var(--accent-red)", fontSize: 13,
              }}>
                {error}
              </div>
            )}

            <button type="submit" className="btn btn-primary" disabled={loading} style={{ marginTop: 8 }}>
              {loading ? "…" : mode === "login" ? "Sign In" : "Create Account"}
            </button>
          </form>

          <div style={{ marginTop: 24, textAlign: "center" }}>
            <button
              className="btn btn-ghost"
              onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(""); setToast(""); }}
              style={{ fontSize: 13, color: "var(--text-muted)" }}
            >
              {mode === "login" ? "No account? Sign up" : "Have an account? Sign in"}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
