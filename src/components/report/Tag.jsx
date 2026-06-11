export default function Tag({ label, variant = 'neutral' }) {
  const cls =
    variant === 'strength'
      ? 'bg-[#08CB00] text-white'
      : variant === 'weakness'
        ? 'bg-[#E5342B] text-white'
        : 'bg-slate-100 text-slate-600';
  return (
    <span className={`inline-flex items-center rounded-lg px-3 py-1.5 text-xs font-semibold ${cls}`}>
      {label}
    </span>
  );
}
