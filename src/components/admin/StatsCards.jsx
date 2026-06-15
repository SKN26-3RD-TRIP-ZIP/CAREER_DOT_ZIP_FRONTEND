import { useQuery } from '@tanstack/react-query'
import { Users, UserCheck, UserX } from 'lucide-react'
import { getMemberStats } from '../../api/adminApi'

const CARDS = [
  {
    label: '전체 회원',
    desc: '가입된 전체 사용자 수',
    key: 'total',
    icon: Users,
    iconClass: 'text-[#253900]',
    valueClass: 'text-[#000000]',
    bgClass: 'bg-[rgba(0,0,0,0.10)]',
  },
  {
    label: '활성 회원',
    desc: '현재 서비스 이용 가능 회원',
    key: 'active',
    icon: UserCheck,
    iconClass: 'text-[#253900]',
    valueClass: 'text-[#253900]',
    bgClass: 'bg-[#08CB00]',
  },
  {
    label: '정지 회원',
    desc: '접근이 제한된 회원',
    key: 'suspended',
    icon: UserX,
    iconClass: 'text-[#000000]',
    valueClass: 'text-[#000000]',
    bgClass: 'bg-[#253900]',
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
        <div key={key} className="rounded-xl border border-[rgba(0,0,0,0.12)] bg-[#EEEEEE] shadow-[0_8px_20px_rgba(0,0,0,0.08)] p-6">
          <div className="flex items-start justify-between">
            <div className="flex flex-col gap-1">
              <p className="text-sm font-medium text-[rgba(0,0,0,0.68)]">{label}</p>
              <p className={`text-4xl font-bold tracking-tight ${valueClass}`}>
                {stats?.[key] ?? 0}
              </p>
              <p className="text-xs text-[rgba(0,0,0,0.52)]">{desc}</p>
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
