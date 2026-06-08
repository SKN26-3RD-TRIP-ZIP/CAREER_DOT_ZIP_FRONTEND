import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getMembers, toggleUserStatus } from '../../api/adminApi'

function StatusBadge({ status }) {
  return (
    <span
      className={[
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold',
        status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600',
      ].join(' ')}
    >
      <span
        className={[
          'h-1.5 w-1.5 rounded-full',
          status === 'active' ? 'bg-emerald-500' : 'bg-red-500',
        ].join(' ')}
      />
      {status === 'active' ? '활성' : '정지'}
    </span>
  )
}

export default function MemberTable({ filterParams }) {
  const queryClient = useQueryClient()
  const [targetUser, setTargetUser] = useState(null)
  const [toggling, setToggling] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['members', filterParams],
    queryFn: () => getMembers(filterParams),
  })

  const handleToggle = async () => {
    if (!targetUser) return
    setToggling(true)
    try {
      await toggleUserStatus(targetUser.id, targetUser.status)
      queryClient.invalidateQueries({ queryKey: ['members'] })
      queryClient.invalidateQueries({ queryKey: ['user-stats'] })
    } finally {
      setTargetUser(null)
      setToggling(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center rounded-xl border border-slate-200 bg-white py-20">
        <p className="text-sm text-slate-400">불러오는 중...</p>
      </div>
    )
  }

  const users = data?.users ?? []

  if (users.length === 0) {
    return (
      <div className="flex items-center justify-center rounded-xl border border-slate-200 bg-white py-20">
        <p className="text-sm text-slate-400">검색 결과가 없습니다.</p>
      </div>
    )
  }

  const thClass = 'px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-400'

  return (
    <>
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className={thClass}>이름</th>
              <th className={thClass}>이메일</th>
              <th className={thClass}>상태</th>
              <th className={`${thClass} text-center`}>연습</th>
              <th className={thClass}>최근 로그인</th>
              <th className={thClass}>가입일</th>
              <th className={`${thClass} text-right`}>관리</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user, idx) => (
              <tr
                key={user.id}
                className={[
                  'border-b border-slate-100 transition-colors',
                  idx % 2 === 0 ? 'bg-white hover:bg-blue-50/40' : 'bg-slate-50/50 hover:bg-blue-50/40',
                ].join(' ')}
              >
                <td className="px-6 py-4 font-semibold text-slate-900">{user.name}</td>
                <td className="px-6 py-4 text-slate-500">{user.email}</td>
                <td className="px-6 py-4"><StatusBadge status={user.status} /></td>
                <td className="px-6 py-4 text-center text-slate-600">{user.practice_count}회</td>
                <td className="px-6 py-4 text-slate-400">
                  {user.last_login ? new Date(user.last_login).toLocaleDateString('ko-KR') : '-'}
                </td>
                <td className="px-6 py-4 text-slate-400">
                  {user.created_at ? new Date(user.created_at).toLocaleDateString('ko-KR') : '-'}
                </td>
                <td className="px-6 py-4 text-right">
                  {user.status === 'active' ? (
                    <button
                      onClick={() => setTargetUser(user)}
                      className="h-7 rounded-md border border-red-200 px-2 text-xs text-red-600 hover:bg-red-50 hover:text-red-700"
                    >
                      정지
                    </button>
                  ) : (
                    <button
                      onClick={() => setTargetUser(user)}
                      className="h-7 rounded-md border border-emerald-200 px-2 text-xs text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700"
                    >
                      활성화
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 확인 모달 */}
      {targetUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => !toggling && setTargetUser(null)} />
          <div className="relative z-10 w-full max-w-sm rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
            <h3 className="mb-2 text-base font-semibold text-slate-900">
              회원 {targetUser.status === 'active' ? '정지' : '활성화'}
            </h3>
            <p className="mb-6 text-sm text-slate-500">
              <span className="font-medium text-slate-900">{targetUser.name}</span>
              {' '}({targetUser.email}) 회원을{' '}
              {targetUser.status === 'active' ? '정지' : '활성화'}하시겠습니까?
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setTargetUser(null)}
                disabled={toggling}
                className="rounded-md border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                취소
              </button>
              <button
                onClick={handleToggle}
                disabled={toggling}
                className={[
                  'rounded-md px-4 py-2 text-sm font-medium text-white disabled:opacity-50',
                  targetUser.status === 'active' ? 'bg-red-600 hover:bg-red-700' : 'bg-emerald-600 hover:bg-emerald-700',
                ].join(' ')}
              >
                {toggling ? '처리 중...' : '확인'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
