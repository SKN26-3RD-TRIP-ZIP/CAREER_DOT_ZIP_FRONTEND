import { Link } from 'react-router-dom';
import { Folder } from 'lucide-react';

const cx = (...parts) => parts.filter(Boolean).join(' ');

export function BrandLogo({ light = false }) {
  return (
    <Link to="/" className={cx('inline-flex items-center gap-3 font-black tracking-tight', light ? 'text-white' : 'text-black')}>
      <span className="relative flex h-8 w-8 items-center justify-center rounded-md bg-[#08CB00] shadow-[inset_0_0_0_2px_rgba(255,255,255,.35)]">
        <span className="absolute -top-1 left-1 h-2 w-5 rounded-t-md bg-[#12e20a]" />
        <Folder size={19} className="text-white" />
      </span>
      <span className="text-[25px] leading-none">Career.zip</span>
    </Link>
  );
}