import { useParams, useNavigate } from 'react-router-dom';
import { useFinalReport } from '../../hooks/useReport';
import ReportLayout from '../../components/report/ReportLayout';
import StateView from '../../components/report/StateView';
import RadarChart from '../../components/report/charts/RadarChart';
import ScoreBreakdownBars from '../../components/report/charts/ScoreBreakdownBars';
import { RADAR_AXES, metricDescription } from '../../utils/reportLabels';

function buildRadar(r) {
  const metrics = r.score_summary?.metrics;
  if (metrics) {
    return RADAR_AXES
      .filter((a) => metrics[a.metric] != null && metrics[a.metric] !== '')
      .map((a) => {
        const score = Number(metrics[a.metric]);
        return Number.isFinite(score) ? { axis: a.axis, label: a.label, score } : null;
      })
      .filter(Boolean);
  }
  return (r.score_detail?.radar ?? []).filter((item) => item?.score != null);
}

export default function OverallScorePage() {
  const { sessionId = 'latest' } = useParams();
  const navigate = useNavigate();
  const report = useFinalReport(sessionId);

  const back = (
    <button onClick={() => navigate(`/report/${sessionId}`)} className="rounded-xl bg-[#253900] px-5 py-3 text-sm font-bold text-[#EEEEEE] hover:opacity-90">
      리포트로 돌아가기
    </button>
  );

  if (report.isLoading || report.isError || !report.data) {
    return (
      <ReportLayout title="Overall Score 상세" subtitle="종합 점수의 산출 근거와 4축 분석, 항목별 점수 Breakdown을 확인합니다." action={back}>
        <StateView isLoading={report.isLoading} isError={report.isError} error={report.error} onRetry={report.refetch} />
      </ReportLayout>
    );
  }

  const r = report.data;
  const persona = r.evaluation_metadata;
  const metrics = r.score_summary.metrics;
  const interp = r.score_interpretation || {};
  const radarData = buildRadar(r);
  const categories = Array.isArray(r.score_detail?.categories)
    ? r.score_detail.categories
    : [];

  // 실제 radarData에 포함된 평가 축만 표시한다.
  const criteriaLabels = radarData.map((d) => d.axis);

  const rawGroundingScore = metrics?.grounding_score;
  const groundingScore =
    rawGroundingScore === null ||
    rawGroundingScore === undefined ||
    rawGroundingScore === ''
      ? null
      : Number(rawGroundingScore);

  const breakdownRows = [
    ...categories.map((c) => ({ label: c.label, score: c.score, description: metricDescription(c.label) })),
    ...(Number.isFinite(groundingScore)
      ? [{ label: '근거 제시', score: Math.round(groundingScore), description: metricDescription('근거 제시') }]
      : []),
    { label: '전체 요약', score: r.score_summary?.overall_score },
  ]
    .filter(
      (row) =>
        row.score !== null &&
        row.score !== undefined &&
        row.score !== '',
    )
    .map((row) => ({
      ...row,
      score: Math.round(Number(row.score)),
    }))
    .filter((row) => Number.isFinite(row.score));

  return (
    <ReportLayout title="Overall Score 상세" subtitle="종합 점수의 산출 근거와 4축 분석, 항목별 점수 Breakdown을 확인합니다." action={back}>
      {/* 평가 기준 안내 */}
      <div className="mb-4 flex flex-wrap items-center gap-2 rounded-xl border border-[rgba(0,0,0,0.08)] bg-[#EEEEEE] px-4 py-2.5">
        <span className="mr-1 shrink-0 text-xs text-[rgba(0,0,0,0.45)]">이 세션 평가 기준</span>
        {criteriaLabels.map((c) => (
          <span key={c} className="rounded-md bg-[#253900]/10 px-2 py-0.5 text-xs font-semibold text-[#253900]">{c}</span>
        ))}
      </div>
      <section className="grid gap-4 lg:grid-cols-3">
        {/* 좌측: OVERALL + 페르소나 (Radar 카드 높이에 맞춰 stretch) */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-1 flex-col justify-between rounded-xl bg-[#253900] p-6 text-[#EEEEEE] shadow-sm">
            <div className="text-[11px] font-bold tracking-wide text-[#EEEEEE]/70">OVERALL SCORE</div>
            <div className="mt-2 text-5xl font-extrabold">{r.score_summary?.overall_score ?? '-'} 점</div>
            <div className="mt-3 text-xs text-[#EEEEEE]/70">
              {r.score_summary?.overall_score == null ? '평가 결과가 없습니다.' : '답변 구조와 기술 깊이가 종합 점수를 견인했습니다.'}
            </div>
          </div>
          <button
            type="button"
            onClick={() => navigate(`/report/${sessionId}/feedback`)}
            className="flex flex-1 w-full items-center gap-4 rounded-xl bg-[#08CB00] p-6 text-left text-[#EEEEEE] shadow-sm transition-colors hover:opacity-90"
          >
            <div className="text-6xl leading-none">{persona.avatar_emoji}</div>
            <div className="flex-1">
              <div className="text-xs font-semibold text-[#EEEEEE]/80">면접관 페르소나</div>
              <div className="text-2xl font-extrabold leading-tight">{persona.short_name}<br />면접관</div>
              <div className="mt-2 text-xs font-semibold text-[#EEEEEE]/90">면접관 피드백 보기 →</div>
            </div>
          </button>
        </div>

        {/* 중앙: 레이더 */}
        <div className="rounded-xl border border-[rgba(0,0,0,0.1)] bg-[#EEEEEE] p-6 shadow-sm">
          <h3 className="text-base font-bold text-[#000000]">
            Radar Analysis{radarData.length > 0 ? ` (${radarData.length}-Axis)` : ''}
          </h3>
          <p className="mb-2 text-xs text-[rgba(0,0,0,0.45)]">
            현재 면접 점수를 이전 세션 평균과 평가 축별로 비교합니다.
          </p>
          {radarData.length >= 3 ? (
            <RadarChart data={radarData} />
          ) : (
            <p className="mt-8 text-sm text-[rgba(0,0,0,0.55)]">
              레이더 점수 데이터가 없습니다.
            </p>
          )}
        </div>

        {/* 우측: Score Breakdown */}
        <div className="rounded-xl border border-[rgba(0,0,0,0.1)] bg-[#EEEEEE] p-6 shadow-sm">
          <h3 className="mb-4 text-base font-bold text-[#000000]">Score Breakdown</h3>
          <ScoreBreakdownBars rows={breakdownRows} />
        </div>
      </section>

      {/* 점수 해석 */}
      <section className="mt-4 rounded-xl border border-[rgba(0,0,0,0.1)] bg-[#EEEEEE] p-6 shadow-sm">
        <h3 className="mb-4 text-base font-bold text-[#000000]">점수 해석</h3>
        <div className="space-y-3 text-sm">
          <div className="flex gap-3">
            <span className="h-fit shrink-0 rounded-md bg-[#08CB00]/15 px-2 py-0.5 text-xs font-bold text-[#253900]">강점</span>
            <p className="text-[rgba(0,0,0,0.6)]">{interp.strength}</p>
          </div>
          <div className="flex gap-3">
            <span className="h-fit shrink-0 rounded-md bg-[#000000]/15 px-2 py-0.5 text-xs font-bold text-[#000000]">보완</span>
            <p className="text-[rgba(0,0,0,0.6)]">{interp.improvement}</p>
          </div>
          <div className="flex gap-3">
            <span className="h-fit shrink-0 rounded-md bg-[#08CB00]/10 px-2 py-0.5 text-xs font-bold text-[#253900]">추천</span>
            <p className="text-[rgba(0,0,0,0.6)]">{interp.recommendation}</p>
          </div>
        </div>
      </section>
    </ReportLayout>
  );
}
