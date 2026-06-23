import { AlertTriangle, Loader2 } from 'lucide-react';

function messageFor(error) {
  const status = error?.response?.status;
  if (status === 503) return 'AI 평가 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
  if (status === 500) return '리포트를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.';
  if (status === 404) return '아직 리포트가 생성되지 않았습니다. 면접을 완료하면 리포트가 표시됩니다.';
  if (status === 401) return '인증이 만료되었습니다. 다시 로그인해주세요.';
  return error?.message || '데이터를 불러오지 못했습니다.';
}

export default function StateView({ isLoading, isError, error, onRetry }) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-3 rounded-xl border border-[rgba(0,0,0,0.1)] bg-[#EEEEEE] py-20 text-sm text-[rgba(0,0,0,0.5)]">
        <Loader2 className="h-5 w-5 animate-spin" />
        리포트를 불러오는 중입니다.
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-[rgba(0,0,0,0.1)] bg-[#EEEEEE] p-10 text-center shadow-[0_8px_28px_rgba(0,0,0,0.06)]">
      <AlertTriangle className="h-8 w-8 text-[#253900]" />
      <p className="font-semibold text-[#000000]">{isError ? messageFor(error) : '아직 리포트가 생성되지 않았습니다.'}</p>
      <p className="max-w-md text-sm leading-6 text-[rgba(0,0,0,0.5)]">면접을 완료하면 최종 리포트가 자동으로 표시됩니다.</p>
      {onRetry && error?.response?.status !== 401 && (
        <button type="button" onClick={onRetry} className="mt-1 rounded-lg bg-[rgba(0,0,0,0.06)] px-5 py-2.5 text-sm font-bold text-[rgba(0,0,0,0.7)] transition hover:bg-[rgba(0,0,0,0.1)]">
          다시 시도
        </button>
      )}
      {error?.response?.status === 401 && (
        <a href="/auth/login" className="mt-1 rounded-lg bg-[#000000] px-5 py-2.5 text-sm font-bold text-[#EEEEEE] transition hover:opacity-90">
          로그인하기
        </a>
      )}
    </div>
  );
}
