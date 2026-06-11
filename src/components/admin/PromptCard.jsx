export default function PromptCard({ template, isActive, onActivate, onManage }) {
  const createdDate = new Date(template.created_at).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })

  return (
    <div className="flex flex-col rounded-xl border border-slate-200 bg-white transition-shadow hover:shadow-md">
      <div className="p-5 pb-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="flex-1 text-sm font-semibold leading-snug text-slate-900">
            {template.title}
          </h3>
          <div className="flex shrink-0 items-center gap-1.5">
            {isActive && (
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                활성
              </span>
            )}
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
              {template.prompt_type ?? 'general'}
            </span>
          </div>
        </div>
        <p className="mt-1 text-xs text-slate-400">{createdDate} 생성</p>
      </div>

      <div className="mt-auto flex gap-2 px-5 pb-4">
        {onManage && (
          <button
            onClick={onManage}
            className="flex-1 rounded-md border border-slate-200 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
          >
            버전 관리
          </button>
        )}
        {!isActive && onActivate && (
          <button
            onClick={onActivate}
            className="flex-1 rounded-md border border-slate-200 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
          >
            활성화
          </button>
        )}
      </div>
    </div>
  )
}
