import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Home from "./pages/Home";
import Landing from "./pages/Landing";
import Session from "./pages/Session";
import Report from "./pages/Report";
import Auth from "./pages/Auth";
import History from "./pages/History";
import SharedReport from "./pages/SharedReport";
import Privacy from "./pages/Privacy";
import Leaderboard from "./pages/Leaderboard";

function RootRoute() {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? <Home /> : <Landing />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<RootRoute />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/report/shared" element={<SharedReport />} />
          <Route path="/app" element={<ProtectedRoute><Home /></ProtectedRoute>} />
          <Route path="/session" element={<ProtectedRoute><Session /></ProtectedRoute>} />
          <Route path="/report" element={<ProtectedRoute><Report /></ProtectedRoute>} />
          <Route path="/history" element={<ProtectedRoute><History /></ProtectedRoute>} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
