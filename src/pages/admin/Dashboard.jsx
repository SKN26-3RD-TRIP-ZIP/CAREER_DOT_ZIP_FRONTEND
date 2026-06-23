import { useQuery } from '@tanstack/react-query'
import { getDashboardStats } from '../../api/adminApi'

const DAY_LABEL = ['일', '월', '화', '수', '목', '금', '토']

/* ── Weekly bar chart ──────────────────────────────────────────────────── */
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
            <div
              className="w-full rounded-t-[3px] bg-[#08CB00]"
              style={{ height: barH }}
            />
            <span className="text-[11px] text-[#AAAAAA]">{label}</span>
          </div>
        )
      })}
    </div>
  )
}

/* ── Stat card ─────────────────────────────────────────────────────────── */
function StatCard({ label, value, icon }) {
  return (
    <div className="flex flex-col gap-3 rounded-xl bg-[#1A2200] p-5 shadow-sm">
      {/* Icon top-left */}
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#0A1A00]">
        <span className="text-base text-[#08CB00]">{icon}</span>
      </div>
      {/* Value */}
      <p className="text-[28px] font-bold leading-none tracking-tight text-[#EEEEEE]">
        {value}
      </p>
      {/* Label */}
      <p className="text-sm text-[#AAAAAA]">{label}</p>
    </div>
  )
}

/* ── Dashboard ─────────────────────────────────────────────────────────── */
export default function Dashboard() {
  const { data: stats } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: getDashboardStats,
    refetchInterval: 30_000,
  })

  const STAT_CARDS = [
    {
      label: '전체 회원',
      value: stats?.total_members?.toLocaleString() ?? '—',
      icon: '△',
    },
    {
      label: '면접 세션',
      value: stats?.total_sessions?.toLocaleString() ?? '—',
      icon: '●',
    },
    {
      label: '리포트',
      value: stats?.total_reports?.toLocaleString() ?? '—',
      icon: '◇',
    },
    {
      label: 'AI 호출',
      value: stats?.ai_calls != null ? stats.ai_calls.toLocaleString() : '—',
      icon: '↓',
    },
    {
      label: '에러',
      value: stats?.error_count?.toLocaleString() ?? '—',
      icon: '△',
    },
    {
      label: '이번 달 비용',
      value: stats?.monthly_cost != null ? `$${stats.monthly_cost.toFixed(4)}` : '—',
      icon: '□',
    },
  ]

  return (
    <div className="flex flex-col gap-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-[#EEEEEE]">대시보드</h1>
        <p className="mt-1 text-sm text-[#AAAAAA]">
          서비스 운영 현황과 시스템 상태를 한눈에 확인하세요.
        </p>
      </div>

      {/* 6 stat cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-6">
        {STAT_CARDS.map((card) => (
          <StatCard key={card.label} {...card} />
        ))}
      </div>

      {/* Weekly bar chart */}
      <div className="rounded-xl bg-[#1A2200] p-6 shadow-sm">
        <h2 className="text-base font-semibold text-[#EEEEEE]">주간 면접 세션</h2>
        <p className="mt-0.5 text-xs text-[#666666]">최근 7일 일별 진행 수</p>
        <div className="mt-6">
          <WeeklyBarChart data={stats?.weekly_sessions ?? []} />
        </div>
      </div>
    </div>
  )
}
