import { Link } from 'react-router-dom';

const toneMap = {
  default: 'border-[#000000] bg-[#EEEEEE] text-[#000000]',
  success: 'border-[#253900] bg-[#EEEEEE] text-[#253900]',
  warning: 'border-[#253900] bg-[#EEEEEE] text-[#253900]',
  danger: 'border-[#000000] bg-[#EEEEEE] text-[#000000]',
  info: 'border-[#253900] bg-[#EEEEEE] text-[#253900]',
};

export const palette = {
  primary: '#08CB00',
  deep: '#253900',
  black: '#000000',
  bg: '#EEEEEE',
};

export function PageShell({ eyebrow, title, description, actions, steps, currentStep, children }) {
  return (
    <main className="min-h-screen bg-[#EEEEEE] px-5 py-8 text-[#000000]">
      <div className="mx-auto w-full max-w-6xl">
        <header className="mb-7 flex flex-col gap-5 border-b border-[#000000] pb-6 md:flex-row md:items-end md:justify-between">
          <div>
            {eyebrow && <p className="mb-2 text-xs font-black uppercase tracking-normal text-[#253900]">{eyebrow}</p>}
            <h1 className="text-3xl font-black tracking-normal text-[#253900] md:text-4xl">{title}</h1>
            {description && <p className="mt-3 max-w-3xl text-base leading-7 text-[#000000]">{description}</p>}
          </div>
          {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
        </header>
        {steps?.length ? <StepIndicator steps={steps} currentStep={currentStep} /> : null}
        {children}
      </div>
    </main>
  );
}

export function AuthShell({ title, description, children, footer, aside }) {
  return (
    <main className="min-h-screen bg-[#EEEEEE] px-5 py-10 text-[#000000]">
      <div className="mx-auto grid min-h-[calc(100vh-5rem)] w-full max-w-6xl items-center gap-8 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="hidden lg:block">
          <Logo />
          <h1 className="mt-10 max-w-xl text-5xl font-black leading-tight tracking-normal text-[#253900]">
            AI 모의면접으로 합격에 한 걸음 더
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-8">
            JD, 이력서, 자소서와 프로젝트를 분석해 맞춤 면접 질문과 성장 리포트를 제공합니다.
          </p>
          <div className="mt-8 grid max-w-xl gap-3">
            {['맞춤 면접 질문 생성', '답변 평가와 실전 꼬리질문', '성장 리포트 자동 저장'].map((item) => (
              <div key={item} className="flex items-center gap-3 rounded-lg border border-[#000000] bg-[#EEEEEE] p-4 shadow-[0_8px_0_rgba(0,0,0,0.12)]">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#08CB00] text-sm font-black text-[#000000]">✓</span>
                <span className="font-bold">{item}</span>
              </div>
            ))}
          </div>
          {aside}
        </section>
        <section className="mx-auto w-full max-w-md">
          <div className="mb-6 text-center lg:hidden">
            <Logo center />
            <p className="mt-2 text-sm text-[#000000]">AI 모의면접 준비를 한 흐름으로 이어갑니다.</p>
          </div>
          <Card className="p-7">
            <h2 className="text-2xl font-black tracking-normal text-[#253900]">{title}</h2>
            {description && <p className="mt-3 text-sm leading-6 text-[#000000]">{description}</p>}
            <div className="mt-7">{children}</div>
            {footer && <div className="mt-6 text-center text-sm text-[#000000]">{footer}</div>}
          </Card>
        </section>
      </div>
    </main>
  );
}

export function Logo({ center = false }) {
  return (
    <Link to="/" className={`inline-flex items-center gap-2 text-2xl font-black tracking-normal text-[#253900] ${center ? 'justify-center' : ''}`}>
      <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#08CB00] text-sm font-black text-[#000000]">CZ</span>
      Career.zip
    </Link>
  );
}

export function Card({ children, className = '' }) {
  return (
    <section className={`rounded-lg border border-[#000000] bg-[#EEEEEE] shadow-[0_12px_0_rgba(0,0,0,0.10)] ${className}`}>
      {children}
    </section>
  );
}

export function DashboardCard({ children, className = '' }) {
  return <Card className={`p-5 ${className}`}>{children}</Card>;
}

export function Button({ as: Component = 'button', variant = 'primary', className = '', children, ...props }) {
  const variants = {
    primary: 'border border-[#000000] bg-[#08CB00] text-[#000000] hover:opacity-90 disabled:opacity-50',
    secondary: 'border border-[#253900] bg-[#EEEEEE] text-[#253900] hover:opacity-80 disabled:opacity-50',
    danger: 'border border-[#000000] bg-[#000000] text-[#EEEEEE] hover:opacity-90 disabled:opacity-50',
    ghost: 'border border-transparent bg-transparent text-[#253900] hover:border-[#253900] disabled:opacity-50',
  };
  return (
    <Component
      className={`inline-flex min-h-11 items-center justify-center whitespace-nowrap rounded-lg px-5 py-2.5 text-sm font-black tracking-normal transition disabled:cursor-not-allowed ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </Component>
  );
}

export function Field({ label, hint, required, children }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-black text-[#253900]">
        {label}
        {required ? <span className="ml-2 rounded-full border border-[#253900] px-2 py-0.5 text-[11px] font-black text-[#253900]">필수</span> : null}
      </span>
      {children}
      {hint && <span className="mt-2 block text-xs leading-5 text-[#000000]">{hint}</span>}
    </label>
  );
}

export const inputClass =
  'w-full rounded-lg border border-[#000000] bg-[#EEEEEE] px-4 py-3 text-sm text-[#000000] outline-none transition placeholder:text-[#000000] placeholder:opacity-60 focus:border-[#253900] focus:ring-2 focus:ring-[#08CB00] disabled:opacity-60';

export function Alert({ tone = 'info', children, className = '' }) {
  return <div className={`rounded-lg border px-4 py-3 text-sm font-semibold leading-6 ${toneMap[tone]} ${className}`}>{children}</div>;
}

export function LoadingState({ title = '불러오는 중입니다', description = '잠시만 기다려주세요.' }) {
  return (
    <div className="rounded-lg border border-[#000000] bg-[#EEEEEE] px-5 py-8 text-center">
      <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-[#253900] border-t-[#08CB00]" />
      <p className="text-sm font-black text-[#253900]">{title}</p>
      {description && <p className="mt-1 text-sm text-[#000000]">{description}</p>}
    </div>
  );
}

export function EmptyState({ title, description, actionLabel, actionTo, onAction }) {
  const action =
    actionLabel && actionTo ? (
      <Button as={Link} to={actionTo} variant="secondary" className="mt-4">
        {actionLabel}
      </Button>
    ) : actionLabel ? (
      <Button type="button" onClick={onAction} variant="secondary" className="mt-4">
        {actionLabel}
      </Button>
    ) : null;
  return (
    <div className="rounded-lg border border-dashed border-[#000000] bg-[#EEEEEE] px-5 py-8 text-center">
      <p className="text-sm font-black text-[#253900]">{title}</p>
      {description && <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-[#000000]">{description}</p>}
      {action}
    </div>
  );
}

export function StatusBadge({ children, tone = 'default' }) {
  return (
    <span className={`inline-flex items-center whitespace-nowrap rounded-full border px-3 py-1 text-xs font-black ${toneMap[tone]}`}>
      {children || '없음'}
    </span>
  );
}

export function StatCard({ label, value, helper }) {
  return (
    <Card className="p-4">
      <p className="text-sm font-black text-[#253900]">{label}</p>
      <p className="mt-2 text-3xl font-black text-[#000000]">{value ?? '-'}</p>
      {helper && <p className="mt-1 text-xs leading-5 text-[#000000]">{helper}</p>}
    </Card>
  );
}

export function StepIndicator({ steps, currentStep }) {
  return (
    <nav className="mb-7 grid gap-2 sm:grid-cols-2 lg:grid-cols-5" aria-label="진행 단계">
      {steps.map((step, index) => {
        const active = index + 1 === currentStep;
        const done = index + 1 < currentStep;
        return (
          <div
            key={step}
            className={`rounded-lg border px-4 py-3 text-sm font-black ${
              active
                ? 'border-[#253900] bg-[#253900] text-[#EEEEEE]'
                : done
                  ? 'border-[#000000] bg-[#08CB00] text-[#000000]'
                  : 'border-[#000000] bg-[#EEEEEE] text-[#000000]'
            }`}
          >
            <span className="mr-2">{done ? '✓' : index + 1}</span>
            {step}
          </div>
        );
      })}
    </nav>
  );
}
