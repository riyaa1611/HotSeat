import { useNavigate, Link } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { Logo, ThemeToggle } from "../components/shared";
import { getStats } from "../services/api";

function LiveDot() {
  return <span style={{ width: 7, height: 7, background: "var(--accent-red)", borderRadius: "50%", display: "inline-block", flexShrink: 0, animation: "flicker 1.6s ease-in-out infinite" }} />;
}

function AnimatedStat({ target, prefix = "", label, active, duration = 1300 }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!active || target === 0) return;
    const start = performance.now();
    const tick = (now) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setCount(Math.round(eased * target));
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [active, target, duration]);
  return (
    <div>
      <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-0.03em" }}>{prefix}{count}</div>
      <div className="mono" style={{ fontSize: 9, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--text-muted)", marginTop: 2 }}>{label}</div>
    </div>
  );
}

function PulseRings() {
  return (
    <div style={{ position: "relative", width: 72, height: 72, display: "flex", alignItems: "center", justifyContent: "center" }}>
      {[72, 52, 34].map((size, i) => (
        <span key={i} style={{
          position: "absolute", borderRadius: "50%",
          width: size, height: size,
          border: `1px solid rgba(226,75,74,${0.25 + i * 0.12})`,
          animation: `landingRingOut 2.6s ease-out infinite`,
          animationDelay: `${i * 0.55}s`,
        }} />
      ))}
      <span style={{
        width: 14, height: 14, background: "var(--accent-red)", borderRadius: "50%", zIndex: 1,
        boxShadow: "0 0 0 4px rgba(226,75,74,0.15), 0 0 16px rgba(226,75,74,0.5)",
        animation: "landingCoreBeat 1.4s ease-in-out infinite",
      }} />
    </div>
  );
}

export default function Landing() {
  const navigate = useNavigate();
  const statsRef = useRef(null);
  const [statsActive, setStatsActive] = useState(false);
  const [sessionCount, setSessionCount] = useState(null);

  useEffect(() => {
    getStats().then((d) => setSessionCount(d.sessions_completed)).catch(() => {});
  }, []);

  useEffect(() => {
    const el = statsRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) { setStatsActive(true); obs.disconnect(); } }, { threshold: 0.4 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "var(--bg-primary)" }}>

      {/* ── NAV ── */}
      <nav className="landing-nav">
        <Logo size="sm" />
        <div className="landing-nav-links">
          <a href="#how" className="landing-nav-link">How it works</a>
          <a href="#personas" className="landing-nav-link">Personas</a>
          <a href="#proof" className="landing-nav-link">Results</a>
          <Link to="/leaderboard" className="landing-nav-link">Leaderboard</Link>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <ThemeToggle />
          <button className="btn btn-ghost landing-signin" onClick={() => navigate("/auth")} style={{ fontSize: 12, padding: "7px 16px" }}>Sign In</button>
          <button className="btn btn-primary" onClick={() => navigate("/auth")} style={{ fontSize: 12, padding: "7px 16px", letterSpacing: "0.06em" }}>Get Started</button>
        </div>
      </nav>

      {/* ── HERO ── */}
      <div className="landing-hero">

        {/* Left */}
        <div className="landing-hero-left">
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, border: "1px solid rgba(226,75,74,0.3)", padding: "5px 12px", marginBottom: 28, background: "rgba(226,75,74,0.06)", width: "fit-content" }}>
            <LiveDot />
            <span className="mono" style={{ fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--accent-red)" }}>Pitch Practice · Live</span>
          </div>

          <h1 className="landing-h1">
            Get grilled <em style={{ color: "var(--accent-red)", fontStyle: "normal" }}>before</em><br />the real thing.
          </h1>

          <p className="landing-sub">
            Drop your repo or project URL. Pick your interrogator. Survive 12 questions designed to find every weak spot in your pitch — so the real meeting doesn't.
          </p>

          <div style={{ display: "flex", gap: 12, marginBottom: 48, flexWrap: "wrap" }}>
            <button className="btn btn-primary" onClick={() => navigate("/auth")} style={{ fontSize: 14, padding: "14px 28px", letterSpacing: "0.06em" }}>
              Start for Free →
            </button>
            <a href="#how" className="btn btn-ghost" style={{ fontSize: 12, padding: "14px 20px", color: "var(--text-muted)", textDecoration: "none" }}>
              See how it works ↓
            </a>
          </div>

          <div className="landing-stats" ref={statsRef}>
            <AnimatedStat target={4} label="Interrogators" active={statsActive} />
            <AnimatedStat target={12} label="Questions / session" active={statsActive} />
            <AnimatedStat target={8} prefix="~" label="Minutes avg" active={statsActive} />
            <div>
              <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-0.03em" }}>0</div>
              <div className="mono" style={{ fontSize: 9, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--text-muted)", marginTop: 2 }}>Coddling</div>
            </div>
            {sessionCount !== null && (
              <AnimatedStat target={sessionCount} label="Sessions done" active={statsActive} duration={1800} />
            )}
          </div>
        </div>

        {/* Right — type art + pulse */}
        <div className="landing-hero-right">
          <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 55%, rgba(226,75,74,0.06) 0%, transparent 65%)", pointerEvents: "none" }} />
          <div style={{ position: "absolute", inset: 0, backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.03) 3px, rgba(0,0,0,0.03) 4px)", pointerEvents: "none" }} />

          {/* Type art — center */}
          <div className="landing-type-art">
            <div className="mono" style={{ fontSize: 10, letterSpacing: "0.28em", color: "rgba(226,75,74,0.45)", textTransform: "uppercase", marginBottom: 10 }}>— Session in progress</div>
            <span style={{ display: "block", fontFamily: "'Inter',sans-serif", fontWeight: 900, letterSpacing: "-0.06em", lineHeight: 0.85, color: "transparent", WebkitTextStroke: "2px rgba(226,75,74,0.35)" }} className="landing-type-word">HOT</span>
            <span style={{ display: "block", fontFamily: "'Inter',sans-serif", fontWeight: 900, letterSpacing: "-0.06em", lineHeight: 0.85, color: "var(--accent-red)", textShadow: "0 0 40px rgba(226,75,74,0.3), 0 0 80px rgba(226,75,74,0.12)" }} className="landing-type-word">SEAT</span>
            <div style={{ display: "flex", gap: 6, marginTop: 18 }}>
              <div style={{ width: 52, height: 2, background: "var(--accent-red)" }} />
              <div style={{ width: 26, height: 2, background: "var(--accent-red)", opacity: 0.35 }} />
              <div style={{ width: 13, height: 2, background: "var(--accent-red)", opacity: 0.18 }} />
            </div>
          </div>

          {/* Pulse — top right */}
          <div style={{ position: "absolute", top: 24, right: 24, zIndex: 3, display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
            <PulseRings />
            <span className="mono" style={{ fontSize: 8, letterSpacing: "0.22em", color: "rgba(226,75,74,0.55)", textTransform: "uppercase" }}>Live · Active</span>
          </div>
        </div>
      </div>

      {/* ── QUESTION STRIP — full width marquee ── */}
      {(() => {
        const pills = [
          ["Investor", "\"What's your CAC and why should I believe that number?\""],
          ["Tech Lead", "\"Where are the tests? Walk me through error handling.\""],
          ["HR Manager", "\"That sounds rehearsed. What actually went wrong?\""],
          ["PM", "\"Who asked for this? Name one specific user.\""],
          ["Investor", "\"You and what army? Why this team?\""],
          ["Tech Lead", "\"Did you actually write this or did ChatGPT?\""],
        ];
        const renderPills = (prefix) => pills.map(([role, q], i) => (
          <div key={`${prefix}-${i}`} className="landing-pill" style={{ flexShrink: 0 }}>
            <strong className="mono" style={{ color: "var(--accent-red)", fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase", display: "block", marginBottom: 2 }}>{role}</strong>
            {q}
          </div>
        ));
        return (
          <div className="landing-strip">
            <span className="mono landing-strip-label">Real questions →</span>
            <div style={{ flex: 1, overflow: "hidden", position: "relative" }}>
              <div className="landing-marquee-track" style={{ animationDuration: "28s" }}>
                {renderPills("a")}
                {renderPills("b")}
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── HOW IT WORKS ── */}
      <section id="how" className="landing-section">
        <div className="mono" style={{ fontSize: 11, letterSpacing: "0.22em", textTransform: "uppercase", color: "var(--accent-red)", marginBottom: 12 }}>How it works</div>
        <h2 className="landing-h2">Three steps to a better pitch.</h2>
        <p className="landing-section-sub">No setup required. Paste, pick, and prepare to defend every decision you've made.</p>
        <div className="landing-steps">
          {[
            ["01", <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent-red)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>, "Paste your project", "Drop a GitHub repo URL or deployed project link. HotSeat reads your code and stack to ask questions specific to what you built — not generic startup advice."],
            ["02", <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent-red)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>, "Pick your interrogator", "Investor, Tech Lead, HR Manager, or Product Manager. Each has a different agenda and a different way to expose your gaps. No easy options."],
            ["03", <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent-red)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>, "Survive 12 questions", "No hints. No encouragement. Dodge and they'll call it out. Finish and get a scored report across 5 dimensions with one action item."],
          ].map(([num, icon, title, desc]) => (
            <div key={num} className="landing-step">
              <div className="mono" style={{ fontSize: 11, letterSpacing: "0.2em", color: "var(--accent-red)", marginBottom: 20 }}>{num}</div>
              <div style={{ width: 40, height: 40, border: "1px solid var(--border-strong)", display: "grid", placeItems: "center", marginBottom: 20 }}>{icon}</div>
              <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 10 }}>{title}</h3>
              <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.6 }}>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── PERSONAS ── */}
      <section id="personas" className="landing-section" style={{ background: "var(--bg-card)" }}>
        <div className="mono" style={{ fontSize: 11, letterSpacing: "0.22em", textTransform: "uppercase", color: "var(--accent-red)", marginBottom: 12 }}>The interrogators</div>
        <h2 className="landing-h2">Pick your poison.</h2>
        <p className="landing-section-sub">Four personas. Four different ways to expose your weaknesses.</p>
        <div className="landing-personas">
          {[
            ["Investor", "The VC", "Seen 200 pitches this month. Funded zero. Allergic to buzzwords, impatient with vague TAM, will ask \"so what?\" until you have a real answer.", "\"You and what army? Why does this specific team win against a well-funded competitor who copies you next month?\""],
            ["Tech Lead", "The Skeptic", "15 years of PRs. Zero tolerance for sloppy architecture. Wants to know why you made specific choices, where the tests are, and whether you actually wrote this.", "\"Walk me through what happens when this endpoint gets 1,000 concurrent requests. Be specific.\""],
            ["HR Manager", "The Observer", "12 years of behavioral interviews. Can smell a rehearsed answer. Will ask for the real version — the one where something actually went wrong.", "\"That's the polished version. What actually happened? What did you get wrong and how long did it take you to admit it?\""],
            ["Product Manager", "The User Advocate", "Shipped 20 products. Killed 15. Doesn't care how it's built — only who it's for and whether they'll pay. Lead with tech and get redirected.", "\"Name one specific person who asked you to build this. Not a persona. A person. What problem did they have last Tuesday?\""],
          ].map(([tag, title, desc, q]) => (
            <div key={tag} className="landing-persona-card">
              <div className="mono" style={{ fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--accent-red)", marginBottom: 12 }}>{tag}</div>
              <h3 style={{ fontSize: 20, fontWeight: 800, marginBottom: 10 }}>{title}</h3>
              <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: 20 }}>{desc}</p>
              <div className="mono" style={{ fontSize: 9, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--border-strong)", marginBottom: 6 }}>Sample question</div>
              <div style={{ borderLeft: "2px solid var(--border-strong)", paddingLeft: 14, fontSize: 13, color: "var(--text-muted)", fontStyle: "italic", lineHeight: 1.6 }}>{q}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── MARQUEE ── */}
      {(() => {
        const items = ["No coddling", "No participation trophies", "12 questions per session", "Specific to your project", "Full performance report", "Works on any repo or URL", "Free to start", "No mercy", "No shortcuts", "Real questions", "Real feedback"];
        const renderItems = (prefix) => items.map((t, i) => (
          <div key={`${prefix}-${i}`} className="landing-marquee-item">
            <span style={{ color: "var(--accent-red)", marginRight: 10 }}>—</span>{t}
          </div>
        ));
        return (
          <div className="landing-marquee">
            <div className="landing-marquee-track">
              {renderItems("a")}
              {renderItems("b")}
            </div>
          </div>
        );
      })()}

      {/* ── PROOF ── */}
      <section id="proof" className="landing-section">
        <div className="mono" style={{ fontSize: 11, letterSpacing: "0.22em", textTransform: "uppercase", color: "var(--accent-red)", marginBottom: 12 }}>After the session</div>
        <h2 className="landing-h2">Know exactly where you stand.</h2>
        <p className="landing-section-sub">Every session ends with a full report — scored across 5 dimensions, with specific strengths, weaknesses, and one action item.</p>
        <div className="landing-proof">
          {[
            ["\"I thought I knew my product cold. The investor persona found three gaps in my business model in four minutes. My actual investor meeting went much better.\"", "Arjun S.", "Founder, dev tools startup"],
            ["\"The tech lead asked about my database indexing strategy and I realized I had no answer. Fixed it before my interview. Got the offer.\"", "Priya M.", "Senior engineer"],
            ["\"It reads your actual code and asks about the specific choices you made. Not generic interview prep — actual questions about your project.\"", "James L.", "Indie hacker"],
          ].map(([quote, name, role]) => (
            <div key={name} className="landing-proof-card">
              <p style={{ fontSize: 15, color: "var(--text-secondary)", lineHeight: 1.7, marginBottom: 20, borderLeft: "2px solid var(--accent-red)", paddingLeft: 16 }}>{quote}</p>
              <div className="mono" style={{ fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--text-muted)" }}>
                {name} <span style={{ color: "var(--accent-red)" }}>— {role}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA BANNER ── */}
      <div className="landing-cta-banner">
        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 600, height: 300, background: "radial-gradient(ellipse, rgba(226,75,74,0.12) 0%, transparent 70%)", pointerEvents: "none" }} />
        <h2 className="landing-cta-h2">Stop rehearsing.<br />Start getting grilled.</h2>
        <p style={{ fontSize: 16, color: "var(--text-secondary)", marginBottom: 36, position: "relative" }}>Free to start. No credit card. Just paste your project and pick your interrogator.</p>
        <button className="btn btn-primary" onClick={() => navigate("/auth")} style={{ fontSize: 15, padding: "18px 40px", letterSpacing: "0.06em", position: "relative" }}>
          Enter the Hot Seat →
        </button>
      </div>

      {/* ── FOOTER ── */}
      <footer style={{ padding: "28px 60px", display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--border-default)", flexWrap: "wrap", gap: 12 }}>
        <Logo size="sm" />
        <div className="mono" style={{ fontSize: 10, color: "var(--text-muted)", letterSpacing: "0.14em", textTransform: "uppercase" }}>
          No coddling. No participation trophies.
        </div>
        <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
          <Link to="/leaderboard" className="mono" style={{ fontSize: 10, color: "var(--text-muted)", letterSpacing: "0.14em", textTransform: "uppercase", textDecoration: "none" }}>Leaderboard</Link>
          <Link to="/privacy" className="mono" style={{ fontSize: 10, color: "var(--text-muted)", letterSpacing: "0.14em", textTransform: "uppercase", textDecoration: "none" }}>Privacy</Link>
          <a href="mailto:gaurriya1611@gmail.com" className="mono" style={{ fontSize: 10, color: "var(--text-muted)", letterSpacing: "0.14em", textTransform: "uppercase", textDecoration: "none" }}>Contact</a>
        </div>
      </footer>

    </div>
  );
}
