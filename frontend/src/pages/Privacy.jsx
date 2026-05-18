import { useNavigate } from "react-router-dom";
import { Logo } from "../components/shared";

export default function Privacy() {
  const navigate = useNavigate();
  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-primary)", color: "var(--text-primary)" }}>
      <header style={{ padding: "20px 40px", borderBottom: "1px solid var(--border-default)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Logo size="sm" />
        <button className="btn btn-ghost" onClick={() => navigate(-1)} style={{ fontSize: 12, padding: "7px 14px" }}>← Back</button>
      </header>
      <main style={{ maxWidth: 720, margin: "0 auto", padding: "60px 32px 100px" }}>
        <div className="mono" style={{ fontSize: 10, letterSpacing: "0.22em", textTransform: "uppercase", color: "var(--accent-red)", marginBottom: 12 }}>Legal</div>
        <h1 style={{ fontSize: 36, fontWeight: 800, marginBottom: 8 }}>Privacy Policy</h1>
        <p className="mono" style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 48 }}>Last updated: May 2026</p>

        {[
          ["What we collect", `Email address and authentication data via Supabase Auth. Session data: repo URLs or project URLs you submit, resume files uploaded for interview practice, the GitHub profile URL you provide, persona chosen, questions and answers, and performance scores. Profile data you optionally enter: display name, bio, job title, company, location, LinkedIn URL, and GitHub URL. All data is stored in our database and associated with your account.`],
          ["Resume and GitHub data", `When you use Interview Prep mode, your uploaded PDF resume is parsed server-side to extract text for context. Your GitHub profile (public repositories, bio, and activity) is fetched via the GitHub API. Resume files are not stored — they are read in memory during the session and discarded. GitHub data is fetched live and not persisted beyond the session context.`],
          ["What we don't collect", `We do not store webcam footage. Webcam access is used locally in your browser for proctoring feedback only — no video is transmitted or saved. We do not sell your data. We do not share your profile information publicly — your profile is visible only to you when logged in.`],
          ["How we use your data", `To run pitch practice and interview sessions, generate per-answer performance reports, track your score history and session activity, display your profile and progress charts, and show streak and leaderboard data. Session data is used to provide the service and is not shared with third parties.`],
          ["Profile data", `Profile fields (bio, job title, company, location, LinkedIn URL, GitHub URL) are optional and stored in your user profile record. They are used solely to personalise your profile page. You can edit or clear this information at any time from the Profile page.`],
          ["Data retention", `Your account, session history, and profile data persist until you delete your account. You can request deletion by emailing us.`],
          ["Third-party services", `Supabase (authentication and database), Groq (AI inference — your answers and resume context are sent to Groq's API to generate responses and evaluations), GitHub API (fetching public profile data in Interview Prep mode), Render (backend hosting), Vercel (frontend hosting).`],
          ["Contact", `Questions or deletion requests: gaurriya1611@gmail.com`],
        ].map(([title, body]) => (
          <section key={title} style={{ marginBottom: 40 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12, borderLeft: "2px solid var(--accent-red)", paddingLeft: 14 }}>{title}</h2>
            <p style={{ fontSize: 15, color: "var(--text-secondary)", lineHeight: 1.7, paddingLeft: 14 }}>{body}</p>
          </section>
        ))}
      </main>
    </div>
  );
}
