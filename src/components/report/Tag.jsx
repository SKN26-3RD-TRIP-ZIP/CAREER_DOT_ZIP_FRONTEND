export default function Tag({ label, variant = 'neutral' }) {
  const cls =
    variant === 'strength'
      ? 'bg-[#08CB00] text-[#EEEEEE]'
      : variant === 'weakness'
        ? 'bg-[#000000] text-[#EEEEEE]'
        : 'bg-[rgba(0,0,0,0.06)] text-[rgba(0,0,0,0.6)]';
  return (
    <span className={`inline-flex items-center rounded-lg px-3 py-1.5 text-xs font-semibold ${cls}`}>
      {label}
    </span>
  );
}
