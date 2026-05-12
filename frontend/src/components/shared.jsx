// frontend/src/components/shared.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

export function useTheme() {
  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "dark");
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);
  const toggle = () => setTheme(t => t === "dark" ? "light" : "dark");
  return { theme, toggle };
}

function SunIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="4"/>
      <line x1="12" y1="2" x2="12" y2="5"/>
      <line x1="12" y1="19" x2="12" y2="22"/>
      <line x1="4.22" y1="4.22" x2="6.34" y2="6.34"/>
      <line x1="17.66" y1="17.66" x2="19.78" y2="19.78"/>
      <line x1="2" y1="12" x2="5" y2="12"/>
      <line x1="19" y1="12" x2="22" y2="12"/>
      <line x1="4.22" y1="19.78" x2="6.34" y2="17.66"/>
      <line x1="17.66" y1="6.34" x2="19.78" y2="4.22"/>
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
    </svg>
  );
}

export function ThemeToggle() {
  const { theme, toggle } = useTheme();
  return (
    <button className="btn btn-ghost" onClick={toggle}
      style={{ padding: "6px 10px" }}
      title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}>
      {theme === "dark" ? <SunIcon /> : <MoonIcon />}
    </button>
  );
}

const _API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

export function LogoutButton() {
  const navigate = useNavigate();
  async function handleLogout() {
    try {
      await fetch(`${_API_BASE}/auth/logout`, { method: "POST", credentials: "include" });
    } catch { /* non-fatal */ }
    await supabase.auth.signOut();
    navigate("/");
  }
  return (
    <button className="btn btn-ghost" onClick={handleLogout}
      style={{ padding: "6px 12px", fontSize: 11 }}>
      Sign Out
    </button>
  );
}

export function Grain() {
  return <div className="grain" />;
}

export function FlameIcon({ size = 18, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8.5 14.5A2.5 2.5 0 0 0 11 17c1.4 0 2.5-1.1 2.5-2.5 0-2-2.5-3-2.5-5 0 0-1 .5-1 2 0 1.5 1 1.5 1 3 0 1.5-1.5 1.5-1.5 0z"/>
      <path d="M12 2c1 3 5 5 5 10a5 5 0 1 1-10 0c0-2 1-4 2-5 0 2 1 3 2 3-1-3 0-6 1-8z"/>
    </svg>
  );
}

export function Logo({ size = 'lg' }) {
  const big = size === 'lg';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: big ? 12 : 8 }}>
      <img src="/favicon.png" alt="" style={{ width: big ? 36 : 24, height: big ? 36 : 24 }} />
      <div style={{ fontWeight: 800, fontSize: big ? 22 : 16, letterSpacing: '-0.02em' }}>
        Hot<span style={{ color: 'var(--accent-red)' }}>Seat</span>
      </div>
    </div>
  );
}

export function SectionDivider({ children }) {
  return <div className="section-divider"><span>{children}</span></div>;
}

export function RadarChartSVG({ data, max = 10, size = 320 }) {
  const cx = size / 2, cy = size / 2;
  const radius = size * 0.36;
  const N = data.length;
  const angle = (i) => -Math.PI / 2 + (i * 2 * Math.PI) / N;
  const point = (i, v) => {
    const r = (v / max) * radius;
    return [cx + r * Math.cos(angle(i)), cy + r * Math.sin(angle(i))];
  };
  const rings = [0.25, 0.5, 0.75, 1];
  const polygon = (vals) => vals.map((v, i) => point(i, v).join(',')).join(' ');
  const dataPoly = polygon(data.map(d => d.score));
  return (
    <svg width="100%" height={size} viewBox={`0 0 ${size} ${size}`} style={{ overflow: 'visible' }}>
      {rings.map((r, i) => (
        <polygon key={i} points={polygon(data.map(() => r * max))}
          fill="none" stroke="#2C2C2F" strokeWidth="1" />
      ))}
      {data.map((_, i) => {
        const [x, y] = point(i, max);
        return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="#2C2C2F" strokeWidth="1" />;
      })}
      <polygon points={dataPoly} fill="rgba(226, 75, 74, 0.28)" stroke="#E24B4A" strokeWidth="2"
        style={{ filter: 'drop-shadow(0 0 8px rgba(226,75,74,0.4))' }} />
      {data.map((d, i) => {
        const [px, py] = point(i, d.score);
        return <circle key={i} cx={px} cy={py} r="3" fill="#E24B4A" stroke="#0A0A0B" strokeWidth="1.5" />;
      })}
      {data.map((d, i) => {
        const [lx, ly] = point(i, max + 1.6);
        const a = angle(i);
        const anchor = Math.abs(Math.cos(a)) < 0.2 ? 'middle' : (Math.cos(a) > 0 ? 'start' : 'end');
        return (
          <g key={i}>
            <text x={lx} y={ly} textAnchor={anchor} dominantBaseline="middle"
              fill="#9B9A97" fontSize="11" fontFamily="JetBrains Mono, monospace"
              letterSpacing="1" style={{ textTransform: 'uppercase' }}>
              {d.metric}
            </text>
            <text x={lx} y={ly + 14} textAnchor={anchor} dominantBaseline="middle"
              fill="#5F5E5A" fontSize="10" fontFamily="JetBrains Mono, monospace">
              {d.score}/10
            </text>
          </g>
        );
      })}
    </svg>
  );
}
