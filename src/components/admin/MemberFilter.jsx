import { useEffect, useRef, useState } from 'react'
import { Search } from 'lucide-react'

const STATUS_TABS = [
  { value: 'all',     label: '전체' },
  { value: 'active',  label: '활성' },
  { value: 'dormant', label: '휴면' },
  { value: 'banned',  label: '차단' },
]

export default function MemberFilter({ values, onChange }) {
  const [inputValue, setInputValue] = useState(values.search)
  const isComposing = useRef(false)

  useEffect(() => {
    if (!isComposing.current) {
      setInputValue(values.search)
    }
  }, [values.search])

  const propagate = (val) => onChange({ search: val })

  const handleChange = (e) => {
    const val = e.target.value
    setInputValue(val)
    if (!isComposing.current) propagate(val)
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            className="w-full rounded-md border border-slate-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-slate-400"
            placeholder="이름 또는 이메일 검색"
            value={inputValue}
            onCompositionStart={() => { isComposing.current = true }}
            onCompositionEnd={(e) => {
              isComposing.current = false
              propagate(e.currentTarget.value)
            }}
            onChange={handleChange}
          />
        </div>

        <div className="flex gap-2 sm:items-center">
          <input
            type="date"
            className="w-40 rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
            value={values.dateFrom}
            max={values.dateTo || undefined}
            onChange={(e) => onChange({ dateFrom: e.target.value })}
          />
          <span className="text-slate-400">~</span>
          <input
            type="date"
            className="w-40 rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
            value={values.dateTo}
            min={values.dateFrom || undefined}
            onChange={(e) => onChange({ dateTo: e.target.value })}
          />
        </div>
      </div>

      <div className="flex gap-1">
        {STATUS_TABS.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => onChange({ status: value })}
            className={[
              'rounded-lg px-4 py-1.5 text-sm font-medium transition-colors',
              values.status === value
                ? 'bg-slate-900 text-white'
                : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700',
            ].join(' ')}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  )
}
