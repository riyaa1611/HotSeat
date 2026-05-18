import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Grain, Logo, ThemeToggle, RankBadge } from "../components/shared";
import { getLeaderboard } from "../services/api";

const PERSONA_LABEL = {
  investor: "Investor", tech_lead: "Tech Lead",
  hr_manager: "HR Manager", product_manager: "Product Manager",
  behavioral: "Behavioral", resume_deepdive: "Resume Deep-Dive",
};

export default function Leaderboard() {
  const navigate = useNavigate();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getLeaderboard().then((data) => { setEntries(data); setLoading(false); });
  }, []);

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "var(--bg-primary)" }}>
      <Grain />
      <header className="page-header">
        <Logo size="sm" />
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn btn-ghost" onClick={() => navigate("/")} style={{ padding: "8px 14px", fontSize: 12 }}>← Home</button>
          <ThemeToggle />
        </div>
      </header>

      <main className="leaderboard-main" style={{ flex: 1, maxWidth: 1100, margin: "0 auto", width: "100%", padding: "40px 40px 80px" }}>
        <div className="mono" style={{ fontSize: 10, letterSpacing: "0.22em", color: "var(--accent-red)", textTransform: "uppercase", marginBottom: 12 }}>
          Global Rankings
        </div>
        <h1 style={{ fontSize: 36, fontWeight: 800, letterSpacing: "-0.03em", margin: "0 0 8px" }}>Leaderboard</h1>
        <p style={{ fontSize: 14, color: "var(--text-muted)", marginBottom: 36 }}>Top 20 scores across all sessions. User IDs are anonymized.</p>

        {loading && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {[1,2,3,4,5].map((i) => <div key={i} className="skeleton" style={{ height: 56 }} />)}
          </div>
        )}

        {!loading && entries.length === 0 && (
          <div style={{ color: "var(--text-muted)", fontSize: 15 }}>No sessions yet. Be the first.</div>
        )}

        {!loading && entries.length > 0 && (
          <div style={{ border: "1px solid var(--border-default)" }}>
            {/* Header row */}
            <div className="leaderboard-grid" style={{ background: "var(--bg-card-2)", borderBottom: "1px solid var(--border-default)", padding: "12px 24px" }}>
              {[
                { label: "#", cls: "" },
                { label: "User", cls: "" },
                { label: "Persona", cls: "leaderboard-col-persona" },
                { label: "Repo", cls: "leaderboard-col-repo" },
                { label: "Score", cls: "" },
              ].map(({ label, cls }) => (
                <div key={label} className={`mono${cls ? ` ${cls}` : ""}`} style={{ fontSize: 9, letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--text-muted)" }}>{label}</div>
              ))}
            </div>

            {entries.map((e, i) => {
              const color = e.overall >= 7 ? "var(--accent-green)" : e.overall < 5 ? "var(--accent-red)" : "var(--accent-amber)";
              return (
                <div
                  key={i}
                  className="leaderboard-grid"
                  style={{
                    padding: "16px 24px", alignItems: "center",
                    borderBottom: i < entries.length - 1 ? "1px solid var(--border-default)" : "none",
                    background: i < 3 ? "rgba(226,75,74,0.03)" : "var(--bg-card)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center" }}>
                    <RankBadge rank={i + 1} />
                  </div>
                  <div className="mono" style={{ fontSize: 12, color: "var(--text-secondary)", letterSpacing: "0.06em" }}>{e.user}</div>
                  <div className="leaderboard-col-persona" style={{ fontSize: 13, color: "var(--text-secondary)" }}>{PERSONA_LABEL[e.persona] || e.persona}</div>
                  <div className="leaderboard-col-repo mono" style={{ fontSize: 12, color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.repo}</div>
                  <div style={{ fontWeight: 700, fontSize: 13, color }}>{e.overall}<span style={{ fontSize: 13, color: "var(--text-muted)", fontWeight: 400 }}>/10</span></div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
