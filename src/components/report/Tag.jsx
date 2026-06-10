export default function Tag({ label, variant = 'neutral' }) {
  const cls =
    variant === 'strength'
      ? 'bg-green-500 text-white'
      : variant === 'weakness'
        ? 'border border-red-100 bg-red-50 text-red-500'
        : 'bg-slate-100 text-slate-600';
  return (
    <span className={`inline-flex items-center rounded-lg px-3 py-1.5 text-xs font-semibold ${cls}`}>
      {label}
    </span>
  );
}
