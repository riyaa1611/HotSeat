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
          <a href="#modes" className="landing-nav-link">Modes</a>
          <a href="#personas" className="landing-nav-link">Interrogators</a>
          <a href="#proof" className="landing-nav-link">Results</a>
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
            <span className="mono" style={{ fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--accent-red)" }}>Pitch Practice · Interview Prep · Live</span>
          </div>

          <h1 className="landing-h1">
            Get grilled <em style={{ color: "var(--accent-red)", fontStyle: "normal" }}>before</em><br />the real thing.
          </h1>

          <p className="landing-sub">
            Pitch your project to ruthless AI interrogators — or upload your resume and face a real job interview. 12 brutal questions designed to find every weak spot before the actual meeting does.
          </p>

          <div style={{ display: "flex", gap: 12, marginBottom: 48, flexWrap: "wrap" }}>
            <button className="btn btn-primary" onClick={() => navigate("/auth")} style={{ fontSize: 14, padding: "14px 28px", letterSpacing: "0.06em" }}>
              Start for Free →
            </button>
            <a href="#modes" className="btn btn-ghost" style={{ fontSize: 12, padding: "14px 20px", color: "var(--text-muted)", textDecoration: "none" }}>
              See how it works ↓
            </a>
          </div>

          <div className="landing-stats" ref={statsRef}>
            <AnimatedStat target={6} label="Interrogators" active={statsActive} />
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

          <div style={{ position: "absolute", top: 24, right: 24, zIndex: 3, display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
            <PulseRings />
            <span className="mono" style={{ fontSize: 8, letterSpacing: "0.22em", color: "rgba(226,75,74,0.55)", textTransform: "uppercase" }}>Live · Active</span>
          </div>
        </div>
      </div>

      {/* ── QUESTION STRIP ── */}
      {(() => {
        const pills = [
          ["Investor", "\"What's your CAC and why should I believe that number?\""],
          ["Behavioral", "\"That sounds rehearsed. What actually happened?\""],
          ["Tech Lead", "\"Where are the tests? Walk me through error handling.\""],
          ["Resume", "\"You list Python here — walk me through the hardest bug you debugged with it.\""],
          ["PM", "\"Who asked for this? Name one specific user.\""],
          ["Behavioral", "\"You 'led' the team — how many people exactly?\""],
          ["Investor", "\"You and what army? Why this team?\""],
          ["Resume", "\"There's a gap here between these two roles. What happened?\""],
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
              <div className="landing-marquee-track" style={{ animationDuration: "32s" }}>
                {renderPills("a")}
                {renderPills("b")}
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── TWO MODES ── */}
      <section id="modes" className="landing-section">
        <div className="mono" style={{ fontSize: 11, letterSpacing: "0.22em", textTransform: "uppercase", color: "var(--accent-red)", marginBottom: 12 }}>Two modes</div>
        <h2 className="landing-h2">Pitch practice or job prep — your call.</h2>
        <p className="landing-section-sub">Same brutal format. Different target. Pick the one that matters right now.</p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 2, marginTop: 40 }}>
          {/* Project Pitch */}
          <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-default)", padding: "36px 32px" }}>
            <div className="mono" style={{ fontSize: 9, letterSpacing: "0.22em", textTransform: "uppercase", color: "var(--accent-red)", marginBottom: 16 }}>Mode 01 — Project Pitch</div>
            <h3 style={{ fontSize: 22, fontWeight: 800, marginBottom: 14 }}>Defend your project.</h3>
            <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.7, marginBottom: 24 }}>
              Paste a GitHub repo or deployed URL. HotSeat reads your stack and code, then sends in an Investor, Tech Lead, HR Manager, or PM to find every gap before a real one does.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {["Reads your actual code and stack", "4 interrogator personas", "12 questions per session", "Scored report across 5 dimensions"].map(f => (
                <div key={f} className="mono" style={{ fontSize: 11, color: "var(--text-muted)", letterSpacing: "0.08em", display: "flex", gap: 8 }}>
                  <span style={{ color: "var(--accent-red)" }}>—</span>{f}
                </div>
              ))}
            </div>
          </div>

          {/* Interview Prep */}
          <div style={{ background: "var(--bg-card)", border: "1px solid var(--accent-red)", padding: "36px 32px", position: "relative" }}>
            <div style={{ position: "absolute", top: -1, right: 20, background: "var(--accent-red)", padding: "3px 10px" }}>
              <span className="mono" style={{ fontSize: 8, letterSpacing: "0.2em", textTransform: "uppercase", color: "#fff" }}>New</span>
            </div>
            <div className="mono" style={{ fontSize: 9, letterSpacing: "0.22em", textTransform: "uppercase", color: "var(--accent-red)", marginBottom: 16 }}>Mode 02 — Interview Prep</div>
            <h3 style={{ fontSize: 22, fontWeight: 800, marginBottom: 14 }}>Ace the job interview.</h3>
            <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.7, marginBottom: 24 }}>
              Upload your resume and optionally link your GitHub profile. Get drilled by a Behavioral interviewer who spots rehearsed answers, or a Resume Deep-Dive who goes line by line through everything you claim.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {["Resume + GitHub profile analysis", "Behavioral & Resume Deep-Dive modes", "Per-answer confidence scoring", "PDF report export"].map(f => (
                <div key={f} className="mono" style={{ fontSize: 11, color: "var(--text-muted)", letterSpacing: "0.08em", display: "flex", gap: 8 }}>
                  <span style={{ color: "var(--accent-red)" }}>—</span>{f}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── PERSONAS ── */}
      <section id="personas" className="landing-section" style={{ background: "var(--bg-card)" }}>
        <div className="mono" style={{ fontSize: 11, letterSpacing: "0.22em", textTransform: "uppercase", color: "var(--accent-red)", marginBottom: 12 }}>The interrogators</div>
        <h2 className="landing-h2">Pick your poison.</h2>
        <p className="landing-section-sub">Six personas. Six different ways to expose your weaknesses. No easy options.</p>

        <div className="mono" style={{ fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--text-muted)", marginTop: 40, marginBottom: 16, borderBottom: "1px solid var(--border-default)", paddingBottom: 10 }}>
          Project Pitch Interrogators
        </div>
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

        <div className="mono" style={{ fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--text-muted)", marginTop: 48, marginBottom: 16, borderBottom: "1px solid var(--border-default)", paddingBottom: 10 }}>
          Interview Prep Personas
        </div>
        <div className="landing-personas" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}>
          {[
            ["Behavioral", "The Lie Detector", "12 years of interviewing. Heard every STAR answer ever written. If it sounds rehearsed, they'll call it out and ask for the real version — the one where you failed.", "\"Tell me about yourself in two sentences. No buzzwords.\" — then picks apart every word."],
            ["Resume Deep-Dive", "The Auditor", "Read your resume twice and is already looking for inconsistencies, inflated claims, and unexplained gaps. Goes line by line. If you listed it, you're getting asked about it.", "\"This says you 'led' the team — how many people exactly? Because the dates overlap with your previous role.\""],
          ].map(([tag, title, desc, q]) => (
            <div key={tag} className="landing-persona-card" style={{ borderColor: "rgba(226,75,74,0.25)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <div className="mono" style={{ fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--accent-red)" }}>{tag}</div>
                <span style={{ background: "rgba(226,75,74,0.1)", border: "1px solid rgba(226,75,74,0.3)", padding: "2px 7px" }} className="mono">
                  <span style={{ fontSize: 8, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--accent-red)" }}>Interview mode</span>
                </span>
              </div>
              <h3 style={{ fontSize: 20, fontWeight: 800, marginBottom: 10 }}>{title}</h3>
              <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: 20 }}>{desc}</p>
              <div className="mono" style={{ fontSize: 9, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--border-strong)", marginBottom: 6 }}>Sample question</div>
              <div style={{ borderLeft: "2px solid var(--accent-red)", paddingLeft: 14, fontSize: 13, color: "var(--text-muted)", fontStyle: "italic", lineHeight: 1.6 }}>{q}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── MARQUEE ── */}
      {(() => {
        const items = ["No coddling", "No participation trophies", "12 questions per session", "Specific to your project or resume", "Full performance report", "Per-answer confidence scoring", "PDF export", "Activity heatmap", "Free to start", "No mercy", "No shortcuts", "Real questions", "Real feedback", "Resume analysis", "GitHub profile scan"];
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
        <p className="landing-section-sub">Every session ends with a full scored report — strengths, weaknesses, confidence breakdown, and one action item. Export as PDF.</p>
        <div className="landing-proof">
          {[
            ["\"I thought I knew my product cold. The investor persona found three gaps in my business model in four minutes. My actual investor meeting went much better.\"", "Arjun S.", "Founder, dev tools startup"],
            ["\"The resume deep-dive asked about a gap in my timeline I thought nobody would notice. Fixed my answer before the real interview. Got the offer.\"", "Priya M.", "Senior engineer"],
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
        <p style={{ fontSize: 16, color: "var(--text-secondary)", marginBottom: 36, position: "relative" }}>Free to start. No credit card. Pitch your project or upload your resume — then survive 12 questions.</p>
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
          <Link to="/privacy" className="mono" style={{ fontSize: 10, color: "var(--text-muted)", letterSpacing: "0.14em", textTransform: "uppercase", textDecoration: "none" }}>Privacy</Link>
          <a href="mailto:gaurriya1611@gmail.com" className="mono" style={{ fontSize: 10, color: "var(--text-muted)", letterSpacing: "0.14em", textTransform: "uppercase", textDecoration: "none" }}>Contact</a>
        </div>
      </footer>

    </div>
  );
}
