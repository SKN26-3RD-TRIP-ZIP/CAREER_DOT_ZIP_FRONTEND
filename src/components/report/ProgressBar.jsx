import { scoreBarClass } from '../../utils/score';

export default function ProgressBar({ value, className = '' }) {
  const clamped = Math.max(0, Math.min(100, value ?? 0));
  return (
    <div className={`h-2 w-full overflow-hidden rounded-full bg-[rgba(0,0,0,0.08)] ${className}`}>
      <div
        className={`h-full rounded-full transition-[width] duration-500 ${scoreBarClass(value ?? 0)}`}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
