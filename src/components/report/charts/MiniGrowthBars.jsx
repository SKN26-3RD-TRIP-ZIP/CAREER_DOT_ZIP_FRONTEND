import { scoreBarClass } from '../../../utils/score';

/** 최종 리포트 하단의 미니 막대 성장 추이 (최근 5개) */
export default function MiniGrowthBars({ points = [] }) {
  const recent = points.slice(-5);
  return (
    <div className="flex items-end gap-3">
      {recent.map((p, i) => (
        <div key={p.session_id ?? i} className="flex flex-col items-center gap-1">
          <div className="flex h-12 w-7 items-end overflow-hidden rounded-md bg-slate-100">
            <div className={`w-full rounded-md ${scoreBarClass(p.overall_score)}`} style={{ height: `${p.overall_score}%` }} />
          </div>
          <span className="text-[10px] text-slate-400">{p.label}</span>
        </div>
      ))}
    </div>
  );
}
