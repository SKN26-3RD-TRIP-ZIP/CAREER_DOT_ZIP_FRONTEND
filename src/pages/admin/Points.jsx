import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getPointHistory,
  getPointStats,
  getPointPolicies,
  updatePointPolicy,
  getMembers,
  getMemberDetail,
  adjustMemberPoints,
} from '../../api/adminApi'

/* ── 거래 유형 배지 ──────────────────────────────────────────────────────── */
const TX_CFG = {
  EARN:   { label: '적립', cls: 'bg-[#0F172A] text-[#3DDD37]' },
  USE:    { label: '차감', cls: 'bg-[#2A0000] text-[#FF5555]' },
  REFUND: { label: '환불', cls: 'bg-[#0F172A] text-[#3DDD37]' },
  EXPIRE: { label: '소멸', cls: 'bg-[#1E293B] text-[#AAAAAA]' },
  ADMIN:  { label: '지급', cls: 'bg-[#10204A] text-[#7AA2FF]' },
}

function TxBadge({ type, amount }) {
  let cfg = TX_CFG[type] ?? { label: type, cls: 'bg-[#1E293B] text-[#AAAAAA]' }
  if (type === 'ADMIN') {
    cfg = amount < 0 ? { label: '회수', cls: 'bg-[#2E2000] text-[#F5A623]' } : { label: '지급', cls: 'bg-[#10204A] text-[#7AA2FF]' }
  }
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${cfg.cls}`}>
      {cfg.label}
    </span>
  )
}

/* ── reason_code → 한글 라벨 (시드 정책 기준) ───────────────────────────── */
const REASON_LABELS = {
  'AUTH.EMAIL_VERIFIED': '이메일 인증',
  'PROFILE.COMPLETED': '프로필 완성',
  'PROFILE.DESIRED_JOB_SET': '희망 직무 설정',
  'JD.FIRST_CREATED': 'JD 최초 등록',
  'RESUME.FIRST_CREATED': '이력서 최초 작성',
  'COVER_LETTER.FIRST_CREATED': '자소서 최초 작성',
  'PROJECT.FIRST_CREATED': '프로젝트 최초 등록',
  'PROJECT.ADDITIONAL': '프로젝트 추가',
  'LOGIN.DAILY': '일일 첫 접속',
  'LOGIN.STREAK_7': '7일 연속 출석',
  'LOGIN.STREAK_30': '30일 연속 출석',
  'INTERVIEW.COMPLETED': '면접 완료',
  'REPORT.FIRST_VIEWED': '리포트 발급',
  'ACTION_PLAN.CREATED': '액션플랜 생성',
  'INTERVIEW.WEAKNESS_SESSION_COMPLETED': '약점 보완 면접 완료',
  'DORMANT.RETURN_LOGIN': '휴면 복귀',
  'INTERVIEW.EXTRA_SESSION': '추가 면접 세션',
  'QUESTION_PACK.CUSTOM': '맞춤 질문팩',
  'PERSONA.ADVANCED': '고급 페르소나',
  'ANSWER.REEVALUATION': '답변 재평가',
  'REPORT.DEEP_ANALYSIS': '심층 분석 리포트',
  'INTERVIEW.HINT': '면접 힌트',
  'REPORT.GROWTH_COMPARE': '성장 비교 리포트',
  'PRACTICE.WEAKNESS_FOCUS': '약점 집중 연습',
  'GITHUB.DEEP_ANALYSIS': 'GitHub 심층 분석',
  'ACTION_PLAN.REGENERATE': '액션플랜 재생성',
  'INTERVIEW.SESSION_STARTED': '면접 세션 시작',
  // 'ADMIN.ADJUSTMENT'는 부호에 따라 지급/회수로 나뉘므로 adminReasonText()에서 처리한다.
}

/* description에 서비스가 붙이는 "actor_id=N; " 접두를 제거한 순수 사유 텍스트 */
function stripActor(desc) {
  return (desc ?? '').replace(/^actor_id=\d+;\s*/, '').trim()
}

/* 내역 행의 사유 표시 텍스트. 관리자 수동 조정은 "관리자 지급/회수: {사유}" 형태로 출력 */
function reasonText(r) {
  if (r.reason_code === 'ADMIN.ADJUSTMENT') {
    const kind = r.amount > 0 ? '관리자 지급' : '관리자 회수'
    const detail = stripActor(r.description)
    return detail ? `${kind}: ${detail}` : kind
  }
  return REASON_LABELS[r.reason_code] ?? r.reason_code
}

/* ── 상단 스탯 카드 ──────────────────────────────────────────────────────── */
function StatCard({ label, value, accent = false, hint }) {
  return (
    <div className="rounded-xl bg-[#1E293B] p-5 shadow-sm">
      <p className="mb-2 text-sm text-[#AAAAAA]">{label}</p>
      <p className={`text-[28px] font-bold leading-none ${accent ? 'text-[#08CB00]' : 'text-[#EEEEEE]'}`}>
        {value == null ? '—' : value.toLocaleString()}
      </p>
      {hint && <p className="mt-2 text-xs text-[#666666]">{hint}</p>}
    </div>
  )
}

function errorMessage(err) {
  const s = err?.response?.status
  if (s === 403) return '관리자 권한이 필요합니다.'
  // 401 은 axios 전역 인터셉터에서 /auth/login 으로 처리
  return '포인트 내역을 불러오지 못했습니다.'
}

function fmtAmount(n) {
  if (n == null) return '-'
  return n > 0 ? `+${n.toLocaleString()}` : n.toLocaleString()
}

/* ── 자동 적립 정책: 단일 정책 행 ──────────────────────────────────────── */
function PolicyRow({ policy, editing, saving, onSave }) {
  const [amount, setAmount] = useState(policy.amount)
  const [active, setActive] = useState(policy.is_active)
  const label = REASON_LABELS[policy.reason_code] ?? policy.reason_code
  const isEarn = policy.transaction_type === 'EARN'

  if (!editing) {
    return (
      <div className={`flex items-center justify-between rounded-lg px-3 py-2.5 ${policy.is_active ? '' : 'opacity-50'}`}>
        <div className="min-w-0">
          <p className="truncate text-sm text-[#EEEEEE]">{label}</p>
          <p className="truncate text-xs text-[#666666]">{policy.reason_code}</p>
        </div>
        <span className={`shrink-0 text-sm font-semibold ${isEarn ? 'text-[#3DDD37]' : 'text-[#FF5555]'}`}>
          {policy.amount > 0 ? `+${policy.amount}` : policy.amount}P
        </span>
      </div>
    )
  }

  return (
    <div className="rounded-lg bg-[#0F172A] px-3 py-2.5">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="truncate text-sm text-[#EEEEEE]" title={policy.reason_code}>{label}</p>
        <label className="flex shrink-0 items-center gap-1 text-xs text-[#AAAAAA]">
          <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
          활성
        </label>
      </div>
      <div className="flex items-center gap-2">
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-24 rounded border border-[#334155] bg-[#1E293B] px-2 py-1 text-sm text-[#EEEEEE] outline-none focus:border-[#08CB00]"
        />
        <span className="text-xs text-[#666666]">P ({isEarn ? '적립' : '차감'})</span>
        <button
          onClick={() => onSave(policy.policy_id, { amount: Number(amount), is_active: active })}
          disabled={saving}
          className="ml-auto rounded bg-[#08CB00] px-3 py-1 text-xs font-semibold text-[#000000] hover:bg-[#05A000] disabled:opacity-50"
        >
          {saving ? '저장 중' : '저장'}
        </button>
      </div>
    </div>
  )
}

/* ── 자동 적립 정책 패널 ────────────────────────────────────────────────── */
function PolicyPanel() {
  const queryClient = useQueryClient()
  const [editing, setEditing] = useState(false)
  const [savingId, setSavingId] = useState(null)
  const [err, setErr] = useState('')

  const { data: policies = [], isLoading, isError } = useQuery({
    queryKey: ['point-policies'],
    queryFn: getPointPolicies,
  })

  const handleSave = async (policyId, body) => {
    setSavingId(policyId)
    setErr('')
    try {
      await updatePointPolicy(policyId, body)
      await queryClient.invalidateQueries({ queryKey: ['point-policies'] })
    } catch (e) {
      setErr(e?.response?.data?.detail ?? '정책 저장에 실패했습니다.')
    } finally {
      setSavingId(null)
    }
  }

  return (
    <div className="flex flex-col rounded-xl bg-[#1E293B] shadow-sm">
      <div className="flex items-center justify-between border-b border-[#334155] px-5 py-4">
        <h2 className="text-sm font-semibold text-[#EEEEEE]">자동 적립 정책</h2>
        <button
          onClick={() => { setEditing((v) => !v); setErr('') }}
          className="text-sm font-medium text-[#08CB00] hover:text-[#3DDD37]"
        >
          {editing ? '완료' : '편집'}
        </button>
      </div>

      {err && <p className="px-5 pt-3 text-xs text-[#FF5555]">{err}</p>}

      <div className="max-h-[520px] flex-1 space-y-1 overflow-y-auto px-2 py-2">
        {isLoading ? (
          <p className="py-10 text-center text-sm text-[#666666]">불러오는 중...</p>
        ) : isError ? (
          <p className="py-10 text-center text-sm text-[#FF5555]">정책을 불러오지 못했습니다.</p>
        ) : policies.length === 0 ? (
          <p className="py-10 text-center text-sm text-[#666666]">정책이 없습니다.</p>
        ) : (
          policies.map((p) => (
            <PolicyRow
              key={`${p.policy_id}-${editing}`}
              policy={p}
              editing={editing}
              saving={savingId === p.policy_id}
              onSave={handleSave}
            />
          ))
        )}
      </div>

      <p className="border-t border-[#334155] px-5 py-3 text-xs text-[#666666]">
        정책 변경 시 이후 적립분부터 적용됩니다. (소급 없음)
      </p>
    </div>
  )
}

/* ── 유형 필터 탭 (백엔드 transaction_type 과 1:1) ───────────────────────── */
const TYPE_TABS = [
  { key: 'all',   label: '전체', value: '' },
  { key: 'earn',  label: '적립', value: 'EARN' },
  { key: 'use',   label: '차감', value: 'USE' },
  { key: 'admin', label: '지급/회수', value: 'ADMIN' },
  { key: 'refund', label: '환불', value: 'REFUND' },
  { key: 'expire', label: '소멸', value: 'EXPIRE' },
]

const PAGE_SIZE = 20

/* ── 백엔드 에러 detail 한글화 ──────────────────────────────────────────── */
const ADJUST_ERROR_KO = {
  'Point balance is insufficient.': '잔액이 부족합니다.',
  'Admin adjustment reason is required.': '사유를 입력하세요.',
  'Admin adjustment amount cannot be zero.': '금액은 0이 될 수 없습니다.',
}

/* ── 수동 지급/회수 모달 (REQ-ADM-013) ─────────────────────────────────── */
function PointAdjustModal({ onClose, onSuccess }) {
  const [query, setQuery] = useState('')
  const [appliedQuery, setAppliedQuery] = useState('')
  const [selected, setSelected] = useState(null)
  const [direction, setDirection] = useState('grant') // grant | deduct
  const [amount, setAmount] = useState('')
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)

  const { data: searchData, isFetching } = useQuery({
    queryKey: ['member-search', appliedQuery],
    queryFn: () => getMembers({ search: appliedQuery, size: 6 }),
    enabled: !!appliedQuery && !selected,
  })
  const candidates = searchData?.users ?? []

  const { data: detail } = useQuery({
    queryKey: ['member-detail-balance', selected?.id],
    queryFn: () => getMemberDetail(selected.id),
    enabled: !!selected,
  })
  const currentBalance = detail?.point_balance

  const numericAmount = Math.abs(Number(amount)) || 0
  const signed = direction === 'grant' ? numericAmount : -numericAmount
  const predicted = typeof currentBalance === 'number' ? currentBalance + signed : null
  const canSubmit = !!selected && numericAmount > 0 && !!reason.trim() && !submitting

  const handleSubmit = async () => {
    if (!canSubmit) return
    setSubmitting(true)
    setError('')
    try {
      const res = await adjustMemberPoints(selected.id, {
        amount: signed,
        reason: reason.trim(),
        idempotency_key: crypto?.randomUUID?.() ?? `adj-${Date.now()}`,
      })
      setResult(res)
      onSuccess?.()
    } catch (e) {
      const detailMsg = e?.response?.data?.detail
      setError(ADJUST_ERROR_KO[detailMsg] ?? detailMsg ?? '처리에 실패했습니다.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md rounded-2xl bg-[#1E293B] p-7 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute right-5 top-5 flex h-8 w-8 items-center justify-center rounded-full text-[#666666] hover:bg-[#334155]"
        >
          ✕
        </button>

        <h3 className="mb-5 text-base font-semibold text-[#EEEEEE]">수동 지급 / 회수</h3>

        {result ? (
          <div className="rounded-lg bg-[#0F172A] p-5 text-center">
            <p className="text-sm font-semibold text-[#3DDD37]">
              {result.amount > 0 ? '지급' : '회수'} 완료 ({fmtAmount(result.amount)}P)
            </p>
            <p className="mt-1 text-xs text-[#AAAAAA]">변경 후 잔액 {result.balance_after?.toLocaleString()}P</p>
            <button
              onClick={onClose}
              className="mt-4 w-full rounded-lg bg-[#08CB00] py-2.5 text-sm font-semibold text-[#000000] hover:bg-[#05A000]"
            >
              닫기
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {/* 회원 선택 */}
            <div>
              <label className="mb-1 block text-xs text-[#AAAAAA]">회원</label>
              {selected ? (
                <div className="flex items-center justify-between rounded-lg border border-[#334155] bg-[#0F172A] px-3 py-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm text-[#EEEEEE]">{selected.name}</p>
                    <p className="truncate text-xs text-[#666666]">{selected.email}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <span className="text-xs text-[#AAAAAA]">
                      잔액 {typeof currentBalance === 'number' ? currentBalance.toLocaleString() : '…'}P
                    </span>
                    <button
                      onClick={() => { setSelected(null); setResult(null) }}
                      className="text-xs text-[#08CB00] hover:text-[#3DDD37]"
                    >
                      변경
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex gap-2">
                    <input
                      className="flex-1 rounded-lg border border-[#334155] bg-[#0F172A] px-3 py-2 text-sm text-[#EEEEEE] outline-none placeholder:text-[#444444] focus:border-[#08CB00]"
                      placeholder="이름, 이메일로 회원 검색"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') setAppliedQuery(query.trim()) }}
                    />
                    <button
                      onClick={() => setAppliedQuery(query.trim())}
                      className="rounded-lg bg-[#334155] px-3 py-2 text-sm font-medium text-[#EEEEEE] hover:bg-[#475569]"
                    >
                      검색
                    </button>
                  </div>
                  {appliedQuery && (
                    <div className="mt-2 max-h-40 overflow-y-auto rounded-lg border border-[#334155]">
                      {isFetching ? (
                        <p className="px-3 py-3 text-center text-xs text-[#666666]">검색 중...</p>
                      ) : candidates.length === 0 ? (
                        <p className="px-3 py-3 text-center text-xs text-[#666666]">검색 결과가 없습니다.</p>
                      ) : (
                        candidates.map((u) => (
                          <button
                            key={u.id}
                            onClick={() => { setSelected({ id: u.id, name: u.name, email: u.email }); setQuery(''); setAppliedQuery('') }}
                            className="flex w-full flex-col items-start px-3 py-2 text-left hover:bg-[#334155]"
                          >
                            <span className="block w-full truncate text-sm text-[#EEEEEE]">{u.name}</span>
                            <span className="block w-full truncate text-xs text-[#666666]">{u.email}</span>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* 지급/회수 + 금액 */}
            <div>
              <label className="mb-1 block text-xs text-[#AAAAAA]">유형 · 금액</label>
              <div className="flex gap-2">
                <div className="flex overflow-hidden rounded-lg border border-[#334155]">
                  {[
                    { key: 'grant', label: '지급' },
                    { key: 'deduct', label: '회수' },
                  ].map(({ key, label }) => (
                    <button
                      key={key}
                      onClick={() => setDirection(key)}
                      className={[
                        'px-4 py-2 text-sm font-medium',
                        direction === key
                          ? (key === 'grant' ? 'bg-[#08CB00] text-[#000000]' : 'bg-[#FF5555] text-[#000000]')
                          : 'text-[#AAAAAA] hover:bg-[#334155]',
                      ].join(' ')}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  min="1"
                  className="flex-1 rounded-lg border border-[#334155] bg-[#0F172A] px-3 py-2 text-sm text-[#EEEEEE] outline-none placeholder:text-[#444444] focus:border-[#08CB00]"
                  placeholder="금액(P)"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>
              {predicted != null && numericAmount > 0 && (
                <p className="mt-1 text-xs text-[#666666]">
                  변경 후 예상 잔액 {predicted.toLocaleString()}P
                  {predicted < 0 && <span className="text-[#FF5555]"> (잔액 부족)</span>}
                </p>
              )}
            </div>

            {/* 사유 */}
            <div>
              <label className="mb-1 block text-xs text-[#AAAAAA]">
                사유 <span className="text-[#FF5555]">*</span>
              </label>
              <input
                className="w-full rounded-lg border border-[#334155] bg-[#0F172A] px-3 py-2 text-sm text-[#EEEEEE] outline-none placeholder:text-[#444444] focus:border-[#08CB00]"
                placeholder="예: CS 보상, 이벤트 지급"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                maxLength={500}
              />
            </div>

            {error && <p className="text-sm text-[#FF5555]">{error}</p>}

            <button
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="w-full rounded-lg bg-[#08CB00] py-2.5 text-sm font-semibold text-[#000000] hover:bg-[#05A000] disabled:opacity-50"
            >
              {submitting ? '처리 중...' : direction === 'grant' ? '지급하기' : '회수하기'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

/* ── 메인 페이지 ─────────────────────────────────────────────────────────── */
export default function Points() {
  const [search, setSearch] = useState('')              // 입력 중인 검색어(이름/이메일)
  const [appliedSearch, setAppliedSearch] = useState('')
  const [typeTab, setTypeTab] = useState('all')
  const [page, setPage] = useState(1)
  const [showAdjust, setShowAdjust] = useState(false)
  const queryClient = useQueryClient()

  const txType = TYPE_TABS.find((t) => t.key === typeTab)?.value || ''

  // 통계 카드 — 대시보드 집계(전체기간) 재사용. 금일 적립/보유 합계는 전용 엔드포인트(REQ-ADM-015) 전까지 미제공.
  const { data: stats } = useQuery({
    queryKey: ['point-stats'],
    queryFn: getPointStats,
  })

  const historyParams = {
    search: appliedSearch || undefined,
    transaction_type: txType || undefined,
    page,
    size: PAGE_SIZE,
  }

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['point-history', historyParams],
    queryFn: () => getPointHistory(historyParams),
  })

  const rows = data?.results ?? []
  const total = data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  const earned = stats?.earned ?? 0
  const used = stats?.used ?? 0           // USE 합계는 음수
  const refunded = stats?.refunded ?? 0
  const net = earned + used + refunded    // 순발행 ≈ 미사용 잔여

  const applySearch = () => { setPage(1); setAppliedSearch(search.trim()) }
  const resetSearch = () => { setSearch(''); setAppliedSearch(''); setPage(1) }
  const changeTab = (key) => { setTypeTab(key); setPage(1) }

  return (
    <div className="flex flex-col gap-5">
      {/* 페이지 헤더 */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#EEEEEE]">포인트 관리</h1>
          <p className="mt-1 text-sm text-[#AAAAAA]">회원 포인트 적립·차감 내역과 정책을 관리합니다.</p>
        </div>
        <button
          onClick={() => setShowAdjust(true)}
          className="rounded-lg bg-[#08CB00] px-5 py-2.5 text-sm font-semibold text-[#000000] hover:bg-[#05A000]"
        >
          + 수동 지급/회수
        </button>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <StatCard label="총 발행 포인트" value={earned} hint="전체기간 적립 합계" />
        <StatCard label="사용 포인트" value={Math.abs(used)} hint="전체기간 차감 합계" />
        <StatCard label="잔여 포인트" value={net} hint="순발행(발행+환불−사용) 기준" />
      </div>

      {/* 검색 + 유형 필터 */}
      <div className="flex items-center gap-3 rounded-xl bg-[#1E293B] px-4 py-3 shadow-sm">
        <input
          className="w-72 rounded-lg border border-[#334155] bg-[#0F172A] px-3 py-2 text-sm text-[#EEEEEE] outline-none placeholder:text-[#444444] focus:border-[#08CB00]"
          placeholder="이름, 이메일 검색"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') applySearch() }}
        />
        <button
          onClick={applySearch}
          className="rounded-lg bg-[#08CB00] px-4 py-2 text-sm font-semibold text-[#000000] hover:bg-[#05A000]"
        >
          적용
        </button>
        {appliedSearch && (
          <button onClick={resetSearch} className="text-sm text-[#666666] hover:text-[#08CB00]">
            초기화
          </button>
        )}
        <div className="ml-auto flex gap-1">
          {TYPE_TABS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => changeTab(key)}
              className={[
                'rounded-full px-4 py-1.5 text-sm font-medium transition-colors',
                typeTab === key ? 'bg-[#08CB00] text-[#000000]' : 'text-[#AAAAAA] hover:bg-[#334155]',
              ].join(' ')}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* 콘텐츠 2-컬럼: 내역 테이블 + 자동 적립 정책 */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        {/* 내역 테이블 */}
        <div className="rounded-xl bg-[#1E293B] shadow-sm xl:col-span-2">
          <div className="flex items-center justify-between border-b border-[#334155] px-6 py-4">
            <h2 className="text-sm font-semibold text-[#EEEEEE]">포인트 내역</h2>
            <span className="text-xs text-[#666666]">총 {total.toLocaleString()}건</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full table-fixed text-sm">
              <colgroup>
                <col className="w-[28%]" />
                <col className="w-[10%]" />
                <col className="w-[12%]" />
                <col className="w-[22%]" />
                <col className="w-[12%]" />
                <col className="w-[16%]" />
              </colgroup>
              <thead>
                <tr className="border-b border-[#334155]">
                  {['회원', '유형', '금액', '사유', '잔액', '일시'].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-xs font-semibold text-[#666666] first:pl-6 last:pr-6"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#334155]">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="py-16 text-center text-sm text-[#666666]">불러오는 중...</td>
                  </tr>
                ) : isError ? (
                  <tr>
                    <td colSpan={6} className="py-16 text-center text-sm text-[#FF5555]">{errorMessage(error)}</td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-16 text-center text-sm text-[#666666]">포인트 내역이 없습니다.</td>
                  </tr>
                ) : (
                  rows.map((r) => (

                    <tr key={r.point_history_id} className="hover:bg-[#334155]/40">
                      <td className="pl-6 pr-4 py-3.5">
                        <p className="truncate text-sm font-medium text-[#EEEEEE]">{r.user_name ?? `회원 #${r.user_id}`}</p>
                        <p className="truncate text-xs text-[#666666]">{r.user_email ?? `#${r.user_id}`}</p>
                      </td>
                      <td className="px-4 py-3.5"><TxBadge type={r.transaction_type} amount={r.amount} /></td>
                      <td className={`px-4 py-3.5 font-semibold ${r.amount > 0 ? 'text-[#3DDD37]' : 'text-[#FF5555]'}`}>
                        {fmtAmount(r.amount)}
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="truncate text-sm text-[#CCCCCC]">{reasonText(r)}</p>
                        {r.reason_code !== 'ADMIN.ADJUSTMENT' && r.description && (
                          <p className="truncate text-xs text-[#666666]">{r.description}</p>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-sm text-[#AAAAAA]">
                        {r.balance_after?.toLocaleString() ?? '-'}
                      </td>
                      <td className="py-3.5 pl-4 pr-6 text-xs text-[#666666]">
                        {r.created_at ? new Date(r.created_at).toLocaleString('ko-KR') : '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {!isLoading && !isError && total > 0 && (
            <div className="flex items-center justify-center gap-3 border-t border-[#334155] px-6 py-4 text-sm">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="rounded border border-[#334155] px-3 py-1 text-[#AAAAAA] disabled:opacity-40 hover:bg-[#334155]"
              >
                이전
              </button>
              <span className="text-[#AAAAAA]">{page} / {totalPages}</span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="rounded border border-[#334155] px-3 py-1 text-[#AAAAAA] disabled:opacity-40 hover:bg-[#334155]"
              >
                다음
              </button>
            </div>
          )}
        </div>

        {/* 자동 적립 정책 패널 */}
        <PolicyPanel />
      </div>

      {showAdjust && (
        <PointAdjustModal
          onClose={() => setShowAdjust(false)}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['point-history'] })
            queryClient.invalidateQueries({ queryKey: ['point-stats'] })
          }}
        />
      )}
    </div>
  )
}
