import { useParams, useNavigate } from 'react-router-dom';
import { useFinalReport } from '../../hooks/useReport';
import ReportLayout from '../../components/report/ReportLayout';
import StateView from '../../components/report/StateView';
import RadarChart from '../../components/report/charts/RadarChart';
import ScoreBreakdownBars from '../../components/report/charts/ScoreBreakdownBars';

// 5축 레이더 ↔ 백엔드 score_summary.metrics 키 매핑
// (BEI / CBI / Grounding / Speech / Technical(고도화 SBERT))
const RADAR_AXES = [
  { key: 'bei_logic_score', axis: 'BEI', label: '행동 기반' },
  { key: 'cbi_competency_score', axis: 'CBI', label: '역량 기반' },
  { key: 'grounding_score', axis: 'Grounding', label: '근거 제시' },
  { key: 'speech_delivery_score', axis: 'Speech', label: '전달력' },
  { key: 'technical_score', axis: 'Technical', label: '기술 깊이' },
];

function buildRadar(r) {
  const metrics = r.score_summary?.metrics;
  if (metrics) {
    return RADAR_AXES.map((a) => ({ axis: a.axis, label: a.label, score: metrics[a.key] ?? 0 }));
  }
  return r.score_detail?.radar ?? [];
}

export default function OverallScorePage() {
  const { sessionId = 'latest' } = useParams();
  const navigate = useNavigate();
  const report = useFinalReport(sessionId);

  const back = (
    <button onClick={() => navigate(`/report/${sessionId}`)} className="rounded-xl bg-[#173a1f] px-5 py-3 text-sm font-bold text-white hover:bg-[#0f2a16]">
      리포트로 돌아가기
    </button>
  );

  if (report.isLoading || report.isError || !report.data) {
    return (
      <ReportLayout title="Overall Score 상세" subtitle="종합 점수의 산출 근거와 5축 분석, 항목별 점수 Breakdown을 확인합니다." action={back}>
        <StateView isLoading={report.isLoading} isError={report.isError} error={report.error} onRetry={report.refetch} />
      </ReportLayout>
    );
  }

  const r = report.data;
  const persona = r.evaluation_metadata;
  const interp = r.score_interpretation || {};
  const radarData = buildRadar(r);
  const breakdownRows = [
    ...r.score_detail.categories.map((c) => ({ label: c.label, score: c.score })),
    { label: '전체 요약', score: r.score_summary.overall_score },
  ];

  return (
    <ReportLayout title="Overall Score 상세" subtitle="종합 점수의 산출 근거와 5축 분석, 항목별 점수 Breakdown을 확인합니다." action={back}>
      <section className="grid gap-4 lg:grid-cols-3">
        {/* 좌측: OVERALL + 페르소나 */}
        <div className="space-y-4">
          <div className="rounded-xl bg-[#173a1f] p-6 text-white shadow-sm">
            <div className="text-[11px] font-bold tracking-wide text-white/70">OVERALL SCORE</div>
            <div className="mt-2 text-5xl font-extrabold">{r.score_summary.overall_score} 점</div>
            <div className="mt-3 text-xs text-white/70">답변 구조와 기술 깊이가 종합 점수를 견인했습니다.</div>
          </div>
          <button
            type="button"
            onClick={() => navigate(`/report/${sessionId}/feedback`)}
            className="flex w-full items-center gap-4 rounded-xl bg-green-500 p-6 text-left text-white shadow-sm transition-colors hover:bg-green-600"
          >
            <div className="text-4xl">{persona.avatar_emoji}</div>
            <div className="flex-1">
              <div className="text-xs font-semibold text-white/80">면접관 페르소나</div>
              <div className="text-2xl font-extrabold leading-tight">{persona.short_name}<br />면접관</div>
              <div className="mt-2 text-xs font-semibold text-white/90">면접관 피드백 보기 →</div>
            </div>
          </button>
        </div>

        {/* 중앙: 레이더 */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-base font-bold text-slate-900">Radar Analysis (5-Axis)</h3>
          <p className="mb-2 text-xs text-slate-400">현재 면접 점수의 이전 세션 평균을 5축에 비교합니다.</p>
          <RadarChart data={radarData} />
        </div>

        {/* 우측: Score Breakdown */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-base font-bold text-slate-900">Score Breakdown</h3>
          <ScoreBreakdownBars rows={breakdownRows} />
        </div>
      </section>

      {/* 점수 해석 */}
      <section className="mt-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-base font-bold text-slate-900">점수 해석</h3>
        <div className="space-y-3 text-sm">
          <div className="flex gap-3">
            <span className="h-fit shrink-0 rounded-md bg-green-100 px-2 py-0.5 text-xs font-bold text-green-700">강점</span>
            <p className="text-slate-600">{interp.strength}</p>
          </div>
          <div className="flex gap-3">
            <span className="h-fit shrink-0 rounded-md bg-red-100 px-2 py-0.5 text-xs font-bold text-red-600">보완</span>
            <p className="text-slate-600">{interp.improvement}</p>
          </div>
          <div className="flex gap-3">
            <span className="h-fit shrink-0 rounded-md bg-green-50 px-2 py-0.5 text-xs font-bold text-green-700">추천</span>
            <p className="text-slate-600">{interp.recommendation}</p>
          </div>
        </div>
      </section>
    </ReportLayout>
  );
}
