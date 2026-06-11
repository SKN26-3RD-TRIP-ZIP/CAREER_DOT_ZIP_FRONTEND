import { useParams, useNavigate } from 'react-router-dom';
import { useFinalReport, useGrowthTrend } from '../../hooks/useReport';
import ReportLayout from '../../components/report/ReportLayout';
import ScoreCard from '../../components/report/ScoreCard';
import Tag from '../../components/report/Tag';
import StateView from '../../components/report/StateView';
import MiniGrowthBars from '../../components/report/charts/MiniGrowthBars';
import { scoreBadgeClass } from '../../utils/score';

export default function FinalReportPage() {
  const { sessionId = 'latest' } = useParams();
  const navigate = useNavigate();
  const report = useFinalReport(sessionId);
  const growth = useGrowthTrend();
  const base = `/report/${sessionId}`;

  if (report.isLoading || report.isError || !report.data) {
    return (
      <ReportLayout title="최종 리포트" subtitle="면접 결과를 한눈에 확인하고 다음 액션으로 이어가세요.">
        <StateView isLoading={report.isLoading} isError={report.isError} error={report.error} onRetry={report.refetch} />
      </ReportLayout>
    );
  }

  const r = report.data;
  const strengths = (r.dynamically_triggered_tags || []).filter((t) => t.kind === 'strength');
  const weaknesses = (r.dynamically_triggered_tags || []).filter((t) => t.kind === 'weakness');

  return (
    <ReportLayout
      title="최종 리포트"
      subtitle="면접 결과를 한눈에 확인하고 다음 액션으로 이어가세요."
      action={<button className="rounded-xl bg-[#253900] px-5 py-3 text-sm font-bold text-white hover:bg-[#1A2900]">마이페이지에 저장</button>}
    >
      {/* 스코어 카드 5개 */}
      <section className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
        <ScoreCard
          highlight
          label="OVERALL SCORE"
          value={`${r.score_summary.overall_score} 점`}
          caption={r.score_summary.comment}
          onClick={() => navigate(`${base}/overall`)}
        />
        {r.score_detail.categories.map((c) => (
          <ScoreCard key={c.key} label={c.label} value={`${c.score}%`} caption={c.description} progress={c.score} />
        ))}
      </section>

      {/* 강점 / 보완 키워드 */}
      <section className="mt-4 grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-[#08CB00]/25 bg-[#08CB00]/5 p-5 shadow-sm">
          <h3 className="mb-3 text-sm font-bold text-slate-800">강점 키워드</h3>
          <div className="flex flex-wrap gap-2">
            {strengths.map((t) => <Tag key={t.label} label={t.label} variant="strength" />)}
          </div>
        </div>
        <div className="rounded-xl border border-[#E5342B]/25 bg-[#E5342B]/5 p-5 shadow-sm">
          <h3 className="mb-3 text-sm font-bold text-slate-800">보완 키워드</h3>
          <div className="flex flex-wrap gap-2">
            {weaknesses.map((t) => <Tag key={t.label} label={t.label} variant="weakness" />)}
          </div>
        </div>
      </section>

      {/* 질문별 AI 평가 — 백엔드 summary에 질문별 데이터가 없으면 숨김(고도화 시 노출) */}
      {r.score_detail.questions?.length > 0 && (
      <section className="mt-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="mb-4 text-base font-bold text-slate-900">질문별 AI 평가</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs text-slate-400">
                <th className="py-2 pr-4 font-medium">질문 종류</th>
                <th className="py-2 pr-4 font-medium">질문 내용</th>
                <th className="py-2 pr-4 font-medium">개선 액션</th>
                <th className="py-2 text-right font-medium">점수</th>
              </tr>
            </thead>
            <tbody>
              {r.score_detail.questions.map((q) => (
                <tr key={q.question_id} className="border-b border-slate-50 last:border-0">
                  <td className="whitespace-nowrap py-3 pr-4 font-semibold text-slate-700">Q{q.order} {q.question_type}</td>
                  <td className="max-w-md truncate py-3 pr-4 text-slate-600">{q.question_text}</td>
                  <td className="py-3 pr-4 text-slate-500">{q.improvement_action}</td>
                  <td className="py-3 text-right">
                    <span className={`inline-block rounded-md px-2.5 py-1 text-xs font-bold ${scoreBadgeClass(q.score)}`}>{q.score}점</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      )}

      {/* 하단: 미니 성장 추이 + 액션 */}
      <section className="mt-4 flex flex-col justify-between gap-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm lg:flex-row lg:items-center">
        {growth.data?.points?.length ? (
          <div>
            <h3 className="mb-3 text-sm font-bold text-slate-800">최근 세션 성장 추이</h3>
            <button onClick={() => navigate(`${base}/growth`)}><MiniGrowthBars points={growth.data.points} /></button>
          </div>
        ) : null}
        <div className="flex flex-wrap gap-3">
          <button onClick={() => navigate(`${base}/roadmap`)} className="rounded-xl bg-[#08CB00] px-5 py-3 text-sm font-bold text-white hover:bg-[#06A800]">보완 답변 연습하기</button>
          <button className="rounded-xl bg-[#253900] px-5 py-3 text-sm font-bold text-white hover:bg-[#1A2900]">리포트 PDF 저장</button>
          <button className="rounded-xl bg-slate-100 px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-200">마이페이지에서 관리</button>
        </div>
      </section>
    </ReportLayout>
  );
}
