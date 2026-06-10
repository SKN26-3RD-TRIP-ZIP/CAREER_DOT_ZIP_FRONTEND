import { useNavigate } from 'react-router-dom';

const NAV = ['대시보드', '자료 입력', 'AI 분석', '면접 진행', '리포트', '마이페이지'];

/**
 * 리포트 화면 공통 레이아웃: 상단 네비 + 페이지 헤더 + 컨테이너.
 * 화면계획서(Figma)의 글로벌 네비를 재현.
 */
export default function ReportLayout({ title, subtitle, action, children }) {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-slate-100">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-10">
            <button
              onClick={() => navigate('/')}
              className="rounded-xl bg-[#173a1f] px-4 py-2 text-sm font-extrabold text-white"
            >
              Career.zip
            </button>
            <nav className="hidden items-center gap-7 text-sm font-medium md:flex">
              {NAV.map((label) => (
                <span
                  key={label}
                  className={label === '리포트' ? 'font-bold text-green-600' : 'cursor-pointer text-slate-500 hover:text-slate-800'}
                >
                  {label}
                </span>
              ))}
            </nav>
          </div>
          <button className="rounded-xl bg-green-500 px-4 py-2 text-sm font-bold text-white hover:bg-green-600">
            면접 시작하기
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 md:text-3xl">{title}</h1>
            {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
        {children}
      </main>
    </div>
  );
}
