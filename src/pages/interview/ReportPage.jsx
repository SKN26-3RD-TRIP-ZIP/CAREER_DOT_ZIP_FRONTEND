import { useLocation, useNavigate } from 'react-router-dom';
import { Button, Card, EmptyState, PageShell } from '../../components/ui/DemoLayout';
import { useInterviewStore } from '../../store/interviewStore';
import { getOverallScore, getReportScoreDetail } from '../../utils/reportSummary';

function ReportPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { sessionId } = useInterviewStore();
  const apiReport = location.state?.reportData;

  if (!apiReport) {
    return (
      <PageShell title="면접 결과 리포트" description="최종 리포트는 세션 ID 기준의 실제 리포트 화면에서 확인합니다.">
        <Card className="p-6">
          <EmptyState
            title="표시할 리포트 데이터가 없습니다"
            description="면접을 완료하면 최종 리포트가 생성됩니다. 세션이 있다면 실제 리포트 화면으로 이동할 수 있습니다."
            actionLabel={sessionId ? '최종 리포트로 이동' : '면접 시작하기'}
            actionTo={sessionId ? `/report/${sessionId}` : '/analysis'}
          />
        </Card>
      </PageShell>
    );
  }

  const score = getOverallScore(apiReport, null);
  const detail = getReportScoreDetail(apiReport);
  const strengths = [detail.strength].flat().filter(Boolean);
  const weaknesses = [detail.weakness].flat().filter(Boolean);
  const improvements = [detail.improvement].flat().filter(Boolean);

  return (
    <PageShell title="면접 결과 리포트" description="현재 세션에서 전달된 리포트 데이터를 간단히 확인합니다.">
      <div className="grid gap-5">
        <Card className="p-6 text-center">
          <p className="text-sm font-bold text-[rgba(0,0,0,0.5)]">종합 점수</p>
          <p className="mt-2 text-5xl font-bold text-[#08CB00]">{score ?? '-'}</p>
        </Card>
        <Card className="p-6">
          <p className="text-sm font-bold text-[#253900]">강점</p>
          <p className="mt-2 text-sm text-[rgba(0,0,0,0.6)]">{strengths.join(', ') || '강점 정보가 없습니다.'}</p>
        </Card>
        <Card className="p-6">
          <p className="text-sm font-bold text-[#253900]">개선 필요</p>
          <p className="mt-2 text-sm text-[rgba(0,0,0,0.6)]">{weaknesses.join(', ') || improvements.join(', ') || '개선 정보가 없습니다.'}</p>
        </Card>
        <div className="flex flex-wrap gap-2">
          {sessionId && (
            <Button type="button" onClick={() => navigate(`/report/${sessionId}`)}>
              상세 리포트 보기
            </Button>
          )}
          <Button type="button" variant="secondary" onClick={() => navigate('/mypage')}>
            마이페이지
          </Button>
          <Button type="button" variant="secondary" onClick={() => navigate('/analysis')}>
            다시 면접하기
          </Button>
        </div>
      </div>
    </PageShell>
  );
}

export default ReportPage;
