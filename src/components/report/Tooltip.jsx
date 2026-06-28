import { Info } from 'lucide-react';

/**
 * 인라인 툴팁 컴포넌트.
 * text가 없으면 children만 그대로 렌더링.
 *
 * 사용 예시:
 *   <Tooltip text="STAR 구조 기반 0~100점">답변 구조</Tooltip>
 */
export default function Tooltip({ text, children }) {
  if (!text) return children ?? null;

  return (
    <span className="group relative inline-flex items-center gap-1">
      {children}
      <Info className="h-3.5 w-3.5 shrink-0 cursor-help text-[rgba(0,0,0,0.3)]" />
      {/* 말풍선 */}
      <span
        role="tooltip"
        className="
          pointer-events-none absolute bottom-full left-0 z-50 mb-2
          w-56 rounded-lg bg-[#253900] px-3 py-2
          text-xs leading-relaxed text-[#EEEEEE]
          opacity-0 shadow-lg transition-opacity duration-150
          group-hover:opacity-100
        "
      >
        {text}
        {/* 꼬리 */}
        <span className="absolute top-full left-4 border-4 border-transparent border-t-[#253900]" />
      </span>
    </span>
  );
}
