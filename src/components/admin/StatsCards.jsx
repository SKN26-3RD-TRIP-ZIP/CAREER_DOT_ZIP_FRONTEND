import { useQuery } from '@tanstack/react-query'
import { Users, UserCheck, UserX } from 'lucide-react'
import { getMemberStats } from '../../api/adminApi'

const CARDS = [
  {
    label: '전체 회원',
    desc: '가입된 전체 사용자 수',
    key: 'total',
    icon: Users,
    iconClass: 'text-slate-600',
    valueClass: 'text-slate-900',
    bgClass: 'bg-slate-200',
  },
  {
    label: '활성 회원',
    desc: '현재 서비스 이용 가능 회원',
    key: 'active',
    icon: UserCheck,
    iconClass: 'text-emerald-600',
    valueClass: 'text-emerald-600',
    bgClass: 'bg-emerald-100',
  },
  {
    label: '정지 회원',
    desc: '접근이 제한된 회원',
    key: 'suspended',
    icon: UserX,
    iconClass: 'text-red-500',
    valueClass: 'text-red-500',
    bgClass: 'bg-red-100',
  },
]

export default function StatsCards() {
  const { data: stats } = useQuery({
    queryKey: ['user-stats'],
    queryFn: getMemberStats,
    staleTime: 0,
  })

  return (
    <div className="grid grid-cols-3 gap-5">
      {CARDS.map(({ label, desc, key, icon: Icon, iconClass, valueClass, bgClass }) => (
        <div key={key} className="rounded-xl border border-slate-200 bg-white shadow-sm p-6">
          <div className="flex items-start justify-between">
            <div className="flex flex-col gap-1">
              <p className="text-sm font-medium text-slate-500">{label}</p>
              <p className={`text-4xl font-bold tracking-tight ${valueClass}`}>
                {stats?.[key] ?? 0}
              </p>
              <p className="text-xs text-slate-400">{desc}</p>
            </div>
            <div className={`rounded-full p-3 ${bgClass}`}>
              <Icon className={`h-5 w-5 ${iconClass}`} />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
