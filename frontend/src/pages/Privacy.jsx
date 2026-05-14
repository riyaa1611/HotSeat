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
          ["What we collect", `Email address and authentication data via Supabase Auth. Session data: repo URLs you submit, persona chosen, questions and answers, and performance scores. This data is stored in our database and associated with your account.`],
          ["What we don't collect", `We do not store webcam footage. Webcam access is used locally in your browser for proctoring feedback only — no video is transmitted or saved. We do not sell your data.`],
          ["How we use your data", `To run interview sessions, generate performance reports, and show you your session history. Session data is used to provide the service and is not shared with third parties.`],
          ["Data retention", `Your account and session history persist until you delete your account. You can request deletion by emailing us.`],
          ["Third-party services", `Supabase (authentication and database), Groq (AI inference — your answers are sent to Groq's API to generate responses), Render (backend hosting), Vercel (frontend hosting).`],
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
