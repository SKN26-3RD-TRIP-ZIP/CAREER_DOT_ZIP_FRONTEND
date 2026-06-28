import { useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useFinalReport } from '../../hooks/useReport';
import { reportApi } from '../../api/reportApi';
import { cleanupPromptTestRun } from '../../api/adminApi';
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


function getWeaknessLabels(report) {
  const candidates = [
    report?.weaknesses,
    report?.summary?.weaknesses,
    report?.score_detail?.weaknesses,
    report?.score_summary?.weaknesses,
    report?.raw_data?.weaknesses,
    report?.raw_data?.summary?.weaknesses,
  ]

  const source = candidates.find(Array.isArray) ?? []

  return source
    .map((item) => {
      if (typeof item === 'string') {
        return item.trim()
      }

      return String(
        item?.label ??
          item?.name ??
          item?.tag ??
          item?.weakness ??
          '',
      ).trim()
    })
    .filter(Boolean)
    .slice(0, 4)
}

function WeaknessPracticeCta({ report }) {
  const weaknesses = getWeaknessLabels(report)

  if (weaknesses.length === 0) {
    return null
  }

  return (
    <section className="no-print mt-5 rounded-2xl border border-[#08CB00] bg-[rgba(8,203,0,0.06)] p-5">
      <h2 className="text-base font-black text-[#253900]">
        약점 집중 연습
      </h2>

      <p className="mt-1 text-sm text-[rgba(0,0,0,0.6)]">
        취약한 역량을 골라 관련 질문팩으로 바로 연습할 수 있습니다.
      </p>

      <div className="mt-3 flex flex-wrap gap-2">
        {weaknesses.map((label, index) => (
          <a
            key={`${label}-${index}`}
            href={`/interview/question-packs?focus=${encodeURIComponent(label)}`}
            className="rounded-full border border-[#253900] px-3 py-1 text-xs font-black text-[#253900] transition hover:bg-[rgba(37,57,0,0.08)]"
          >
            {label} · 집중 연습
          </a>
        ))}

        <a
          href="/interview/question-packs"
          className="rounded-full border border-[rgba(0,0,0,0.18)] px-3 py-1 text-xs font-black text-[rgba(0,0,0,0.6)] transition hover:bg-[rgba(0,0,0,0.04)]"
        >
          추천 질문팩 보기
        </a>
      </div>
    </section>
  )
}

export default function FinalReportPage({ adminMode = false }) {
  const { sessionId = 'latest' } = useParams();
  const navigate = useNavigate();
  const reportQuery = useFinalReport(sessionId);
  const reportBasePath = adminMode ? '/report-admin' : '/report';

  const reportStatus = reportQuery.data?.status;
  const isGenerating = reportStatus === 'processing';
  const isFailed = reportStatus === 'failed';

  const handleAdminReturn = async () => {
    try {
      await cleanupPromptTestRun(sessionId);
    } catch (err) {
      console.warn('Failed to cleanup admin prompt test run', err);
    } finally {
      window.localStorage.removeItem('careerzip_admin_interview_test');
      navigate('/admin/versions');
    }
  };

  if (reportQuery.isLoading || isGenerating || reportQuery.isError || isFailed || !reportQuery.data) {
    return (
      <ReportLayout title="최종 리포트" subtitle="면접 결과를 불러와 종합 점수와 개선 포인트를 확인합니다." adminMode={adminMode}>
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
      adminMode={adminMode}
      action={
        <div className="no-print flex gap-2">
          <ShareButton sessionId={sessionId} />
          <button type="button" onClick={() => window.print()} className="rounded-lg border border-[rgba(0,0,0,0.18)] px-4 py-2 text-sm font-semibold text-[rgba(0,0,0,0.7)] transition hover:bg-[rgba(0,0,0,0.04)]">
            PDF로 저장
          </button>
          <button type="button" onClick={adminMode ? handleAdminReturn : () => navigate('/mypage')} className="rounded-lg bg-[#000000] px-4 py-2 text-sm font-bold text-[#EEEEEE] transition hover:opacity-90">
            {adminMode ? '관리자 버전 관리로 돌아가기' : '마이페이지로 이동'}
          </button>
        </div>
      }
    >
      <FinalReportView
        report={reportQuery.data}
        reportBasePath={reportBasePath}
        adminMode={adminMode}
      />

      {!adminMode && (
        <WeaknessPracticeCta report={reportQuery.data} />
      )}
    </ReportLayout>
  );
}
