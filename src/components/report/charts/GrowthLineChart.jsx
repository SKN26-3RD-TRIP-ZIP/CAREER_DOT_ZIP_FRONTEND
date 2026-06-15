/**
 * 의존성 없는 SVG 꺾은선 차트.
 * points: [{ label, overall_score }]
 */
export default function GrowthLineChart({ points = [] }) {
  const W = 600;
  const H = 240;
  const padL = 34;
  const padR = 16;
  const padT = 16;
  const padB = 28;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;
  const MIN = 40;
  const MAX = 100;

  const n = points.length;
  const x = (i) => padL + (n <= 1 ? plotW / 2 : (i / (n - 1)) * plotW);
  const y = (v) => padT + (1 - (Math.max(MIN, Math.min(MAX, v)) - MIN) / (MAX - MIN)) * plotH;

  const gridVals = [40, 60, 80, 100];
  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${x(i)} ${y(p.overall_score)}`).join(' ');

  return (
    <div className="w-full">
      <svg viewBox={`0 0 ${W} ${H}`} className="h-72 w-full" preserveAspectRatio="xMidYMid meet">
        {gridVals.map((v) => (
          <g key={v}>
            <line x1={padL} y1={y(v)} x2={W - padR} y2={y(v)} stroke="rgba(0,0,0,0.1)" strokeWidth="1" />
            <text x={padL - 8} y={y(v) + 4} textAnchor="end" fontSize="11" fill="rgba(0,0,0,0.45)">{v}</text>
          </g>
        ))}
        {n > 0 && <path d={linePath} fill="none" stroke="#08CB00" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />}
        {points.map((p, i) => (
          <g key={p.session_id ?? i}>
            <circle cx={x(i)} cy={y(p.overall_score)} r="4" fill="#08CB00" />
            <text x={x(i)} y={H - 8} textAnchor="middle" fontSize="11" fill="rgba(0,0,0,0.45)">{p.label}</text>
          </g>
        ))}
      </svg>
      <div className="pr-2 text-right text-[11px] text-[rgba(0,0,0,0.45)]">Interview Session Date</div>
    </div>
  );
}
