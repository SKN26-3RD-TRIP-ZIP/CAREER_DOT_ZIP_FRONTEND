const TONES = {
  green: 'bg-[#08CB00] text-white',
  soft: 'bg-[#08CB00]/10 text-[#253900]',
  gray: 'bg-slate-100 text-slate-600',
  dark: 'bg-[#253900] text-white',
};

export default function Badge({ children, tone = 'soft', className = '' }) {
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ${TONES[tone]} ${className}`}>
      {children}
    </span>
  );
}
