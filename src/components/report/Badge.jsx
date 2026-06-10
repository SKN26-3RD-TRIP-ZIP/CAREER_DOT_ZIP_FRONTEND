const TONES = {
  green: 'bg-green-500 text-white',
  soft: 'bg-green-50 text-green-700',
  gray: 'bg-slate-100 text-slate-600',
  dark: 'bg-[#173a1f] text-white',
};

export default function Badge({ children, tone = 'soft', className = '' }) {
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ${TONES[tone]} ${className}`}>
      {children}
    </span>
  );
}
