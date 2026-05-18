import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function AuthSkeleton() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <header style={{ padding: "16px 24px", borderBottom: "1px solid var(--border-default)", display: "flex", alignItems: "center", gap: 12 }}>
        <div className="skeleton" style={{ width: 90, height: 22 }} />
        <div style={{ flex: 1 }} />
        <div className="skeleton" style={{ width: 72, height: 30 }} />
        <div className="skeleton" style={{ width: 72, height: 30 }} />
      </header>
      <main style={{ flex: 1, maxWidth: 680, margin: "0 auto", width: "100%", padding: "48px 32px" }}>
        <div className="skeleton" style={{ height: 11, width: "35%", marginBottom: 20 }} />
        <div className="skeleton" style={{ height: 44, width: "72%", marginBottom: 12 }} />
        <div className="skeleton" style={{ height: 13, width: "88%", marginBottom: 6 }} />
        <div className="skeleton" style={{ height: 13, width: "65%", marginBottom: 48 }} />
        <div className="skeleton" style={{ height: 52, marginBottom: 10 }} />
        <div className="skeleton" style={{ height: 52, marginBottom: 10 }} />
        <div className="skeleton" style={{ height: 52 }} />
      </main>
    </div>
  );
}

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <AuthSkeleton />;
  if (!user) return <Navigate to="/auth" replace />;
  return children;
}
