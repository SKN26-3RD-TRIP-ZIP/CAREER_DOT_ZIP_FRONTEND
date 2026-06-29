import { useQuery } from '@tanstack/react-query'
import { getDashboardStats } from '../../api/adminApi'
import { statNum, isMissing } from '../../utils/adminStats'

const DAY_LABEL = ['일', '월', '화', '수', '목', '금', '토']

function statCostUsd(value) {
  if (isMissing(value)) return '미집계'
  return `$${Number(value).toFixed(4)}`
}

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
            <div className="w-full rounded-t-[3px] bg-[#08CB00]" style={{ height: barH }} />
            <span className="text-[11px] text-[#AAAAAA]">{label}</span>
          </div>
        )
      })}
    </div>
  )
}

/* ── Stat card (icon + value + label) ──────────────────────────────────── */
function StatCard({ label, value, icon }) {
  return (
    <div className="flex flex-col gap-3 rounded-xl bg-[#1E293B] p-5 shadow-sm">
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#0A1A00]">
        <span className="text-base text-[#08CB00]">{icon}</span>
      </div>
      <p className="text-[28px] font-bold leading-none tracking-tight text-[#EEEEEE]">{value}</p>
      <p className="text-sm text-[#AAAAAA]">{label}</p>
    </div>
  )
}

/* ── Dashboard ─────────────────────────────────────────────────────────── */
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

  // 명세서 기준 통계 카드 6개. 전부 백엔드 실집계 필드이며 가짜 system_health는 쓰지 않는다.
  const STAT_CARDS = [
    { label: '전체 회원', value: statNum(stats.total_members), icon: '△' },
    { label: '면접 세션', value: statNum(stats.total_sessions), icon: '●' },
    { label: '리포트', value: statNum(stats.total_reports), icon: '◇' },
    { label: 'AI 호출', value: statNum(stats.ai_calls), icon: '↓' },
    { label: '에러', value: statNum(stats.error_count), icon: '△' },
    { label: '이번 달 비용', value: statCostUsd(stats.monthly_cost), icon: '□' },
  ]

  return (
    <div className="flex flex-col gap-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-[#EEEEEE]">대시보드</h1>
        <p className="mt-1 text-sm text-[#AAAAAA]">서비스 운영 현황을 한눈에 확인하세요. </p>
      </div>

      {/* 6 stat cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-6">
        {STAT_CARDS.map((card) => (
          <StatCard key={card.label} {...card} />
        ))}
      </div>

      {/* Weekly bar chart (full width) */}
      <div className="rounded-xl bg-[#1E293B] p-6 shadow-sm">
        <h2 className="text-base font-semibold text-[#EEEEEE]">주간 면접 세션</h2>
        <p className="mt-0.5 text-xs text-[#666666]">최근 7일 일별 진행 수</p>
        <div className="mt-6">
          <WeeklyBarChart data={stats.weekly_sessions ?? []} />
        </div>
      </div>
    </div>
  )
}
