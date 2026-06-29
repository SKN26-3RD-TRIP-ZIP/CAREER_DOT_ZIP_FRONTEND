import { Link } from 'react-router-dom';
import TopNav from '../layout/TopNav.jsx';

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

export function PageShell({
  eyebrow,
  title,
  description,
  actions,
  steps,
  currentStep,
  children,
  nav = true,
  navDisabled = false,
  activeNav = '자료 입력',
  maxWidth = 'max-w-6xl',
}) {
  return (
    <div className="min-h-screen bg-[#EEEEEE] text-[#000000]">
      {nav ? <TopNav active={activeNav} disabled={navDisabled} /> : null}
      <main className="px-5 py-8">
        <div className={`mx-auto w-full ${maxWidth}`}>
          <header className="mb-6 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              {eyebrow && (
                <p className="mb-1 text-xs font-black uppercase tracking-wide text-[#08CB00]">{eyebrow}</p>
              )}
              <h1 className="text-2xl font-black tracking-tight text-[#253900] md:text-3xl">{title}</h1>
              {description && (
                <p className="mt-2 max-w-3xl text-sm leading-6 text-[rgba(0,0,0,0.65)]">{description}</p>
              )}
            </div>
            {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
          </header>
          {steps?.length ? <StepIndicator steps={steps} currentStep={currentStep} /> : null}
          {children}
        </div>
      </main>
    </div>
  );
}

export function AuthShell({ title, description, children, footer, aside }) {
  return (
    <div className="min-h-screen w-full bg-[#EEEEEE] lg:grid lg:grid-cols-[minmax(0,460px)_1fr]">
      <aside className="hidden flex-col justify-between bg-[#253900] px-12 py-12 text-[#EEEEEE] lg:flex">
        <Logo tone="light" />
        <div>
          <h1 className="text-4xl font-black leading-tight tracking-tight">
            AI 모의면접으로
            <br />
            합격에 한 걸음 더
          </h1>
          <p className="mt-5 max-w-sm text-sm leading-7 text-[rgba(238,238,238,0.8)]">
            JD·이력서·자소서·프로젝트를 분석해 맞춤 면접 질문과 성장 리포트를 제공합니다.
          </p>
          <ul className="mt-8 space-y-3">
            {['맞춤 면접 질문 생성', '답변 평가 · 실전 꼬리질문', '성장 리포트 자동 저장'].map((item) => (
              <li key={item} className="flex items-center gap-3 text-sm font-bold">
                <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-[#08CB00]" />
                {item}
              </li>
            ))}
          </ul>
          {aside}
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-[rgba(238,238,238,0.6)]">
            Career.zip 면접 준비 흐름
          </p>
          <ol className="relative mt-4 space-y-4 before:absolute before:left-[13px] before:top-3 before:h-[calc(100%-1.5rem)] before:w-px before:bg-[rgba(238,238,238,0.25)]">
            {['자료 입력', 'AI 분석', '모의면접', '리포트'].map((item, index) => (
              <li key={item} className="relative flex items-center gap-3">
                <span className="z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#08CB00] text-xs font-black text-[#253900]">
                  {index + 1}
                </span>
                <span className="text-sm font-bold">{item}</span>
              </li>
            ))}
          </ol>
        </div>
      </aside>

      <main className="flex min-h-screen items-center justify-center px-5 py-10">
        <div className="w-full max-w-md">
          <div className="mb-6 text-center lg:hidden">
            <Logo center />
            <p className="mt-2 text-sm text-[rgba(0,0,0,0.6)]">AI 모의면접 준비를 한 흐름으로 이어갑니다.</p>
          </div>
          <div className="rounded-2xl border border-[rgba(0,0,0,0.08)] bg-[#EEEEEE] p-8 shadow-[0_12px_40px_rgba(0,0,0,0.10)]">
            <h2 className="text-2xl font-black tracking-tight text-[#253900]">{title}</h2>
            {description && <p className="mt-2 text-sm leading-6 text-[rgba(0,0,0,0.6)]">{description}</p>}
            <div className="mt-7">{children}</div>
            {footer && <div className="mt-6 text-center text-sm text-[rgba(0,0,0,0.6)]">{footer}</div>}
          </div>
        </div>
      </main>
    </div>
  );
}

export function Logo({ center = false, tone = 'brand', disabled = false }) {
  if (tone === 'light') {
    const lightClassName = `text-xl font-black tracking-tight text-[#EEEEEE] ${center ? 'inline-block' : ''}`;
    if (disabled) {
      return (
        <span aria-disabled="true" className={`${lightClassName} cursor-default`}>
          Career.zip
        </span>
      );
    }
    return (
      <Link to="/" className={lightClassName}>
        Career.zip
      </Link>
    );
  }
  const brandClassName = `inline-flex items-center rounded-full border border-[#08CB00] px-3.5 py-1.5 text-base font-black tracking-tight text-[#08CB00] ${
    center ? 'mx-auto' : ''
  }`;
  if (disabled) {
    return (
      <span aria-disabled="true" className={`${brandClassName} cursor-default`}>
        Career.zip
      </span>
    );
  }
  return (
    <Link
      to="/"
      className={brandClassName}
    >
      Career.zip
    </Link>
  );
}

export function Card({ children, className = '' }) {
  return (
    <section
      className={`rounded-2xl border border-[rgba(0,0,0,0.08)] bg-[#EEEEEE] shadow-[0_8px_28px_rgba(0,0,0,0.08)] ${className}`}
    >
      {children}
    </section>
  );
}

export function DashboardCard({ children, className = '' }) {
  return <Card className={`p-5 ${className}`}>{children}</Card>;
}

export function Button({ as: Component = 'button', variant = 'primary', className = '', children, ...props }) {
  const variants = {
    primary: 'border border-[#08CB00] bg-[#08CB00] text-[#EEEEEE] hover:opacity-90 disabled:opacity-50',
    secondary: 'border border-[rgba(0,0,0,0.2)] bg-[#EEEEEE] text-[#253900] hover:border-[#253900] disabled:opacity-50',
    danger: 'border border-[#000000] bg-[#000000] text-[#EEEEEE] hover:opacity-90 disabled:opacity-50',
    ghost: 'border border-transparent bg-transparent text-[#253900] hover:bg-[rgba(0,0,0,0.05)] disabled:opacity-50',
  };
  return (
    <Component
      className={`inline-flex h-12 items-center justify-center whitespace-nowrap rounded-lg px-5 text-sm font-black tracking-tight transition disabled:cursor-not-allowed ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </Component>
  );
}

export function Field({ label, hint, required, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-bold text-[#253900]">
        {label}
        {required ? <span className="ml-1.5 text-sm font-black text-[#08CB00]">*</span> : null}
      </span>
      {children}
      {hint && <span className="mt-1.5 block text-xs leading-5 text-[rgba(0,0,0,0.55)]">{hint}</span>}
    </label>
  );
}

export const inputClass =
  'w-full rounded-lg border border-[rgba(0,0,0,0.18)] bg-[#EEEEEE] px-4 py-3 text-sm text-[#000000] outline-none transition placeholder:text-[rgba(0,0,0,0.4)] focus:border-[#08CB00] focus:ring-2 focus:ring-[rgba(8,203,0,0.25)] disabled:opacity-60';

export function Alert({ tone = 'info', children, className = '' }) {
  return (
    <div className={`rounded-lg border px-4 py-3 text-sm font-semibold leading-6 ${toneMap[tone]} ${className}`}>
      {children}
    </div>
  );
}

export function LoadingState({ title = '불러오는 중입니다', description = '잠시만 기다려주세요.' }) {
  return (
    <div className="rounded-xl border border-[rgba(0,0,0,0.08)] bg-[#EEEEEE] px-5 py-8 text-center">
      <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-[#253900] border-t-[#08CB00]" />
      <p className="text-sm font-black text-[#253900]">{title}</p>
      {description && <p className="mt-1 text-sm text-[rgba(0,0,0,0.6)]">{description}</p>}
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
    <div className="rounded-xl border border-dashed border-[rgba(0,0,0,0.2)] bg-[#EEEEEE] px-5 py-8 text-center">
      <p className="text-sm font-black text-[#253900]">{title}</p>
      {description && <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-[rgba(0,0,0,0.6)] whitespace-pre-line">{description}</p>}
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
      <p className="text-xs font-bold text-[rgba(0,0,0,0.6)]">{label}</p>
      <p className="mt-2 text-3xl font-black text-[#08CB00]">{value ?? '-'}</p>
      {helper && <p className="mt-1 text-xs leading-5 text-[rgba(0,0,0,0.55)]">{helper}</p>}
    </Card>
  );
}

// Figma v5: 번호 원 + 연결선 + 라벨로 구성된 가로 진행 스텝퍼
export function StepIndicator({ steps, currentStep }) {
  return (
    <nav className="mb-8 w-full overflow-x-auto" aria-label="진행 단계">
      <ol className="flex w-full min-w-[280px]">
        {steps.map((step, index) => {
          const stepNo = index + 1;
          const active = stepNo === currentStep;
          const done = stepNo < currentStep;
          const isFirst = index === 0;
          const isLast = index === steps.length - 1;
          const leftDone = stepNo <= currentStep;
          const rightDone = stepNo < currentStep;
          return (
            <li key={step} className="flex flex-1 flex-col items-center">
              <div className="flex w-full items-center">
                <span
                  className={`h-0.5 flex-1 ${isFirst ? 'opacity-0' : leftDone ? 'bg-[#08CB00]' : 'bg-[rgba(0,0,0,0.15)]'}`}
                />
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-black ${
                    done
                      ? 'bg-[#08CB00] text-[#EEEEEE]'
                      : active
                        ? 'bg-[#253900] text-[#EEEEEE]'
                        : 'border border-[rgba(0,0,0,0.2)] bg-[#EEEEEE] text-[rgba(0,0,0,0.4)]'
                  }`}
                >
                  {done ? '✓' : stepNo}
                </span>
                <span
                  className={`h-0.5 flex-1 ${isLast ? 'opacity-0' : rightDone ? 'bg-[#08CB00]' : 'bg-[rgba(0,0,0,0.15)]'}`}
                />
              </div>
              <span
                className={`mt-2 text-center text-xs ${
                  active ? 'font-black text-[#253900]' : done ? 'font-bold text-[#253900]' : 'font-medium text-[rgba(0,0,0,0.4)]'
                }`}
              >
                {step}
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
