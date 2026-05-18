import { createContext, useContext, useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabase";

const AuthContext = createContext(null);

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000/api";
const IDLE_TIMEOUT = 60 * 60 * 1000; // 1 hour
const ACTIVITY_EVENTS = ["mousemove", "keydown", "click", "scroll", "touchstart"];

async function syncBackendCookie(accessToken) {
  try {
    await fetch(`${API_BASE}/auth/session`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Requested-With": "XMLHttpRequest" },
      credentials: "include",
      body: JSON.stringify({ access_token: accessToken }),
    });
  } catch { /* non-fatal */ }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const idleTimer = useRef(null);

  function resetIdleTimer() {
    clearTimeout(idleTimer.current);
    idleTimer.current = setTimeout(() => supabase.auth.signOut(), IDLE_TIMEOUT);
  }

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.access_token) await syncBackendCookie(session.access_token);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null);
      if (session?.access_token) await syncBackendCookie(session.access_token);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Start idle timer only when user is logged in
  useEffect(() => {
    if (!user) { clearTimeout(idleTimer.current); return; }
    resetIdleTimer();
    ACTIVITY_EVENTS.forEach((e) => window.addEventListener(e, resetIdleTimer, { passive: true }));
    return () => {
      clearTimeout(idleTimer.current);
      ACTIVITY_EVENTS.forEach((e) => window.removeEventListener(e, resetIdleTimer));
    };
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
