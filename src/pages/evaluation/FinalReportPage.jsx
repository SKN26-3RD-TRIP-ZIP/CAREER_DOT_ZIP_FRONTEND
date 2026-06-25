import { useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useFinalReport } from '../../hooks/useReport';
import { reportApi } from '../../api/reportApi';
import ReportLayout from '../../components/report/ReportLayout';
import StateView from '../../components/report/StateView';
import FinalReportView from './FinalReportView';

/** 공유 버튼 + 인라인 토스트 */
function ShareButton({ sessionId }) {
  const [toastMsg, setToastMsg] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleShare = useCallback(async () => {
    setLoading(true);
    try {
      const { share_url } = await reportApi.createShareLink(sessionId);
      await navigator.clipboard.writeText(share_url);
      setToastMsg('링크가 복사되었습니다!');
    } catch {
      setToastMsg('링크 생성에 실패했습니다. 다시 시도해 주세요.');
    } finally {
      setLoading(false);
      setTimeout(() => setToastMsg(null), 3000);
    }
  }, [sessionId]);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={handleShare}
        disabled={loading}
        className="rounded-lg border border-[rgba(0,0,0,0.18)] px-4 py-2 text-sm font-semibold text-[rgba(0,0,0,0.7)] transition hover:bg-[rgba(0,0,0,0.04)] disabled:opacity-50"
      >
        {loading ? '링크 생성 중…' : '공유 링크 복사'}
      </button>
      {toastMsg && (
        <div className="absolute right-0 top-full z-50 mt-2 whitespace-nowrap rounded-lg bg-[#253900] px-4 py-2 text-xs font-semibold text-[#EEEEEE] shadow-lg">
          {toastMsg}
        </div>
      )}
    </div>
  );
}

export default function FinalReportPage() {
  const { sessionId = 'latest' } = useParams();
  const navigate = useNavigate();
  const reportQuery = useFinalReport(sessionId);

  const reportStatus = reportQuery.data?.status;
  const isGenerating = reportStatus === 'processing';
  const isFailed = reportStatus === 'failed';

  if (reportQuery.isLoading || isGenerating || reportQuery.isError || isFailed || !reportQuery.data) {
    return (
      <ReportLayout title="최종 리포트" subtitle="면접 결과를 불러와 종합 점수와 개선 포인트를 확인합니다.">
        <StateView
          isLoading={reportQuery.isLoading}
          isGenerating={isGenerating}
          isError={reportQuery.isError || isFailed}
          // 생성 실패(status='failed')는 throw가 아니므로 503 메시지를 위해 합성 에러를 전달.
          error={isFailed ? { response: { status: 503 } } : reportQuery.error}
          onRetry={reportQuery.refetch}
        />
      </ReportLayout>
    );
  }

  return (
    <ReportLayout
      title="최종 리포트"
      subtitle="면접 결과를 바탕으로 종합 점수, 강점, 약점, 추천 개선사항을 확인합니다."
      action={
        <div className="no-print flex gap-2">
          <ShareButton sessionId={sessionId} />
          <button type="button" onClick={() => window.print()} className="rounded-lg border border-[rgba(0,0,0,0.18)] px-4 py-2 text-sm font-semibold text-[rgba(0,0,0,0.7)] transition hover:bg-[rgba(0,0,0,0.04)]">
            PDF로 저장
          </button>
          <button type="button" onClick={() => navigate('/mypage')} className="rounded-lg bg-[#000000] px-4 py-2 text-sm font-bold text-[#EEEEEE] transition hover:opacity-90">
            마이페이지로 이동
          </button>
        </div>
      }
    >
      <FinalReportView report={reportQuery.data} />
    </ReportLayout>
  );
}
