import { useLocation } from 'react-router-dom'

const PAGE_TITLES = {
  '/admin/dashboard': '대시보드',
  '/admin/members': '회원 관리',
  '/admin/prompts': '프롬프트 관리',
}

export default function Header() {
  const { pathname } = useLocation()
  const title = PAGE_TITLES[pathname] ?? '관리자'

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-[rgba(0,0,0,0.1)] bg-[#EEEEEE] px-8">
      <h1 className="text-lg font-semibold text-[#000000]">{title}</h1>
    </header>
  )
}
