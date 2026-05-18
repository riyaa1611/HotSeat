import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getProfile, updateProfile, getHistory } from "../services/api";
import { Grain, Logo, LogoutButton, ThemeToggle, useToast, ToastContainer } from "../components/shared";
import { useAuth } from "../context/AuthContext";

const PERSONA_LABEL = {
  investor: "Investor", tech_lead: "Tech Lead",
  hr_manager: "HR Manager", product_manager: "Product Manager",
  behavioral: "Behavioral", resume_deepdive: "Resume Deep-Dive",
};

/* ── Activity heatmap ───────────────────────────────── */
function ActivityHeatmap({ activityData }) {
  const [tooltip, setTooltip] = useState(null);

  const actMap = {};
  (activityData || []).forEach((d) => { actMap[d.date] = d.count; });

  const today = new Date();
  const days = [];
  for (let i = 364; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    days.push({ date: key, count: actMap[key] || 0, dow: d.getDay() });
  }

  // Pad front so first day starts on correct column (Sunday = 0)
  const firstDow = days[0].dow;
  const padded = [...Array(firstDow).fill(null), ...days];

  // Split into weeks
  const weeks = [];
  for (let i = 0; i < padded.length; i += 7) {
    weeks.push(padded.slice(i, i + 7));
  }

  const MONTH_LABELS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const DAY_LABELS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

  function cellColor(count) {
    if (count === 0) return "var(--bg-card-2)";
    if (count === 1) return "rgba(93,202,165,0.35)";
    if (count === 2) return "rgba(93,202,165,0.6)";
    return "var(--accent-green)";
  }

  // Month label positions
  const monthPositions = [];
  weeks.forEach((week, wi) => {
    week.forEach((day) => {
      if (day && day.date.endsWith("-01")) {
        const m = parseInt(day.date.slice(5, 7), 10) - 1;
        monthPositions.push({ wi, label: MONTH_LABELS[m] });
      }
    });
  });

  const totalSessions = (activityData || []).reduce((a, d) => a + d.count, 0);

  return (
    <div style={{ overflowX: "auto" }}>
      {/* Month labels */}
      <div style={{ display: "flex", paddingLeft: 28, marginBottom: 4, position: "relative", height: 16 }}>
        {monthPositions.map(({ wi, label }) => (
          <span key={wi + label} className="mono" style={{
            position: "absolute", left: 28 + wi * 14, fontSize: 9,
            color: "var(--text-muted)", letterSpacing: "0.08em",
          }}>{label}</span>
        ))}
      </div>
      <div style={{ display: "flex", gap: 2 }}>
        {/* Day labels */}
        <div style={{ display: "flex", flexDirection: "column", gap: 2, marginRight: 4 }}>
          {DAY_LABELS.map((d, i) => (
            <span key={d} className="mono" style={{
              fontSize: 8, color: i % 2 === 0 ? "transparent" : "var(--text-muted)",
              height: 12, lineHeight: "12px", letterSpacing: "0.06em", userSelect: "none",
            }}>{d}</span>
          ))}
        </div>
        {/* Grid */}
        {weeks.map((week, wi) => (
          <div key={wi} style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {week.map((day, di) => (
              <div
                key={di}
                style={{
                  width: 12, height: 12,
                  background: day ? cellColor(day.count) : "transparent",
                  borderRadius: 2,
                  cursor: day && day.count > 0 ? "pointer" : "default",
                  transition: "opacity 0.1s",
                }}
                onMouseEnter={() => day && setTooltip({ date: day.date, count: day.count })}
                onMouseLeave={() => setTooltip(null)}
              />
            ))}
          </div>
        ))}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
        <span className="mono" style={{ fontSize: 9, color: "var(--text-muted)", letterSpacing: "0.1em" }}>
          {totalSessions} session{totalSessions !== 1 ? "s" : ""} in the last year
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span className="mono" style={{ fontSize: 9, color: "var(--text-muted)" }}>Less</span>
          {[0, 1, 2, 3].map((v) => (
            <div key={v} style={{ width: 10, height: 10, background: cellColor(v), borderRadius: 2 }} />
          ))}
          <span className="mono" style={{ fontSize: 9, color: "var(--text-muted)" }}>More</span>
        </div>
      </div>
      {tooltip && tooltip.count > 0 && (
        <div className="mono" style={{
          marginTop: 6, fontSize: 10, color: "var(--text-secondary)",
          letterSpacing: "0.1em",
        }}>
          {tooltip.date} — {tooltip.count} session{tooltip.count !== 1 ? "s" : ""}
        </div>
      )}
    </div>
  );
}

/* ── Score history chart ────────────────────────────── */
function ScoreHistoryChart({ scoreHistory }) {
  if (!scoreHistory || scoreHistory.length < 2) {
    return (
      <div style={{ color: "var(--text-muted)", fontSize: 13, padding: "20px 0" }}>
        Complete 2+ sessions to see your progress trend.
      </div>
    );
  }

  const W = 600, H = 140, padX = 32, padY = 20;
  const scores = scoreHistory.map((s) => s.score);
  const minS = Math.max(0, Math.min(...scores) - 1);
  const maxS = Math.min(10, Math.max(...scores) + 1);
  const xStep = (W - padX * 2) / (scores.length - 1);
  const yScale = (v) => H - padY - ((v - minS) / (maxS - minS)) * (H - padY * 2);

  const points = scores.map((s, i) => `${padX + i * xStep},${yScale(s)}`).join(" ");

  return (
    <div style={{ overflowX: "auto" }}>
      <svg width={W} height={H} style={{ display: "block", overflow: "visible", minWidth: Math.max(W, scores.length * 20) }}>
        {/* Grid lines */}
        {[3, 5, 7, 10].map((v) => (
          <g key={v}>
            <line x1={padX} x2={W - padX} y1={yScale(v)} y2={yScale(v)} stroke="var(--border-default)" strokeWidth="1" strokeDasharray="4 4" />
            <text x={padX - 6} y={yScale(v) + 4} textAnchor="end" style={{ fill: "var(--text-muted)", fontSize: 9, fontFamily: "JetBrains Mono, monospace" }}>{v}</text>
          </g>
        ))}
        {/* Line */}
        <polyline points={points} fill="none" stroke="var(--accent-red)" strokeWidth="2" strokeLinejoin="round" />
        {/* Area fill */}
        <polyline
          points={`${padX},${H - padY} ${points} ${padX + (scores.length - 1) * xStep},${H - padY}`}
          fill="url(#scoreGrad)" opacity="0.15"
        />
        <defs>
          <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--accent-red)" />
            <stop offset="100%" stopColor="transparent" />
          </linearGradient>
        </defs>
        {/* Dots */}
        {scores.map((s, i) => {
          const color = s >= 7 ? "var(--accent-green)" : s < 5 ? "var(--accent-red)" : "var(--accent-amber)";
          return (
            <g key={i}>
              <circle cx={padX + i * xStep} cy={yScale(s)} r={4} fill={color} stroke="var(--bg-primary)" strokeWidth="2" />
              <text x={padX + i * xStep} y={yScale(s) - 9} textAnchor="middle" style={{ fill: color, fontSize: 9, fontWeight: 700, fontFamily: "JetBrains Mono, monospace" }}>{s}</text>
            </g>
          );
        })}
      </svg>
      {/* Persona labels below */}
      <div style={{ display: "flex", gap: 0, marginTop: 6, overflowX: "auto" }}>
        {scoreHistory.map((s, i) => (
          <div key={i} style={{ minWidth: Math.max(20, (W - padX * 2) / (scores.length - 1)), textAlign: "center" }}>
            <span className="mono" style={{ fontSize: 8, color: "var(--text-muted)", letterSpacing: "0.06em", textTransform: "uppercase" }}>
              {(PERSONA_LABEL[s.persona] || s.persona || "").slice(0, 6)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Edit profile modal ─────────────────────────────── */
function EditModal({ profile, onSave, onClose }) {
  const [form, setForm] = useState({
    display_name: profile.display_name || "",
    bio: profile.bio || "",
    job_title: profile.job_title || "",
    company: profile.company || "",
    location: profile.location || "",
    linkedin_url: profile.linkedin_url || "",
    github_url: profile.github_url || "",
  });
  const [saving, setSaving] = useState(false);

  function set(k, v) { setForm((f) => ({ ...f, [k]: v })); }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    await onSave(form);
    setSaving(false);
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 200, display: "grid", placeItems: "center", padding: 20 }}
      onClick={onClose}>
      <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-strong)", padding: "32px", width: "100%", maxWidth: 480 }}
        onClick={(e) => e.stopPropagation()}>
        <div className="mono" style={{ fontSize: 10, letterSpacing: "0.22em", textTransform: "uppercase", color: "var(--accent-red)", marginBottom: 20 }}>
          Edit Profile
        </div>
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {[
            { key: "display_name", label: "Display Name", max: 80 },
            { key: "job_title", label: "Job Title", max: 120 },
            { key: "company", label: "Company", max: 120 },
            { key: "location", label: "Location", max: 120 },
            { key: "linkedin_url", label: "LinkedIn URL", max: 300 },
            { key: "github_url", label: "GitHub URL", max: 300 },
          ].map(({ key, label, max }) => (
            <div key={key}>
              <div className="mono" style={{ fontSize: 9, color: "var(--text-muted)", letterSpacing: "0.16em", textTransform: "uppercase", marginBottom: 6 }}>{label}</div>
              <input type="text" value={form[key]} onChange={(e) => set(key, e.target.value)} maxLength={max} style={{ fontSize: 13, padding: "10px 12px" }} />
            </div>
          ))}
          <div>
            <div className="mono" style={{ fontSize: 9, color: "var(--text-muted)", letterSpacing: "0.16em", textTransform: "uppercase", marginBottom: 6 }}>Bio</div>
            <textarea value={form.bio} onChange={(e) => set("bio", e.target.value)} maxLength={500} rows={3} style={{ fontSize: 13, resize: "vertical" }} />
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
            <button type="submit" className="btn btn-primary" disabled={saving} style={{ flex: 1, fontSize: 13 }}>
              {saving ? "Saving…" : "Save Changes"}
            </button>
            <button type="button" className="btn btn-ghost" onClick={onClose} style={{ padding: "12px 16px", fontSize: 13 }}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ── Stat box ───────────────────────────────────────── */
function StatBox({ label, value, color }) {
  return (
    <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-default)", padding: "18px 20px" }}>
      <div className="mono" style={{ fontSize: 9, color: "var(--text-muted)", letterSpacing: "0.18em", textTransform: "uppercase", marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 800, color: color || "var(--text-primary)" }}>{value ?? "—"}</div>
    </div>
  );
}

/* ── Profile page ───────────────────────────────────── */
export default function Profile() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toasts, toast } = useToast();
  const [profile, setProfile] = useState(null);
  const [recentSessions, setRecentSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEdit, setShowEdit] = useState(false);

  useEffect(() => {
    Promise.all([getProfile(), getHistory()])
      .then(([prof, hist]) => {
        setProfile(prof);
        setRecentSessions(hist.slice(0, 8));
      })
      .catch(() => toast("Failed to load profile.", "error"))
      .finally(() => setLoading(false));
  }, []);

  async function handleSave(form) {
    try {
      await updateProfile({
        display_name: form.display_name,
        bio: form.bio,
        job_title: form.job_title,
        company: form.company,
        location: form.location,
        linkedin_url: form.linkedin_url,
        github_url: form.github_url,
      });
      setProfile((p) => ({ ...p, ...form }));
      setShowEdit(false);
      toast("Profile saved.");
    } catch {
      toast("Failed to save profile.", "error");
    }
  }

  const email = user?.email || "";
  const avatarLetter = ((profile?.display_name || email || "?")[0] || "?").toUpperCase();
  const avgColor = profile?.avg_score >= 7 ? "var(--accent-green)" : profile?.avg_score < 5 ? "var(--accent-red)" : "var(--accent-amber)";

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {showEdit && profile && <EditModal profile={profile} onSave={handleSave} onClose={() => setShowEdit(false)} />}
      <ToastContainer toasts={toasts} />
      <Grain />

      <header className="page-header">
        <Logo size="sm" />
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn btn-ghost" onClick={() => navigate("/")} style={{ padding: "8px 14px", fontSize: 12 }}>← Home</button>
          <ThemeToggle />
          <LogoutButton />
        </div>
      </header>

      <main style={{ flex: 1, maxWidth: 860, margin: "0 auto", width: "100%", padding: "40px 32px 80px" }}>
        <div className="mono" style={{ fontSize: 10, letterSpacing: "0.22em", color: "var(--accent-red)", textTransform: "uppercase", marginBottom: 16 }}>
          Profile
        </div>

        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[1, 2, 3, 4].map((i) => <div key={i} className="skeleton" style={{ height: 60 }} />)}
          </div>
        ) : (
          <>
            {/* ── Identity card ── */}
            <div style={{
              background: "var(--bg-card)", border: "1px solid var(--border-default)",
              padding: "28px 32px", marginBottom: 1,
              display: "flex", gap: 24, alignItems: "flex-start", flexWrap: "wrap",
            }}>
              {/* Avatar */}
              <div style={{
                width: 72, height: 72, background: "var(--accent-red)", flexShrink: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 32, fontWeight: 800, color: "#fff",
              }}>
                {avatarLetter}
              </div>

              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 4 }}>
                  <span style={{ fontSize: 22, fontWeight: 800 }}>
                    {profile?.display_name || "Anonymous"}
                  </span>
                  {profile?.job_title && (
                    <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>
                      {profile.job_title}{profile.company ? ` @ ${profile.company}` : ""}
                    </span>
                  )}
                  <button className="btn btn-ghost" onClick={() => setShowEdit(true)} style={{ padding: "3px 10px", fontSize: 10, marginLeft: "auto" }}>
                    Edit Profile
                  </button>
                </div>

                <div className="mono" style={{ fontSize: 11, color: "var(--text-muted)", letterSpacing: "0.1em", marginBottom: 8 }}>{email}</div>

                <div style={{ display: "flex", gap: 16, flexWrap: "wrap", fontSize: 12, color: "var(--text-secondary)" }}>
                  {profile?.location && (
                    <span>📍 {profile.location}</span>
                  )}
                  {profile?.linkedin_url && (
                    <a href={profile.linkedin_url} target="_blank" rel="noopener noreferrer"
                      style={{ color: "var(--accent-red)", textDecoration: "none" }}>
                      LinkedIn ↗
                    </a>
                  )}
                  {profile?.github_url && (
                    <a href={profile.github_url} target="_blank" rel="noopener noreferrer"
                      style={{ color: "var(--accent-red)", textDecoration: "none" }}>
                      GitHub ↗
                    </a>
                  )}
                </div>

                {profile?.bio && (
                  <div style={{ marginTop: 12, fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6, maxWidth: 520 }}>
                    {profile.bio}
                  </div>
                )}

                {profile?.most_used_persona && (
                  <div className="mono" style={{ marginTop: 10, fontSize: 10, color: "var(--text-muted)", letterSpacing: "0.1em" }}>
                    FAVOURITE MODE: {(PERSONA_LABEL[profile.most_used_persona] || profile.most_used_persona).toUpperCase()}
                  </div>
                )}
              </div>
            </div>

            {/* ── Stats strip ── */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 1, background: "var(--border-default)", marginBottom: 28 }}>
              <StatBox label="Sessions" value={profile?.total_sessions ?? 0} />
              <StatBox
                label="Avg Score"
                value={profile?.avg_score != null ? `${profile.avg_score}/10` : "—"}
                color={profile?.avg_score != null ? avgColor : undefined}
              />
              <StatBox
                label="Best Score"
                value={profile?.best_score != null ? `${profile.best_score}/10` : "—"}
                color={profile?.best_score != null ? "var(--accent-green)" : undefined}
              />
              <StatBox
                label="This Week"
                value={profile?.sessions_this_week ?? 0}
                color={profile?.sessions_this_week > 0 ? "var(--accent-amber)" : undefined}
              />
            </div>

            {/* ── Activity heatmap ── */}
            <div className="section-divider"><span>Activity</span></div>
            <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-default)", padding: "24px 28px", marginBottom: 28 }}>
              <ActivityHeatmap activityData={profile?.activity_data || []} />
            </div>

            {/* ── Progress graph ── */}
            <div className="section-divider"><span>Score Progress</span></div>
            <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-default)", padding: "24px 28px", marginBottom: 28 }}>
              <ScoreHistoryChart scoreHistory={profile?.score_history || []} />
            </div>

            {/* ── Session history ── */}
            {recentSessions.length > 0 && (
              <>
                <div className="section-divider"><span>Session History</span></div>
                <div style={{ display: "flex", flexDirection: "column", gap: 1, background: "var(--border-default)", marginBottom: 12 }}>
                  {recentSessions.map((s) => {
                    const score = s.report?.overall;
                    const scoreColor = score >= 7 ? "var(--accent-green)" : score < 5 ? "var(--accent-red)" : "var(--accent-amber)";
                    const date = new Date(s.started_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
                    return (
                      <div
                        key={s.session_id}
                        onClick={() => s.report && navigate("/report", { state: { report: s.report, persona: s.persona, repoUrl: s.repo_url } })}
                        style={{
                          background: "var(--bg-card)", padding: "14px 20px",
                          display: "flex", alignItems: "center", gap: 16,
                          cursor: s.report ? "pointer" : "default", opacity: s.report ? 1 : 0.6,
                        }}
                      >
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 2 }}>
                            {PERSONA_LABEL[s.persona] || s.persona}
                          </div>
                          <div className="mono" style={{ fontSize: 10, color: "var(--text-muted)", letterSpacing: "0.1em" }}>
                            {date} · {(s.repo_url || "").split("/").slice(-1)[0] || "project"}
                          </div>
                        </div>
                        {score != null ? (
                          <div style={{ fontWeight: 800, fontSize: 18, color: scoreColor }}>
                            {score}<span style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 400 }}>/10</span>
                          </div>
                        ) : (
                          <span className="mono" style={{ fontSize: 10, color: "var(--text-muted)" }}>IN PROGRESS</span>
                        )}
                      </div>
                    );
                  })}
                </div>
                <button className="btn btn-ghost" onClick={() => navigate("/history")} style={{ fontSize: 12, padding: "8px 16px" }}>
                  View Full History →
                </button>
              </>
            )}

            {recentSessions.length === 0 && (
              <div style={{ color: "var(--text-muted)", fontSize: 15, marginTop: 24 }}>
                No sessions yet.{" "}
                <span style={{ color: "var(--accent-red)", cursor: "pointer" }} onClick={() => navigate("/")}>Start one.</span>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
