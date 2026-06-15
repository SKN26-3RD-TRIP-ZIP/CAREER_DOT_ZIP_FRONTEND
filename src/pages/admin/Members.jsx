import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getMembers, getMemberStats, setUserStatus, deleteMember, inviteMember } from '../../api/adminApi'

/* ── 상태 배지 ─────────────────────────────────────────────────────────── */
const STATUS_CFG = {
  active:  { label: '활성', cls: 'bg-emerald-100 text-emerald-700' },
  dormant: { label: '휴면', cls: 'bg-yellow-100 text-yellow-700' },
  banned:  { label: '차단', cls: 'bg-red-100 text-red-600' },
}

function StatusBadge({ status }) {
  const cfg = STATUS_CFG[status] ?? { label: status, cls: 'bg-slate-100 text-slate-600' }
  return (
    <span className={`rounded-full px-3 py-0.5 text-xs font-semibold ${cfg.cls}`}>
      {cfg.label}
    </span>
  )
}

/* ── 회원 아바타 ─────────────────────────────────────────────────────────── */
function Avatar({ name, size = 'sm' }) {
  const first = name?.[0] ?? '?'
  const sz = size === 'lg' ? 'h-14 w-14 text-xl' : 'h-8 w-8 text-sm'
  return (
    <div className={`flex shrink-0 items-center justify-center rounded-full bg-[#1a3a0a] font-bold text-white ${sz}`}>
      {first}
    </div>
  )
}

/* ── 선택 회원 상세 패널 ────────────────────────────────────────────────── */
function MemberDetailPanel({ user, onStatusChange }) {
  if (!user) {
    return (
      <div className="flex h-full items-center justify-center rounded-xl bg-white p-6 shadow-sm">
        <p className="text-sm text-slate-400">회원을 선택하면 상세 정보를 확인할 수 있습니다.</p>
      </div>
    )
  }

  return (
    <div className="rounded-xl bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-base font-semibold text-slate-900">선택 회원 상세</h3>
        <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
          {user.role === 'admin' ? 'Admin' : 'User'}
        </span>
      </div>

      <div className="mb-6 flex items-center gap-3">
        <Avatar name={user.name} size="lg" />
        <div>
          <p className="text-lg font-bold text-slate-900">{user.name}</p>
          <p className="text-sm text-slate-400">{user.email}</p>
        </div>
      </div>

      <div className="mb-6 space-y-3">
        {[
          { label: '상태', value: <StatusBadge status={user.status} /> },
          {
            label: '최근 접속',
            value: user.last_login
              ? new Date(user.last_login).toLocaleString('ko-KR', { dateStyle: 'short', timeStyle: 'short' })
              : '-',
          },
          { label: '이번 달 면접', value: `${user.monthly_session_count ?? 0}회` },
          { label: '누적 리포트', value: `${user.report_count ?? 0}개` },
        ].map(({ label, value }) => (
          <div key={label} className="flex items-center justify-between">
            <span className="text-sm text-slate-500">{label}</span>
            <span className="text-sm font-semibold text-slate-800">{value}</span>
          </div>
        ))}
      </div>

      <button
        onClick={() => onStatusChange(user)}
        className="w-full rounded-lg bg-[#1a2e05] py-2.5 text-sm font-semibold text-white hover:bg-[#243d07]"
      >
        상태 관리
      </button>
    </div>
  )
}

/* ── 회원 액션 모달 ─────────────────────────────────────────────────────── */
function MemberModal({ user, onClose, onSetStatus, onDelete }) {
  const [loading, setLoading] = useState(false)
  const [confirmAction, setConfirmAction] = useState(null) // 'dormant' | 'banned' | 'active' | 'delete'

  const handleAction = async (action) => {
    setLoading(true)
    try {
      if (action === 'delete') {
        await onDelete(user.id)
      } else {
        await onSetStatus(user.id, action)
      }
      onClose()
    } finally {
      setLoading(false)
    }
  }

  const ACTION_LABELS = {
    dormant: '휴면 전환',
    banned:  '차단',
    active:  '활성화',
    delete:  '탈퇴 처리',
  }

  const ACTION_DESC = {
    dormant: '해당 회원을 휴면 상태로 전환합니다. 로그인이 제한되며 언제든 활성화할 수 있습니다.',
    banned:  '해당 회원을 영구 차단합니다. 차단된 이메일로는 재가입이 불가능합니다. (관리자 초대를 통해서만 재가입 가능)',
    active:  '해당 회원을 다시 활성화합니다.',
    delete:  '계정과 모든 데이터를 삭제합니다. 이 작업은 되돌릴 수 없습니다.',
  }

  const ACTION_COLOR = {
    dormant: 'bg-yellow-500 hover:bg-yellow-600',
    banned:  'bg-red-600 hover:bg-red-700',
    active:  'bg-emerald-600 hover:bg-emerald-700',
    delete:  'bg-red-500 hover:bg-red-600',
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative z-10 w-full max-w-sm rounded-2xl bg-white p-7 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute right-5 top-5 flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100"
        >
          ✕
        </button>

        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-base font-semibold text-slate-900">회원 상태 관리</h3>
          <StatusBadge status={user.status} />
        </div>

        <div className="mb-6 flex items-center gap-3">
          <Avatar name={user.name} size="lg" />
          <div className="min-w-0">
            <p className="text-lg font-bold text-slate-900">{user.name}</p>
            <p className="truncate text-sm text-slate-400">{user.email}</p>
          </div>
        </div>

        {/* 확인 단계 */}
        {confirmAction ? (
          <div className={`rounded-lg border p-4 ${confirmAction === 'active' ? 'border-emerald-200 bg-emerald-50' : 'border-red-200 bg-red-50'}`}>
            <p className={`mb-2 text-sm font-semibold ${confirmAction === 'active' ? 'text-emerald-700' : 'text-red-700'}`}>
              {ACTION_LABELS[confirmAction]}하시겠습니까?
            </p>
            <p className={`mb-4 text-xs ${confirmAction === 'active' ? 'text-emerald-600' : 'text-red-500'}`}>
              {ACTION_DESC[confirmAction]}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmAction(null)}
                disabled={loading}
                className="flex-1 rounded-lg border border-slate-200 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
              >
                취소
              </button>
              <button
                onClick={() => handleAction(confirmAction)}
                disabled={loading}
                className={`flex-1 rounded-lg py-2 text-sm font-semibold text-white disabled:opacity-50 ${ACTION_COLOR[confirmAction]}`}
              >
                {loading ? '처리 중...' : '확인'}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {/* 현재 상태에 따라 가능한 액션 표시 */}
            {user.status !== 'active' && (
              <button
                onClick={() => setConfirmAction('active')}
                className="w-full rounded-lg bg-emerald-600 py-3 text-sm font-semibold text-white hover:bg-emerald-700"
              >
                활성화
              </button>
            )}
            {user.status !== 'dormant' && user.status !== 'banned' && (
              <button
                onClick={() => setConfirmAction('dormant')}
                className="w-full rounded-lg bg-yellow-500 py-3 text-sm font-semibold text-white hover:bg-yellow-600"
              >
                휴면 전환
              </button>
            )}
            {user.status !== 'banned' && (
              <button
                onClick={() => setConfirmAction('banned')}
                className="w-full rounded-lg bg-red-600 py-3 text-sm font-semibold text-white hover:bg-red-700"
              >
                차단 (재가입 불가)
              </button>
            )}
            <button
              onClick={() => setConfirmAction('delete')}
              className="w-full rounded-lg border border-red-200 py-3 text-sm font-semibold text-red-600 hover:bg-red-50"
            >
              탈퇴 처리
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

/* ── 회원 초대 모달 ─────────────────────────────────────────────────────── */
function InviteModal({ onClose, onInvite }) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email.trim()) return
    setLoading(true)
    try {
      const res = await onInvite(email.trim())
      setResult({ success: true, message: res.detail })
    } catch (err) {
      const msg = err?.response?.data?.detail ?? '초대에 실패했습니다.'
      setResult({ success: false, message: msg })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative z-10 w-full max-w-sm rounded-2xl bg-white p-7 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute right-5 top-5 flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100"
        >
          ✕
        </button>

        <h3 className="mb-1 text-base font-semibold text-slate-900">회원 초대</h3>
        <p className="mb-5 text-xs text-slate-500">
          차단된 이메일로 초대하면 해당 계정이 재활성화되어 재가입이 가능해집니다.
        </p>

        {result ? (
          <div className={`rounded-lg p-4 ${result.success ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
            <p className="text-sm font-medium">{result.message}</p>
            <button
              onClick={onClose}
              className="mt-4 w-full rounded-lg bg-[#1a2e05] py-2.5 text-sm font-semibold text-white hover:bg-[#243d07]"
            >
              닫기
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <input
              type="email"
              required
              placeholder="초대할 이메일 주소"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-slate-400"
            />
            <button
              type="submit"
              disabled={loading || !email.trim()}
              className="w-full rounded-lg bg-emerald-500 py-2.5 text-sm font-semibold text-white hover:bg-emerald-600 disabled:opacity-50"
            >
              {loading ? '처리 중...' : '초대 발송'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

/* ── 상단 스탯 카드 ──────────────────────────────────────────────────────── */
function StatCard({ label, value, badge, badgeColor }) {
  return (
    <div className="rounded-xl bg-white p-5 shadow-sm">
      <p className="mb-2 text-sm text-slate-500">{label}</p>
      <p className="mb-3 text-[28px] font-bold leading-none text-slate-900">
        {value?.toLocaleString() ?? '—'}
      </p>
      {badge && (
        <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${badgeColor}`}>
          {badge}
        </span>
      )}
    </div>
  )
}

/* ── 메인 페이지 ─────────────────────────────────────────────────────────── */
const TABS = [
  { key: 'all',     label: '전체', status: 'all' },
  { key: 'active',  label: '활성', status: 'active' },
  { key: 'dormant', label: '휴면', status: 'dormant' },
  { key: 'banned',  label: '차단', status: 'banned' },
]

export default function Members() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [activeTab, setActiveTab] = useState('all')
  const [page, setPage] = useState(1)
  const [selectedUser, setSelectedUser] = useState(null)
  const [modalUser, setModalUser] = useState(null)
  const [showInvite, setShowInvite] = useState(false)

  const handleSearch = (val) => {
    setSearch(val)
    clearTimeout(window._memberSearch)
    window._memberSearch = setTimeout(() => setDebouncedSearch(val), 300)
  }

  const handleTabChange = (tab, statusVal) => {
    setActiveTab(tab)
    setStatusFilter(statusVal)
    setPage(1)
  }

  const { data: stats } = useQuery({
    queryKey: ['member-stats'],
    queryFn: getMemberStats,
  })

  const filterParams = {
    search: debouncedSearch,
    status: statusFilter,
    page,
    size: 10,
  }

  const { data, isLoading } = useQuery({
    queryKey: ['members', filterParams],
    queryFn: () => getMembers(filterParams),
  })

  const users = data?.users ?? []
  const total = data?.total ?? 0
  const totalPages = data?.totalPages ?? 1

  const handleSetStatus = async (userId, newStatus) => {
    await setUserStatus(userId, newStatus)
    queryClient.invalidateQueries({ queryKey: ['members'] })
    queryClient.invalidateQueries({ queryKey: ['member-stats'] })
    if (selectedUser?.id === userId) {
      setSelectedUser((u) => ({ ...u, status: newStatus }))
    }
  }

  const handleDelete = async (userId) => {
    await deleteMember(userId)
    queryClient.invalidateQueries({ queryKey: ['members'] })
    queryClient.invalidateQueries({ queryKey: ['member-stats'] })
    if (selectedUser?.id === userId) setSelectedUser(null)
  }

  const handleInvite = async (email) => {
    const res = await inviteMember(email)
    queryClient.invalidateQueries({ queryKey: ['members'] })
    queryClient.invalidateQueries({ queryKey: ['member-stats'] })
    return res
  }

  return (
    <div className="flex flex-col gap-5">
      {/* 페이지 헤더 */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">회원관리</h1>
          <p className="mt-1 text-sm text-slate-500">
            가입자 상태와 이용 현황을 확인하고 필요한 조치를 처리하세요.
          </p>
        </div>
        <button
          onClick={() => setShowInvite(true)}
          className="rounded-lg bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-600"
        >
          회원 초대
        </button>
      </div>

      {/* 스탯 카드 */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard
          label="전체 회원"
          value={stats?.total}
          badge="+8.4%"
          badgeColor="bg-emerald-100 text-emerald-700"
        />
        <StatCard
          label="활성 회원"
          value={stats?.active}
          badge="+4.1%"
          badgeColor="bg-emerald-100 text-emerald-700"
        />
        <StatCard
          label="휴면 회원"
          value={stats?.dormant}
          badge={stats?.dormant ? `${stats.dormant}명` : undefined}
          badgeColor="bg-yellow-100 text-yellow-700"
        />
        <StatCard
          label="차단 회원"
          value={stats?.banned}
          badge={stats?.banned ? `${stats.banned}명` : undefined}
          badgeColor="bg-red-100 text-red-600"
        />
      </div>

      {/* 검색 + 필터 바 */}
      <div className="flex items-center gap-3 rounded-xl bg-white px-4 py-3 shadow-sm">
        <input
          className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none placeholder:text-slate-400 focus:border-slate-400"
          placeholder="이름, 이메일 검색"
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
        />
        <div className="flex gap-1">
          {TABS.map(({ key, label, status }) => (
            <button
              key={key}
              onClick={() => handleTabChange(key, status)}
              className={[
                'rounded-full px-4 py-1.5 text-sm font-medium transition-colors',
                activeTab === key
                  ? 'bg-[#1a2e05] text-white'
                  : 'text-slate-600 hover:bg-slate-100',
              ].join(' ')}
            >
              {label}
            </button>
          ))}
        </div>
        <button className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700">
          내보내기
        </button>
      </div>

      {/* 콘텐츠 2-컬럼 */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        {/* 멤버 테이블 */}
        <div className="col-span-2 rounded-xl bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
            <h2 className="text-sm font-semibold text-slate-900">회원 목록</h2>
            <span className="text-xs text-slate-400">총 {total.toLocaleString()}명</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full table-fixed text-sm">
              <colgroup>
                <col className="w-[38%]" />
                <col className="w-[10%]" />
                <col className="w-[12%]" />
                <col className="w-[8%]" />
                <col className="w-[16%]" />
                <col className="w-[16%]" />
              </colgroup>
              <thead>
                <tr className="border-b border-slate-100">
                  {['회원', '플랜', '상태', '면접', '가입일', '관리'].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-xs font-semibold text-slate-400 first:pl-6 last:pr-6"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="py-16 text-center text-sm text-slate-400">
                      불러오는 중...
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-16 text-center text-sm text-slate-400">
                      검색 결과가 없습니다.
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr
                      key={user.id}
                      onClick={() => setSelectedUser(user)}
                      className={[
                        'cursor-pointer transition-colors',
                        selectedUser?.id === user.id ? 'bg-emerald-50' : 'hover:bg-slate-50',
                      ].join(' ')}
                    >
                      <td className="pl-6 pr-4 py-3.5">
                        <div className="flex items-center gap-2.5 overflow-hidden">
                          <Avatar name={user.name} />
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-slate-900">{user.name}</p>
                            <p className="truncate text-xs text-slate-400">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-sm text-slate-600">
                        {user.role === 'admin' ? 'Admin' : 'Free'}
                      </td>
                      <td className="px-4 py-3.5">
                        <StatusBadge status={user.status} />
                      </td>
                      <td className="px-4 py-3.5 text-sm text-slate-600">
                        {user.practice_count ?? 0}회
                      </td>
                      <td className="px-4 py-3.5 text-xs text-slate-400">
                        {user.created_at
                          ? new Date(user.created_at).toLocaleDateString('ko-KR')
                          : '-'}
                      </td>
                      <td className="py-3.5 pl-4 pr-6">
                        <button
                          onClick={(e) => { e.stopPropagation(); setModalUser(user) }}
                          className="text-sm font-medium text-emerald-600 hover:text-emerald-700"
                        >
                          상태 관리
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center gap-1 border-t border-slate-100 px-6 py-4">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={[
                    'h-7 w-7 rounded text-xs font-medium',
                    p === page
                      ? 'bg-[#1a2e05] text-white'
                      : 'text-slate-500 hover:bg-slate-100',
                  ].join(' ')}
                >
                  {p}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 선택 회원 상세 */}
        <MemberDetailPanel user={selectedUser} onStatusChange={setModalUser} />
      </div>

      {/* 상태 관리 모달 */}
      {modalUser && (
        <MemberModal
          user={modalUser}
          onClose={() => setModalUser(null)}
          onSetStatus={handleSetStatus}
          onDelete={handleDelete}
        />
      )}

      {/* 초대 모달 */}
      {showInvite && (
        <InviteModal
          onClose={() => setShowInvite(false)}
          onInvite={handleInvite}
        />
      )}
    </div>
  )
}
