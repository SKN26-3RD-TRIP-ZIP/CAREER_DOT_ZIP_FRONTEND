import { useEffect, useState } from 'react'
import { getAuditLogs } from '../../api/adminApi'

function errorMessage(err) {
  const s = err?.response?.status
  if (s === 403) return '관리자 권한이 필요합니다.'
  // 401 은 axios 전역 인터셉터에서 /auth/login 으로 처리
  return '감사 로그를 불러오지 못했습니다.'
}

function JsonCell({ value }) {
  const [open, setOpen] = useState(false)
  if (value === null || value === undefined) return <span className="text-[#666666]">-</span>
  const text = typeof value === 'string' ? value : JSON.stringify(value, null, 2)
  return (
    <button onClick={() => setOpen((v) => !v)} className="text-left text-xs text-[#08CB00]">
      {open ? <pre className="whitespace-pre-wrap">{text}</pre> : <span className="underline">{open ? '접기' : '보기'}</span>}
    </button>
  )
}

export default function AuditLogs() {
  const [logs, setLogs] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [size] = useState(20)
  const [actionType, setActionType] = useState('')
  const [appliedType, setAppliedType] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    setLoading(true)
    setError('')
    getAuditLogs({ page, size, action_type: appliedType || undefined })
      .then((data) => {
        if (!active) return
        setLogs(Array.isArray(data?.results) ? data.results : [])
        setTotal(data?.total ?? 0)
      })
      .catch((err) => {
        if (active) { setError(errorMessage(err)); setLogs([]) }
      })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [page, size, appliedType])

  const totalPages = Math.max(1, Math.ceil(total / size))

  return (
    <div className="flex flex-col gap-4 p-2">
      <h1 className="text-xl font-bold text-[#EEEEEE]">감사 로그</h1>

      <div className="flex items-center gap-2">
        <input
          value={actionType}
          onChange={(e) => setActionType(e.target.value)}
          placeholder="action_type 필터 (예: member_status_change)"
          className="w-72 rounded-lg border border-[#253900] bg-[#111400] px-3 py-1.5 text-sm text-[#EEEEEE] placeholder:text-[#444444] outline-none focus:border-[#08CB00]"
        />
        <button
          onClick={() => { setPage(1); setAppliedType(actionType.trim()) }}
          className="rounded-md bg-[#08CB00] px-4 py-1.5 text-sm font-medium text-[#000000] hover:bg-[#05A000]"
        >
          필터 적용
        </button>
        {appliedType && (
          <button
            onClick={() => { setActionType(''); setAppliedType(''); setPage(1) }}
            className="text-sm text-[#666666] hover:text-[#08CB00]"
          >
            초기화
          </button>
        )}
      </div>

      {loading ? (
        <p className="py-12 text-center text-sm text-[#AAAAAA]">불러오는 중...</p>
      ) : error ? (
        <p className="py-12 text-center text-sm text-[#FF5555]">{error}</p>
      ) : logs.length === 0 ? (
        <p className="py-12 text-center text-sm text-[#AAAAAA]">감사 로그가 없습니다.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[#253900] bg-[#1A2200]">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#111400] text-xs text-[#666666]">
              <tr>
                <th className="px-3 py-2">ID</th>
                <th className="px-3 py-2">actor_id</th>
                <th className="px-3 py-2">action_type</th>
                <th className="px-3 py-2">target_type</th>
                <th className="px-3 py-2">target_id</th>
                <th className="px-3 py-2">before</th>
                <th className="px-3 py-2">after</th>
                <th className="px-3 py-2">created_at</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.audit_log_id} className="border-t border-[#253900] text-[#CCCCCC]">
                  <td className="px-3 py-2">{log.audit_log_id}</td>
                  <td className="px-3 py-2">
                    {log.actor_id != null
                      ? `${log.actor_id}(${log.actor_name ?? '알 수 없음'})`
                      : '-'}
                  </td>
                  <td className="px-3 py-2 font-medium text-[#EEEEEE]">{log.action_type}</td>
                  <td className="px-3 py-2">{log.target_type}</td>
                  <td className="px-3 py-2">
                    {log.target_name != null
                      ? `${log.target_id}(${log.target_name})`
                      : log.target_id}
                  </td>
                  <td className="px-3 py-2"><JsonCell value={log.before_value} /></td>
                  <td className="px-3 py-2"><JsonCell value={log.after_value} /></td>
                  <td className="px-3 py-2 text-xs text-[#666666]">
                    {log.created_at ? new Date(log.created_at).toLocaleString('ko-KR') : ''}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && !error && total > 0 && (
        <div className="flex items-center justify-center gap-3 text-sm">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="rounded border border-[#253900] px-3 py-1 text-[#AAAAAA] disabled:opacity-40 hover:bg-[#253900]"
          >
            이전
          </button>
          <span className="text-[#AAAAAA]">{page} / {totalPages}</span>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="rounded border border-[#253900] px-3 py-1 text-[#AAAAAA] disabled:opacity-40 hover:bg-[#253900]"
          >
            다음
          </button>
        </div>
      )}
    </div>
  )
}
