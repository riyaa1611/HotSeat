import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";

const Home = lazy(() => import("./pages/Home"));
const Landing = lazy(() => import("./pages/Landing"));
const Session = lazy(() => import("./pages/Session"));
const Report = lazy(() => import("./pages/Report"));
const Auth = lazy(() => import("./pages/Auth"));
const History = lazy(() => import("./pages/History"));
const SharedReport = lazy(() => import("./pages/SharedReport"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Leaderboard = lazy(() => import("./pages/Leaderboard"));
const Profile = lazy(() => import("./pages/Profile"));

function PageSkeleton() {
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

function RootRoute() {
  const { user, loading } = useAuth();
  if (loading) return <PageSkeleton />;
  return user ? <Home /> : <Landing />;
}

function AppRoutes() {
  const location = useLocation();
  return (
    <div key={location.key} className="page-fade-in">
      <Suspense fallback={<PageSkeleton />}>
        <Routes location={location}>
          <Route path="/" element={<RootRoute />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/report/shared/:token" element={<SharedReport />} />
          <Route path="/app" element={<ProtectedRoute><Home /></ProtectedRoute>} />
          <Route path="/session" element={<ProtectedRoute><Session /></ProtectedRoute>} />
          <Route path="/report" element={<ProtectedRoute><Report /></ProtectedRoute>} />
          <Route path="/history" element={<ProtectedRoute><History /></ProtectedRoute>} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        </Routes>
      </Suspense>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
