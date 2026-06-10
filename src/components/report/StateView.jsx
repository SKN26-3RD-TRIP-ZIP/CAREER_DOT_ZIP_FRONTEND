import { Loader2, AlertTriangle } from 'lucide-react';

export default function StateView({ isLoading, isError, error, onRetry }) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-3 py-24 text-sm text-slate-400">
        <Loader2 className="h-5 w-5 animate-spin" />
        리포트를 불러오는 중…
      </div>
    );
  }
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-slate-200 bg-white p-10 text-center shadow-sm">
      <AlertTriangle className="h-8 w-8 text-orange-400" />
      <p className="font-semibold text-slate-700">
        {error?.response?.status === 404
          ? '리포트를 찾을 수 없습니다. session_id 를 확인해주세요.'
          : error?.message || '데이터를 불러오지 못했습니다.'}
      </p>
      {onRetry && (
        <button onClick={onRetry} className="mt-1 rounded-xl bg-slate-100 px-5 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-200">
          다시 시도
        </button>
      )}
    </div>
  );
}
