import { useQuery } from '@tanstack/react-query'
import { getDashboardStats } from '../../api/adminApi'
import { statNum, statMoney } from '../../utils/adminStats'

const DAY_LABEL = ['일', '월', '화', '수', '목', '금', '토']

function WeeklyBarChart({ data = [] }) {
  const max = Math.max(...data.map((d) => d.count), 1)
  return (
    <div className="flex h-[180px] items-end gap-3">
      {data.map((d) => {
        const date = new Date(d.date + 'T00:00:00')
        const label = DAY_LABEL[date.getDay()]
        const barH = Math.max(Math.round((d.count / max) * 140), 4)
        return (
          <div key={d.date} className="flex flex-1 flex-col items-center gap-1">
            <span className="text-[11px] text-[#666666]">{d.count || ''}</span>
            <div className="w-full rounded-t-[3px] bg-[#08CB00]" style={{ height: barH }} />
            <span className="text-[11px] text-[#AAAAAA]">{label}</span>
          </div>
        )
      })}
    </div>
  )
}

function StatCard({ label, value }) {
  return (
    <div className="flex flex-col gap-2 rounded-xl bg-[#1A2200] p-5 shadow-sm">
      <p className="text-[26px] font-bold leading-none tracking-tight text-[#EEEEEE]">{value}</p>
      <p className="text-sm text-[#AAAAAA]">{label}</p>
    </div>
  )
}

function StatGroup({ title, items }) {
  return (
    <div className="rounded-xl bg-[#1A2200] p-6 shadow-sm">
      <h2 className="text-base font-semibold text-[#EEEEEE]">{title}</h2>
      <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
        {items.map((it) => (
          <div key={it.label}>
            <p className="text-xl font-bold text-[#EEEEEE]">{it.value}</p>
            <p className="text-xs text-[#AAAAAA]">{it.label}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function Dashboard() {
  const { data: stats, isLoading, isError, refetch } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: getDashboardStats,
    refetchInterval: 30_000,
  })

  if (isLoading) {
    return <p className="py-16 text-center text-sm text-[#AAAAAA]">대시보드를 불러오는 중...</p>
  }
  if (isError || !stats) {
    return (
      <div className="py-16 text-center">
        <p className="text-sm text-[#FF5555]">대시보드 통계를 불러오지 못했습니다.</p>
        <button onClick={() => refetch()} className="mt-3 rounded-md bg-[#08CB00] px-4 py-1.5 text-sm font-medium text-[#000000] hover:bg-[#05A000]">다시 시도</button>
      </div>
    )
  }

  const reports = stats.reports ?? {}
  const evals = stats.evaluations ?? {}
  const points = stats.points ?? {}
  const guardrails = stats.guardrails ?? {}

  const MEMBER_CARDS = [
    { label: '전체 회원', value: statNum(stats.total_members) },
    { label: '활성 회원', value: statNum(stats.active_members) },
    { label: '휴면 회원', value: statNum(stats.suspended_members) },
    { label: '탈퇴 회원', value: statNum(stats.withdrawn_members) },
    { label: '신규 회원', value: statNum(stats.new_members) },
    { label: '완료 면접', value: statNum(stats.completed_sessions) },
  ]

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-[#EEEEEE]">대시보드</h1>
        <p className="mt-1 text-sm text-[#AAAAAA]">실제 집계 통계입니다. 미집계 항목은 0으로 위장하지 않고 "미집계"로 표시합니다.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-6">
        {MEMBER_CARDS.map((c) => <StatCard key={c.label} {...c} />)}
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <StatGroup title="리포트 · 평가" items={[
          { label: '전체 리포트', value: statNum(stats.total_reports) },
          { label: '리포트 성공', value: statNum(reports.success) },
          { label: '리포트 실패', value: statNum(reports.failed) },
          { label: '평가 완료', value: statNum(evals.completed) },
          { label: '평가 실패', value: statNum(evals.failed) },
          { label: '면접 세션', value: statNum(stats.total_sessions) },
        ]} />
        <StatGroup title="LLM · 가드레일" items={[
          { label: 'AI 호출', value: statNum(stats.ai_calls) },
          { label: 'API 오류', value: statNum(stats.error_count) },
          { label: '이번 달 비용', value: statMoney(stats.monthly_cost) },
          { label: '가드레일 이벤트', value: statNum(guardrails.event_count) },
        ]} />
        <StatGroup title="포인트" items={[
          { label: '적립', value: statNum(points.earned) },
          { label: '차감', value: statNum(points.used) },
          { label: '환불', value: statNum(points.refunded) },
          { label: '거래 수', value: statNum(points.transaction_count) },
        ]} />
        <div className="rounded-xl bg-[#1A2200] p-6 shadow-sm">
          <h2 className="text-base font-semibold text-[#EEEEEE]">주간 면접 세션</h2>
          <p className="mt-0.5 text-xs text-[#666666]">최근 7일 일별 진행 수</p>
          <div className="mt-6"><WeeklyBarChart data={stats.weekly_sessions ?? []} /></div>
        </div>
      </div>
    </div>
  )
}
