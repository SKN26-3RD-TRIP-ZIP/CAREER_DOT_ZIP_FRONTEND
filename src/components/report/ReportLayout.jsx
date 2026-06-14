import { useNavigate } from 'react-router-dom';

const NAV = ['대시보드', '자료 입력', 'AI 분석', '면접 진행', '리포트', '마이페이지'];

export default function ReportLayout({ title, subtitle, action, children }) {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-8">
            <button
              type="button"
              aria-label="메인 화면으로 이동"
              onClick={() => navigate('/')}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-bold text-white hover:bg-slate-800"
            >
              Career.zip
            </button>
            <nav className="hidden items-center gap-6 text-sm font-medium md:flex">
              {NAV.map((label) => (
                <span key={label} className={label === '리포트' ? 'font-bold text-emerald-700' : 'text-slate-500'}>
                  {label}
                </span>
              ))}
            </nav>
          </div>
          <button type="button" onClick={() => navigate('/interview/setup')} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700">
            면접 시작하기
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-950 md:text-3xl">{title}</h1>
            {subtitle && <p className="mt-2 text-sm leading-6 text-slate-600">{subtitle}</p>}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
        {children}
      </main>
    </div>
  );
}
