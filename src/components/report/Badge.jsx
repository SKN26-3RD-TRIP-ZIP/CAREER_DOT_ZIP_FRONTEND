const TONES = {
  green: 'bg-[#08CB00] text-[#EEEEEE]',
  soft: 'bg-[#08CB00]/10 text-[#253900]',
  gray: 'bg-[rgba(0,0,0,0.06)] text-[rgba(0,0,0,0.6)]',
  dark: 'bg-[#253900] text-[#EEEEEE]',
};

export default function Badge({ children, tone = 'soft', className = '' }) {
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ${TONES[tone]} ${className}`}>
      {children}
    </span>
  );
}
