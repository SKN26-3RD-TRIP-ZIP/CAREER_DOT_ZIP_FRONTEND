/**
 * 의존성 없는 SVG 레이더(5축) 차트.
 * data: [{ axis, label, score }]  (score 0-100)
 */
export default function RadarChart({ data = [] }) {
  const SIZE = 260;
  const cx = SIZE / 2;
  const cy = SIZE / 2;
  const R = 92;
  const n = data.length || 5;
  const MAX = 100;

  // 꼭짓점 각도: 맨 위(-90deg)부터 시계방향
  const angle = (i) => (-90 + (360 / n) * i) * (Math.PI / 180);
  const point = (i, ratio) => ({
    x: cx + R * ratio * Math.cos(angle(i)),
    y: cy + R * ratio * Math.sin(angle(i)),
  });

  const rings = [0.25, 0.5, 0.75, 1];
  const polygon = (ratio) =>
    data.map((_, i) => { const p = point(i, ratio); return `${p.x},${p.y}`; }).join(' ');

  const dataPolygon = data
    .map((d, i) => { const p = point(i, Math.max(0, Math.min(MAX, d.score)) / MAX); return `${p.x},${p.y}`; })
    .join(' ');

  return (
    <div className="flex w-full justify-center">
      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="h-72 w-full max-w-[320px]">
        {/* 격자 링 */}
        {rings.map((r) => (
          <polygon key={r} points={polygon(r)} fill="none" stroke="rgba(0,0,0,0.12)" strokeWidth="1" />
        ))}
        {/* 축선 */}
        {data.map((_, i) => {
          const p = point(i, 1);
          return <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="rgba(0,0,0,0.12)" strokeWidth="1" />;
        })}
        {/* 데이터 영역 */}
        <polygon points={dataPolygon} fill="#08CB00" fillOpacity="0.4" stroke="#08CB00" strokeWidth="2" />
        {/* 축 라벨 */}
        {data.map((d, i) => {
          const p = point(i, 1.18);
          return (
            <text key={d.axis ?? i} x={p.x} y={p.y} textAnchor="middle" dominantBaseline="middle" fontSize="11" fill="rgba(0,0,0,0.55)">
              {d.axis}
            </text>
          );
        })}
      </svg>
    </div>
  );
}
