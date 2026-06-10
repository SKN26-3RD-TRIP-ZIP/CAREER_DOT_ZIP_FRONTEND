import ProgressBar from './ProgressBar';

/**
 * label/value 표시 카드.
 * highlight=true 이면 OVERALL 용 다크 그린 카드.
 */
export default function ScoreCard({ label, value, caption, progress, highlight = false, onClick }) {
  const Comp = onClick ? 'button' : 'div';
  if (highlight) {
    return (
      <Comp
        onClick={onClick}
        className="flex min-h-[150px] w-full flex-col justify-between rounded-xl bg-[#173a1f] p-5 text-left text-white shadow-sm"
      >
        <div className="text-[11px] font-bold tracking-wide text-white/70">{label}</div>
        <div className="mt-2 text-4xl font-extrabold leading-none">{value}</div>
        {caption && <div className="mt-3 text-xs leading-snug text-white/70">{caption}</div>}
      </Comp>
    );
  }
  return (
    <Comp
      onClick={onClick}
      className="flex min-h-[150px] w-full flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 text-left shadow-sm"
    >
      <div className="text-sm font-semibold text-slate-700">{label}</div>
      <div className="mt-2 text-3xl font-extrabold text-slate-900">{value}</div>
      {caption && <div className="mt-2 text-xs text-slate-400">{caption}</div>}
      {typeof progress === 'number' && <ProgressBar value={progress} className="mt-3" />}
    </Comp>
  );
}
