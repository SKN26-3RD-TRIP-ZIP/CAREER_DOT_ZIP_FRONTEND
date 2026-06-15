import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getMembers, toggleUserStatus } from '../../api/adminApi'

function StatusBadge({ status }) {
  return (
    <span
      className={[
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold',
        status === 'active' ? 'bg-[#08CB00] text-[#000000]' : 'bg-[#253900] text-[#000000]',
      ].join(' ')}
    >
      <span
        className={[
          'h-1.5 w-1.5 rounded-full',
          status === 'active' ? 'bg-[#08CB00]' : 'bg-[rgba(0,0,0,0.06)]0',
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
      <div className="flex items-center justify-center rounded-xl border border-[rgba(0,0,0,0.12)] bg-[#EEEEEE] py-20">
        <p className="text-sm text-[rgba(0,0,0,0.52)]">불러오는 중...</p>
      </div>
    )
  }

  const users = data?.users ?? []

  if (users.length === 0) {
    return (
      <div className="flex items-center justify-center rounded-xl border border-[rgba(0,0,0,0.12)] bg-[#EEEEEE] py-20">
        <p className="text-sm text-[rgba(0,0,0,0.52)]">검색 결과가 없습니다.</p>
      </div>
    )
  }

  const thClass = 'px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-[rgba(0,0,0,0.52)]'

  return (
    <>
      <div className="overflow-hidden rounded-xl border border-[rgba(0,0,0,0.12)] bg-[#EEEEEE] shadow-[0_8px_20px_rgba(0,0,0,0.08)]">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[rgba(0,0,0,0.12)] bg-[#EEEEEE]">
              <th className={thClass}>이름</th>
              <th className={thClass}>이메일</th>
              <th className={thClass}>상태</th>
              <th className={`${thClass} text-center`}>완료 면접 수</th>
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
                  'border-b border-[rgba(0,0,0,0.08)] transition-colors',
                  idx % 2 === 0 ? 'bg-[#EEEEEE] hover:bg-[rgba(8,203,0,0.12)]' : 'bg-[rgba(0,0,0,0.03)] hover:bg-[rgba(8,203,0,0.12)]',
                ].join(' ')}
              >
                <td className="px-6 py-4 font-semibold text-[#000000]">{user.name}</td>
                <td className="px-6 py-4 text-[rgba(0,0,0,0.68)]">{user.email}</td>
                <td className="px-6 py-4"><StatusBadge status={user.status} /></td>
                <td className="px-6 py-4 text-center text-[#253900]">{user.practice_count ?? 0}회</td>
                <td className="px-6 py-4 text-[rgba(0,0,0,0.52)]">
                  {user.last_login ? new Date(user.last_login).toLocaleDateString('ko-KR') : '-'}
                </td>
                <td className="px-6 py-4 text-[rgba(0,0,0,0.52)]">
                  {user.created_at ? new Date(user.created_at).toLocaleDateString('ko-KR') : '-'}
                </td>
                <td className="px-6 py-4 text-right">
                  {user.status === 'active' ? (
                    <button
                      onClick={() => setTargetUser(user)}
                      className="h-7 rounded-md border border-[#253900] px-2 text-xs text-[#000000] hover:bg-[rgba(0,0,0,0.08)] hover:text-[#253900]"
                    >
                      정지
                    </button>
                  ) : (
                    <button
                      onClick={() => setTargetUser(user)}
                      className="h-7 rounded-md border border-[#253900] px-2 text-xs text-[#253900] hover:bg-[rgba(8,203,0,0.12)] hover:text-[#253900]"
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
          <div className="absolute inset-0 bg-[rgba(0,0,0,0.40)]" onClick={() => !toggling && setTargetUser(null)} />
          <div className="relative z-10 w-full max-w-sm rounded-xl border border-[rgba(0,0,0,0.12)] bg-[#EEEEEE] p-6 shadow-[0_22px_56px_rgba(0,0,0,0.18)]">
            <h3 className="mb-2 text-base font-semibold text-[#000000]">
              회원 {targetUser.status === 'active' ? '정지' : '활성화'}
            </h3>
            <p className="mb-6 text-sm text-[rgba(0,0,0,0.68)]">
              <span className="font-medium text-[#000000]">{targetUser.name}</span>
              {' '}({targetUser.email}) 회원을{' '}
              {targetUser.status === 'active' ? '정지' : '활성화'}하시겠습니까?
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setTargetUser(null)}
                disabled={toggling}
                className="rounded-md border border-[rgba(0,0,0,0.12)] px-4 py-2 text-sm font-medium text-[#253900] hover:bg-[rgba(0,0,0,0.05)] disabled:opacity-50"
              >
                취소
              </button>
              <button
                onClick={handleToggle}
                disabled={toggling}
                className={[
                  'rounded-md px-4 py-2 text-sm font-medium text-[#EEEEEE] disabled:opacity-50',
                  targetUser.status === 'active' ? 'bg-[#253900] hover:bg-[#000000]' : 'bg-[#08CB00] hover:bg-[#000000]',
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
