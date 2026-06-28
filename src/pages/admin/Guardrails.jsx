import { useEffect, useState } from 'react'
import { getGuardrailEvents } from '../../api/adminApi'
import { categoryLabel, actionLabel, directionLabel, CATEGORY_LABEL, ACTION_LABEL, DIRECTION_LABEL } from '../../utils/guardrail'

const STAGE_OPTIONS = ['SIGNUP', 'MYPAGE', 'INTERVIEW', 'REPORT']

function errorMessage(err) {
  const s = err?.response?.status
  if (s === 403) return '관리자 권한이 필요합니다.'
  return '가드레일 이벤트를 불러오지 못했습니다.'
}

function Select({ value, onChange, placeholder, options }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-lg border border-[#253900] bg-[#111400] px-3 py-1.5 text-sm text-[#EEEEEE] outline-none focus:border-[#08CB00]"
    >
      <option value="">{placeholder}</option>
      {options.map(([v, label]) => (
        <option key={v} value={v}>{label}</option>
      ))}
    </select>
  )
}

export default function Guardrails() {
  const [rows, setRows] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [size] = useState(20)
  const [category, setCategory] = useState('')
  const [action, setAction] = useState('')
  const [stage, setStage] = useState('')
  const [direction, setDirection] = useState('')
  const [userId, setUserId] = useState('')
  const [applied, setApplied] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    setLoading(true)
    setError('')
    getGuardrailEvents({ page, size, ...applied })
      .then((data) => {
        if (!active) return
        setRows(Array.isArray(data?.results) ? data.results : [])
        setTotal(data?.total ?? 0)
      })
      .catch((err) => { if (active) { setError(errorMessage(err)); setRows([]) } })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [page, size, applied])

  const totalPages = Math.max(1, Math.ceil(total / size))

  const applyFilters = () => {
    setPage(1)
    setApplied({
      category: category || undefined,
      action: action || undefined,
      stage: stage || undefined,
      direction: direction || undefined,
      user_id: userId.trim() || undefined,
    })
  }
  const resetFilters = () => {
    setCategory(''); setAction(''); setStage(''); setDirection(''); setUserId(''); setApplied({}); setPage(1)
  }

  return (
    <div className="flex flex-col gap-4 p-2">
      <h1 className="text-xl font-bold text-[#EEEEEE]">가드레일 이벤트</h1>

      <div className="flex flex-wrap items-center gap-2">
        <Select value={category} onChange={setCategory} placeholder="카테고리" options={Object.entries(CATEGORY_LABEL).map(([v]) => [v, `${v} ${categoryLabel(v)}`])} />
        <Select value={action} onChange={setAction} placeholder="조치" options={Object.entries(ACTION_LABEL).map(([v]) => [v, actionLabel(v)])} />
        <Select value={stage} onChange={setStage} placeholder="단계" options={STAGE_OPTIONS.map((v) => [v, v])} />
        <Select value={direction} onChange={setDirection} placeholder="방향" options={Object.entries(DIRECTION_LABEL).map(([v]) => [v, directionLabel(v)])} />
        <input
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          placeholder="user_id"
          className="w-28 rounded-lg border border-[#253900] bg-[#111400] px-3 py-1.5 text-sm text-[#EEEEEE] placeholder:text-[#444444] outline-none focus:border-[#08CB00]"
        />
        <button onClick={applyFilters} className="rounded-md bg-[#08CB00] px-4 py-1.5 text-sm font-medium text-[#000000] hover:bg-[#05A000]">필터 적용</button>
        <button onClick={resetFilters} className="text-sm text-[#666666] hover:text-[#08CB00]">초기화</button>
      </div>

      {loading ? (
        <p className="py-12 text-center text-sm text-[#AAAAAA]">불러오는 중...</p>
      ) : error ? (
        <p className="py-12 text-center text-sm text-[#FF5555]">{error}</p>
      ) : rows.length === 0 ? (
        <p className="py-12 text-center text-sm text-[#AAAAAA]">가드레일 이벤트가 없습니다.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[#253900] bg-[#1A2200]">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#111400] text-xs text-[#666666]">
              <tr>
                <th className="px-3 py-2">ID</th>
                <th className="px-3 py-2">사용자</th>
                <th className="px-3 py-2">세션</th>
                <th className="px-3 py-2">카테고리</th>
                <th className="px-3 py-2">조치</th>
                <th className="px-3 py-2">단계</th>
                <th className="px-3 py-2">방향</th>
                <th className="px-3 py-2">rule_source</th>
                <th className="px-3 py-2">reason_code</th>
                <th className="px-3 py-2">발생 시각</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((ev) => (
                <tr key={ev.guardrail_event_id} className="border-t border-[#253900] text-[#CCCCCC]">
                  <td className="px-3 py-2">{ev.guardrail_event_id}</td>
                  <td className="px-3 py-2">{ev.user_email ?? ev.user_id ?? '-'}</td>
                  <td className="px-3 py-2 text-xs text-[#666666]">{ev.session_id ? String(ev.session_id).slice(0, 8) : '-'}</td>
                  <td className="px-3 py-2 font-medium text-[#EEEEEE]">{ev.category} · {categoryLabel(ev.category)}</td>
                  <td className="px-3 py-2">{actionLabel(ev.action)}</td>
                  <td className="px-3 py-2">{ev.stage}</td>
                  <td className="px-3 py-2">{directionLabel(ev.direction)}</td>
                  <td className="px-3 py-2">{ev.rule_source}</td>
                  <td className="px-3 py-2 text-xs">{ev.reason_code}</td>
                  <td className="px-3 py-2 text-xs text-[#666666]">{ev.created_at ? new Date(ev.created_at).toLocaleString('ko-KR') : ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && !error && total > 0 && (
        <div className="flex items-center justify-center gap-3 text-sm">
          <button disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className="rounded border border-[#253900] px-3 py-1 text-[#AAAAAA] disabled:opacity-40 hover:bg-[#253900]">이전</button>
          <span className="text-[#AAAAAA]">{page} / {totalPages}</span>
          <button disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))} className="rounded border border-[#253900] px-3 py-1 text-[#AAAAAA] disabled:opacity-40 hover:bg-[#253900]">다음</button>
        </div>
      )}
    </div>
  )
}
