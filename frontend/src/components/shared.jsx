// frontend/src/components/shared.jsx

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
      <div style={{
        width: big ? 36 : 24, height: big ? 36 : 24,
        background: 'var(--accent-red)', display: 'grid', placeItems: 'center',
        boxShadow: '0 0 24px rgba(226,75,74,0.4)',
      }}>
        <FlameIcon size={big ? 22 : 14} color="#fff" />
      </div>
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
