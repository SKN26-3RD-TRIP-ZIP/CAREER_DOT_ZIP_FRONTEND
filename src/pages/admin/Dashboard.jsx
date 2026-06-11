import { useQuery } from '@tanstack/react-query'
import { Users, UserCheck, UserX, MessageSquare } from 'lucide-react'
import { getMemberStats, getMembers, getPersonas, getTemplates, getAuditLogs } from '../../api/adminApi'

const PERSONA_LABEL = {
  coach: '코치형',
  practical: '실무형',
  verify: '검증형',
}

const PERSONA_COLOR = {
  coach: 'bg-blue-100 text-blue-700',
  practical: 'bg-purple-100 text-purple-700',
  verify: 'bg-amber-100 text-amber-700',
}

export default function Dashboard() {
  const { data: stats } = useQuery({
    queryKey: ['member-stats'],
    queryFn: getMemberStats,
  })

  const { data: recentMembersData } = useQuery({
    queryKey: ['members-recent'],
    queryFn: () => getMembers({ page: 1, size: 5 }),
  })

  const { data: personas = [] } = useQuery({
    queryKey: ['personas'],
    queryFn: getPersonas,
  })

  const {
    data: auditData,
    isLoading: auditLoading,
    isError: auditError,
  } = useQuery({
    queryKey: ['audit-recent'],
    queryFn: () => getAuditLogs({ page: 1, size: 5 }),
  })
  const recentAudits = auditData?.results ?? []

  const { data: practicalTemplates = [] } = useQuery({
    queryKey: ['templates', 'practical'],
    queryFn: () => getTemplates('practical'),
    enabled: personas.length > 0,
  })
  const { data: verifyTemplates = [] } = useQuery({
    queryKey: ['templates', 'verify'],
    queryFn: () => getTemplates('verify'),
    enabled: personas.length > 0,
  })
  const { data: coachTemplates = [] } = useQuery({
    queryKey: ['templates', 'coach'],
    queryFn: () => getTemplates('coach'),
    enabled: personas.length > 0,
  })

  const allTemplates = [
    ...practicalTemplates.map((t) => ({ ...t, persona_type: 'practical' })),
    ...verifyTemplates.map((t) => ({ ...t, persona_type: 'verify' })),
    ...coachTemplates.map((t) => ({ ...t, persona_type: 'coach' })),
  ]

  const recentTemplates = [...allTemplates]
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .slice(0, 3)

  const recentMembers = recentMembersData?.users ?? []

  const STAT_CARDS = [
    { label: '전체 회원', desc: '가입된 전체 사용자 수', value: stats?.total ?? 0, icon: Users, iconClass: 'text-blue-600', bgClass: 'bg-blue-100' },
    { label: '활성 회원', desc: '현재 서비스 이용 가능 회원', value: stats?.active ?? 0, icon: UserCheck, iconClass: 'text-emerald-600', bgClass: 'bg-emerald-100' },
    { label: '정지 회원', desc: '접근이 제한된 회원', value: stats?.suspended ?? 0, icon: UserX, iconClass: 'text-red-500', bgClass: 'bg-red-100' },
    { label: '등록 프롬프트', desc: '등록된 AI 면접 프롬프트', value: allTemplates.length, icon: MessageSquare, iconClass: 'text-purple-600', bgClass: 'bg-purple-100' },
  ]

  return (
    <div className="flex flex-col gap-8">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {STAT_CARDS.map(({ label, desc, value, icon: Icon, iconClass, bgClass }) => (
          <div key={label} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between">
              <div className="flex flex-col gap-1">
                <p className="text-sm font-medium text-slate-500">{label}</p>
                <p className="text-4xl font-bold tracking-tight text-slate-900">{value}</p>
                <p className="text-xs text-slate-400">{desc}</p>
              </div>
              <div className={`rounded-full p-3 ${bgClass}`}>
                <Icon className={`h-5 w-5 ${iconClass}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="col-span-2 rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-6 py-4">
            <h2 className="text-base font-semibold text-slate-900">최근 가입 회원</h2>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">이름</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">이메일</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">가입일</th>
              </tr>
            </thead>
            <tbody>
              {recentMembers.map((user, idx) => (
                <tr
                  key={user.id}
                  className={idx % 2 === 0 ? 'hover:bg-slate-50' : 'bg-slate-50/50 hover:bg-slate-100/60'}
                >
                  <td className="px-6 py-3.5 font-medium text-slate-900">{user.name}</td>
                  <td className="px-6 py-3.5 text-slate-500">{user.email}</td>
                  <td className="px-6 py-3.5 text-slate-400">
                    {user.created_at ? new Date(user.created_at).toLocaleDateString('ko-KR') : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-6 py-4">
            <h2 className="text-base font-semibold text-slate-900">최근 프롬프트</h2>
          </div>
          <div className="flex flex-col divide-y divide-slate-100">
            {recentTemplates.map((tpl) => (
              <div key={tpl.template_id} className="flex flex-col gap-1.5 px-6 py-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-sm font-medium text-slate-900">{tpl.title}</p>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${PERSONA_COLOR[tpl.persona_type]}`}>
                    {PERSONA_LABEL[tpl.persona_type]}
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  {new Date(tpl.created_at).toLocaleDateString('ko-KR')} 생성
                </p>
              </div>
            ))}
            {recentTemplates.length === 0 && (
              <p className="px-6 py-8 text-center text-sm text-slate-400">등록된 프롬프트가 없습니다.</p>
            )}
          </div>
        </div>
      </div>
      {/* 최근 감사 로그 (실제 GET /admin/audit-logs) */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-6 py-4">
          <h2 className="text-base font-semibold text-slate-900">최근 감사 로그</h2>
        </div>
        {auditLoading ? (
          <p className="px-6 py-8 text-center text-sm text-slate-400">불러오는 중...</p>
        ) : auditError ? (
          <p className="px-6 py-8 text-center text-sm text-red-600">감사 로그를 불러오지 못했습니다.</p>
        ) : recentAudits.length === 0 ? (
          <p className="px-6 py-8 text-center text-sm text-slate-400">감사 로그가 없습니다.</p>
        ) : (
          <div className="flex flex-col divide-y divide-slate-100">
            {recentAudits.map((log) => (
              <div key={log.audit_log_id} className="flex items-center justify-between gap-2 px-6 py-3 text-sm">
                <div>
                  <p className="font-medium text-slate-800">{log.action_type}</p>
                  <p className="text-xs text-slate-400">{log.target_type} #{log.target_id}</p>
                </div>
                <span className="text-xs text-slate-400">
                  {log.created_at ? new Date(log.created_at).toLocaleString('ko-KR') : ''}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
