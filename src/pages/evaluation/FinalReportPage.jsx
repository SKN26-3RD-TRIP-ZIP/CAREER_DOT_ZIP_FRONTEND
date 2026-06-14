import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useFinalReport } from '../../hooks/useReport';
import ReportLayout from '../../components/report/ReportLayout';
import StateView from '../../components/report/StateView';
import { getOverallScore } from '../../utils/reportSummary';

function toList(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(Boolean);
  if (typeof value === 'string') return value ? [value] : [];
  return [];
}

function collectTags(report, kind) {
  const tags = Array.isArray(report?.dynamically_triggered_tags) ? report.dynamically_triggered_tags : [];
  return tags.filter((t) => t.kind === kind).map((t) => t.label || t.raw).filter(Boolean);
}

function Section({ title, children, className = '' }) {
  return (
    <section className={`rounded-lg border border-slate-200 bg-white p-5 shadow-sm ${className}`}>
      <h2 className="text-base font-bold text-slate-950">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function ListBlock({ items, emptyText, tone = 'default' }) {
  const toneClass = {
    default: 'bg-slate-50 text-slate-700',
    strength: 'bg-emerald-50 text-emerald-800',
    weakness: 'bg-amber-50 text-amber-800',
  }[tone];

  if (!items.length) return <p className="text-sm text-slate-500">{emptyText}</p>;
  return (
    <ul className="space-y-2">
      {items.map((item, idx) => (
        <li key={`${item}-${idx}`} className={`rounded-lg px-4 py-3 text-sm leading-6 ${toneClass}`}>
          {typeof item === 'string' ? item : item?.description || item?.label || JSON.stringify(item)}
        </li>
      ))}
    </ul>
  );
}

export default function FinalReportPage() {
  const { sessionId = 'latest' } = useParams();
  const navigate = useNavigate();
  const reportQuery = useFinalReport(sessionId);

  const report = reportQuery.data;
  const overallScore = getOverallScore(report, null);

  const strengths = useMemo(() => {
    const tagItems = collectTags(report, 'strength');
    return tagItems.length ? tagItems : toList(report?.score_interpretation?.strength);
  }, [report]);

  const weaknesses = useMemo(() => {
    const tagItems = collectTags(report, 'weakness');
    return tagItems.length ? tagItems : toList(report?.score_interpretation?.improvement);
  }, [report]);

  const recommendations = useMemo(
    () => toList(report?.score_interpretation?.recommendation || report?.score_detail?.raw?.improvement),
    [report],
  );

  if (reportQuery.isLoading || reportQuery.isError || !report) {
    return (
      <ReportLayout title="최종 리포트" subtitle="면접 결과를 불러와 종합 점수와 개선 포인트를 확인합니다.">
        <StateView isLoading={reportQuery.isLoading} isError={reportQuery.isError} error={reportQuery.error} onRetry={reportQuery.refetch} />
      </ReportLayout>
    );
  }

  const categories = Array.isArray(report.score_detail?.categories) ? report.score_detail.categories : [];
  const questions = Array.isArray(report.score_detail?.questions) ? report.score_detail.questions : [];

  return (
    <ReportLayout
      title="최종 리포트"
      subtitle="면접 결과를 바탕으로 종합 점수, 강점, 약점, 추천 개선사항을 확인합니다."
      action={
        <button type="button" onClick={() => navigate('/mypage')} className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-bold text-white hover:bg-slate-800">
          마이페이지로 이동
        </button>
      }
    >
      <div className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
        <section className="rounded-lg border border-emerald-200 bg-emerald-50 p-6 shadow-sm">
          <p className="text-sm font-bold text-emerald-800">종합 점수</p>
          <div className="mt-4 flex items-end gap-2">
            <span className="text-6xl font-bold text-emerald-700">{overallScore ?? '-'}</span>
            <span className="pb-2 text-lg font-semibold text-emerald-800">점</span>
          </div>
          <p className="mt-4 text-sm leading-6 text-emerald-900">
            {report.score_summary?.comment || '면접 요약이 아직 제공되지 않았습니다.'}
          </p>
        </section>

        <Section title="면접 요약">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {categories.length ? (
              categories.map((item) => (
                <div key={item.key || item.label} className="rounded-lg bg-slate-50 p-4">
                  <p className="text-xs font-semibold text-slate-500">{item.label}</p>
                  <p className="mt-2 text-2xl font-bold text-slate-950">{item.score ?? 0}</p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">{item.description}</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500">세부 점수 정보가 없습니다.</p>
            )}
          </div>
        </Section>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-3">
        <Section title="강점">
          <ListBlock items={strengths} emptyText="표시할 강점 정보가 없습니다." tone="strength" />
        </Section>
        <Section title="약점">
          <ListBlock items={weaknesses} emptyText="표시할 약점 정보가 없습니다." tone="weakness" />
        </Section>
        <Section title="추천 개선사항">
          <ListBlock items={recommendations} emptyText="추천 개선사항이 아직 없습니다." />
        </Section>
      </div>

      <Section title="질문/답변 요약" className="mt-5">
        {questions.length ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-xs text-slate-500">
                  <th className="py-2 pr-4 font-semibold">번호</th>
                  <th className="py-2 pr-4 font-semibold">질문</th>
                  <th className="py-2 pr-4 font-semibold">개선 액션</th>
                  <th className="py-2 text-right font-semibold">점수</th>
                </tr>
              </thead>
              <tbody>
                {questions.map((q, idx) => (
                  <tr key={q.question_id || idx} className="border-b border-slate-50 last:border-0">
                    <td className="whitespace-nowrap py-3 pr-4 font-semibold text-slate-700">Q{q.order || idx + 1}</td>
                    <td className="max-w-xl py-3 pr-4 text-slate-600">{q.question_text || '질문 내용 없음'}</td>
                    <td className="py-3 pr-4 text-slate-500">{q.improvement_action || '개선 액션 없음'}</td>
                    <td className="py-3 text-right font-bold text-slate-900">{q.score ?? '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-slate-500">질문별 평가 데이터가 없습니다.</p>
        )}
      </Section>

      <section className="mt-5 flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-950">다음 액션</h2>
          <p className="mt-1 text-sm text-slate-500">리포트를 확인한 뒤 다시 면접하거나 다른 JD로 준비를 이어갈 수 있습니다.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => navigate('/mypage')} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
            마이페이지
          </button>
          <button type="button" onClick={() => navigate('/interview/setup')} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700">
            다시 면접하기
          </button>
          <button type="button" onClick={() => navigate('/jd')} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
            JD 다시 선택하기
          </button>
        </div>
      </section>
    </ReportLayout>
  );
}
