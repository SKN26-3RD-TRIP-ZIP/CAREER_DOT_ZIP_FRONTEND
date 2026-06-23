import ProgressBar from '../ProgressBar';
import Tooltip from '../Tooltip';

/** rows: [{ label, score, description? }] */
export default function ScoreBreakdownBars({ rows = [] }) {
  const validRows = rows.filter((row) => row?.score != null && Number.isFinite(Number(row.score)));
  if (!validRows.length) {
    return <p className="text-sm text-[rgba(0,0,0,0.55)]">평가 결과가 없습니다.</p>;
  }

  return (
    <div className="space-y-4">
      {validRows.map((r) => (
        <div key={r.label}>
          <div className="mb-1.5 flex items-center justify-between text-sm">
            <Tooltip text={r.description}>
              <span className="font-medium text-[rgba(0,0,0,0.7)]">{r.label}</span>
            </Tooltip>
            <span className="font-bold text-[#000000]">{r.score}점</span>
          </div>
          <ProgressBar value={r.score} />
        </div>
      ))}
    </div>
  );
}
