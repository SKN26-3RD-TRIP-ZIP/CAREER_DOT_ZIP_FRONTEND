import { Link } from 'react-router-dom';

const toneMap = {
  default: 'border-slate-200 bg-white text-slate-700',
  success: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  warning: 'border-amber-200 bg-amber-50 text-amber-700',
  danger: 'border-rose-200 bg-rose-50 text-rose-700',
  info: 'border-sky-200 bg-sky-50 text-sky-700',
};

export function PageShell({ eyebrow, title, description, actions, steps, currentStep, children }) {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900">
      <div className="mx-auto w-full max-w-6xl">
        <header className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            {eyebrow && <p className="mb-2 text-xs font-bold uppercase tracking-wide text-emerald-600">{eyebrow}</p>}
            <h1 className="text-2xl font-bold tracking-normal text-slate-950 md:text-3xl">{title}</h1>
            {description && <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">{description}</p>}
          </div>
          {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
        </header>
        {steps?.length ? <StepIndicator steps={steps} currentStep={currentStep} /> : null}
        {children}
      </div>
    </main>
  );
}

export function AuthShell({ title, description, children, footer }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10 text-slate-900">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-bold tracking-normal text-emerald-700">Career.zip</h1>
          <p className="mt-2 text-sm text-slate-500">AI 모의면접 준비를 한 흐름으로 이어갑니다.</p>
        </div>
        <Card className="p-7">
          <h2 className="text-xl font-bold text-slate-950">{title}</h2>
          {description && <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>}
          <div className="mt-6">{children}</div>
          {footer && <div className="mt-5 text-center text-sm text-slate-500">{footer}</div>}
        </Card>
      </div>
    </main>
  );
}

export function Card({ children, className = '' }) {
  return <section className={`rounded-lg border border-slate-200 bg-white shadow-sm ${className}`}>{children}</section>;
}

export function Button({ as: Component = 'button', variant = 'primary', className = '', children, ...props }) {
  const variants = {
    primary: 'bg-emerald-600 text-white hover:bg-emerald-700 disabled:bg-emerald-300',
    secondary: 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 disabled:text-slate-400',
    danger: 'bg-rose-600 text-white hover:bg-rose-700 disabled:bg-rose-300',
    ghost: 'text-slate-600 hover:bg-slate-100 disabled:text-slate-400',
  };
  return (
    <Component
      className={`inline-flex min-h-10 items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </Component>
  );
}

export function Field({ label, hint, required, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-slate-800">
        {label}
        {required ? <span className="ml-1 text-rose-500">필수</span> : null}
      </span>
      {children}
      {hint && <span className="mt-1.5 block text-xs leading-5 text-slate-500">{hint}</span>}
    </label>
  );
}

export const inputClass =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 disabled:bg-slate-100';

export function Alert({ tone = 'info', children, className = '' }) {
  return <div className={`rounded-lg border px-4 py-3 text-sm leading-6 ${toneMap[tone]} ${className}`}>{children}</div>;
}

export function LoadingState({ title = '불러오는 중입니다', description = '잠시만 기다려주세요.' }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-5 py-8 text-center">
      <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
      <p className="text-sm font-semibold text-slate-900">{title}</p>
      {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
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
    <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-5 py-8 text-center">
      <p className="text-sm font-semibold text-slate-900">{title}</p>
      {description && <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-500">{description}</p>}
      {action}
    </div>
  );
}

export function StatusBadge({ children, tone = 'default' }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${toneMap[tone]}`}>
      {children || '없음'}
    </span>
  );
}

export function StatCard({ label, value, helper }) {
  return (
    <Card className="p-4">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-bold text-slate-950">{value ?? '-'}</p>
      {helper && <p className="mt-1 text-xs leading-5 text-slate-500">{helper}</p>}
    </Card>
  );
}

export function StepIndicator({ steps, currentStep }) {
  return (
    <nav className="mb-6 grid gap-2 sm:grid-cols-2 lg:grid-cols-4" aria-label="진행 단계">
      {steps.map((step, index) => {
        const active = index + 1 === currentStep;
        const done = index + 1 < currentStep;
        return (
          <div
            key={step}
            className={`rounded-lg border px-4 py-3 text-sm ${
              active
                ? 'border-emerald-500 bg-emerald-50 text-emerald-800'
                : done
                  ? 'border-slate-200 bg-white text-slate-700'
                  : 'border-slate-200 bg-white text-slate-400'
            }`}
          >
            <span className="mr-2 font-bold">{index + 1}</span>
            {step}
          </div>
        );
      })}
    </nav>
  );
}
