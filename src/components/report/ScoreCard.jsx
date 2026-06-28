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
        className="flex min-h-[150px] w-full flex-col justify-between rounded-2xl bg-[#253900] p-5 text-left text-[#EEEEEE] shadow-[0_8px_28px_rgba(0,0,0,0.12)]"
      >
        <div className="text-[11px] font-bold tracking-wide text-[rgba(238,238,238,0.7)]">{label}</div>
        <div className="mt-2 text-4xl font-extrabold leading-none">{value}</div>
        {caption && <div className="mt-3 text-xs leading-snug text-[rgba(238,238,238,0.7)]">{caption}</div>}
      </Comp>
    );
  }
  return (
    <Comp
      onClick={onClick}
      className="flex min-h-[150px] w-full flex-col justify-between rounded-2xl border border-[rgba(0,0,0,0.08)] bg-[#EEEEEE] p-5 text-left shadow-[0_8px_28px_rgba(0,0,0,0.08)]"
    >
      <div className="text-sm font-semibold text-[rgba(0,0,0,0.7)]">{label}</div>
      <div className="mt-2 text-3xl font-extrabold text-[#000000]">{value}</div>
      {caption && <div className="mt-2 text-xs text-[rgba(0,0,0,0.45)]">{caption}</div>}
      {typeof progress === 'number' && <ProgressBar value={progress} className="mt-3" />}
    </Comp>
  );
}
