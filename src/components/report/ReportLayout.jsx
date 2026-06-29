import TopNav from '../layout/TopNav.jsx';

export default function ReportLayout({ title, subtitle, action, children, adminMode = false }) {
  return (
    <div className="min-h-screen bg-[#EEEEEE] text-[#000000]">
      <TopNav active="리포트" disabled={adminMode} />

      <main className="mx-auto w-full max-w-6xl px-5 py-8">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-[#253900] md:text-3xl">{title}</h1>
            {subtitle && <p className="mt-2 text-sm leading-6 text-[rgba(0,0,0,0.6)]">{subtitle}</p>}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
        {children}
      </main>
    </div>
  );
}
