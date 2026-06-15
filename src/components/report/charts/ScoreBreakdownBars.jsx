import ProgressBar from '../ProgressBar';

/** rows: [{ label, score }] */
export default function ScoreBreakdownBars({ rows = [] }) {
  return (
    <div className="space-y-4">
      {rows.map((r) => (
        <div key={r.label}>
          <div className="mb-1.5 flex items-center justify-between text-sm">
            <span className="font-medium text-[rgba(0,0,0,0.7)]">{r.label}</span>
            <span className="font-bold text-[#000000]">{r.score}%</span>
          </div>
          <ProgressBar value={r.score} />
        </div>
      ))}
    </div>
  );
}
