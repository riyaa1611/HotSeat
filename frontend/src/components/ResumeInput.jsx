import { useRef, useState } from "react";

export default function ResumeInput({ onReady }) {
  const [file, setFile] = useState(null);
  const [githubUrl, setGithubUrl] = useState("");
  const [role, setRole] = useState("");
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef(null);

  function notify(f, g, r) {
    const ready = f && g.trim() && r.trim();
    onReady(ready ? { file: f, githubUrl: g.trim(), role: r.trim() } : null);
  }

  function handleFile(f) {
    if (f && f.type === "application/pdf") {
      setFile(f);
      notify(f, githubUrl, role);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div className="section-divider"><span>01 · Upload Resume + Profile</span></div>

      <div
        onClick={() => fileRef.current.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          handleFile(e.dataTransfer.files[0]);
        }}
        style={{
          border: `2px dashed ${dragging ? "var(--accent-red)" : "var(--border-default)"}`,
          padding: "28px 24px",
          textAlign: "center",
          cursor: "pointer",
          background: dragging ? "rgba(226,75,74,0.04)" : "var(--bg-input)",
          transition: "border-color 0.15s, background 0.15s",
        }}
      >
        <input
          ref={fileRef}
          type="file"
          accept=".pdf"
          style={{ display: "none" }}
          onChange={(e) => handleFile(e.target.files[0])}
        />
        {file ? (
          <span className="mono" style={{ fontSize: 13, color: "var(--accent-green)" }}>
            ✓ {file.name} · {(file.size / 1024).toFixed(0)} KB
          </span>
        ) : (
          <span className="mono" style={{ fontSize: 12, color: "var(--text-muted)", letterSpacing: "0.12em" }}>
            Drop resume PDF or click to upload
          </span>
        )}
      </div>

      <input
        type="text"
        placeholder="github.com/username"
        value={githubUrl}
        onChange={(e) => { setGithubUrl(e.target.value); notify(file, e.target.value, role); }}
        style={{ fontSize: 14, padding: "10px 14px", background: "var(--bg-input)", border: "1px solid var(--border-default)", color: "var(--text-primary)", width: "100%", boxSizing: "border-box" }}
      />

      <input
        type="text"
        placeholder="Target role — e.g. Senior SWE at Google"
        value={role}
        onChange={(e) => { setRole(e.target.value); notify(file, githubUrl, e.target.value); }}
        style={{ fontSize: 14, padding: "10px 14px", background: "var(--bg-input)", border: "1px solid var(--border-default)", color: "var(--text-primary)", width: "100%", boxSizing: "border-box" }}
      />
    </div>
  );
}
