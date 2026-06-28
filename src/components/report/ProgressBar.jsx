import { isRealScore, scoreBarClass } from '../../utils/score';

/**
 * 점수 진행바.
 *  - 실제 점수(0 포함) → 해당 폭/색상으로 채운다.
 *  - 점수 없음(null/undefined/NaN) → 빈 트랙만 표시 (null 을 0% 로 표기하지 않음).
 */
export default function ProgressBar({ value, className = '' }) {
  const real = isRealScore(value);
  const clamped = real ? Math.max(0, Math.min(100, value)) : 0;
  return (
    <div className={`h-2 w-full overflow-hidden rounded-full bg-[rgba(0,0,0,0.08)] ${className}`}>
      {real && (
        <div
          className={`h-full rounded-full transition-[width] duration-500 ${scoreBarClass(value)}`}
          style={{ width: `${clamped}%` }}
        />
      )}
    </div>
  );
}
