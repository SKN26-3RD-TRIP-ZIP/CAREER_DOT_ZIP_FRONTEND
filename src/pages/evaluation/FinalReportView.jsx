import { useMemo } from 'react';
import { AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cleanupPromptTestRun } from '../../api/adminApi';
import { getOverallScore } from '../../utils/reportSummary';
import RadarChart from '../../components/report/charts/RadarChart';
import { getRecommendedQuestions } from '../../utils/recommendedQuestions';
import Tooltip from '../../components/report/Tooltip';
import { metricDescription } from '../../utils/reportLabels';

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
    <section className={`rounded-2xl border border-[rgba(0,0,0,0.08)] bg-[#EEEEEE] p-5 shadow-[0_8px_28px_rgba(0,0,0,0.08)] ${className}`}>
      <h2 className="text-base font-bold text-[#000000]">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function ListBlock({ items, emptyText, tone = 'default' }) {
  const toneClass = {
    default: 'bg-[rgba(0,0,0,0.04)] text-[rgba(0,0,0,0.7)]',
    strength: 'bg-[rgba(8,203,0,0.1)] text-[#253900]',
    weakness: 'bg-[rgba(37,57,0,0.08)] text-[#253900]',
  }[tone];

  if (!items.length) return <p className="text-sm text-[rgba(0,0,0,0.5)]">{emptyText}</p>;
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

/**
 * 리포트 렌더 뷰. FinalReportPage / SharedReportPage 공용.
 *
 * props:
 *   report   — normalizeFinalReport 결과
 *   isShared — true 이면 공유 모드: 공유 버튼·다음 액션 섹션 숨김
 *   actionSlot — 헤더 우측 버튼 영역 (FinalReportPage에서 주입)
 */
export default function FinalReportView({ report, isShared = false, actionSlot = null, adminMode = false }) {
  const navigate = useNavigate();
  const overallScore = getOverallScore(report, null);
  const handleAdminReturn = async () => {
    if (!report?.session_id) {
      navigate('/admin/versions');
      return;
    }
    try {
      await cleanupPromptTestRun(report?.session_id);
    } catch (err) {
      console.warn('Failed to cleanup admin prompt test run', err);
    } finally {
      window.localStorage.removeItem('careerzip_admin_interview_test');
      navigate('/admin/versions');
    }
  };

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

  const recommendedQuestions = useMemo(() => getRecommendedQuestions(weaknesses, 3), [weaknesses]);

  const unscoredCount = Number(report?.evaluation_metadata?.unscored_answer_count) || 0;
  const answerCount = Number(report?.evaluation_metadata?.answer_count) || 0;
  const categories = Array.isArray(report?.score_detail?.categories) ? report.score_detail.categories : [];
  const questions = Array.isArray(report?.score_detail?.questions) ? report.score_detail.questions : [];
  const radarData = categories
    .filter((c) => c && c.score != null && !Number.isNaN(Number(c.score)))
    .map((c) => ({ axis: c.label, score: Number(c.score) || 0 }));

  return (
    <>
      {/* 헤더 액션 슬롯 (FinalReportPage 전용) */}
      {actionSlot}

      {/* 부분 채점 경고 배너 */}
      {unscoredCount > 0 && (
        <div className="mb-5 flex items-start gap-3 rounded-xl border border-[rgba(245,180,0,0.5)] bg-[rgba(245,180,0,0.12)] p-4">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-[#F5772B]" />
          <div>
            <p className="text-sm font-bold text-[#253900]">
              일부 답변 채점이 완료되지 않았습니다
              {answerCount > 0 ? ` (${unscoredCount}/${answerCount}개)` : ` (${unscoredCount}개)`}
            </p>
            <p className="mt-1 text-sm leading-6 text-[rgba(0,0,0,0.6)]">
              아래 점수와 요약은 채점에 성공한 답변만으로 산출되었습니다. 다시 시도하면 누락된 답변의 채점을 재시도합니다.
            </p>
          </div>
        </div>
      )}

      {/* 종합 점수 + 면접 요약 */}
      <div className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
        <section className="rounded-2xl border border-[rgba(8,203,0,0.4)] bg-[rgba(8,203,0,0.1)] p-6 shadow-[0_8px_28px_rgba(0,0,0,0.08)]">
          <p className="text-sm font-bold text-[#253900]">
            <Tooltip text="단순 평균이 아니라 면접관 페르소나별 가중치로 계산됩니다. 실전형 기준은 답변 구조 30%, 역량 측정 25%, 근거 제시 30%, 커뮤니케이션 15%입니다.">
              종합 점수
            </Tooltip>
          </p>
          <div className="mt-4 flex items-end gap-2">
            <span className="text-6xl font-bold text-[#08CB00]">{overallScore ?? '-'}</span>
            <span className="pb-2 text-lg font-semibold text-[#253900]">점</span>
          </div>
          {overallScore == null && (
            <p className="mt-3 rounded-lg bg-[#EEEEEE] px-4 py-3 text-sm font-bold text-[#253900]">
              평가 결과가 없습니다. 리포트가 생성되었지만 점수 데이터가 제공되지 않았습니다.
            </p>
          )}
          <p className="mt-4 text-sm leading-6 text-[#253900]">
            {report?.score_summary?.comment || '면접 요약이 아직 제공되지 않았습니다.'}
          </p>
        </section>

        <Section title="면접 요약">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {categories.length ? (
              categories.map((item) => (
                <div key={item.key || item.label} className="rounded-lg bg-[rgba(0,0,0,0.04)] p-4">
                  <p className="text-xs font-semibold text-[rgba(0,0,0,0.5)]">
                    <Tooltip text={metricDescription(item.label)}>{item.label}</Tooltip>
                  </p>
                  <p className="mt-2 text-2xl font-bold text-[#000000]">
                    {item.score != null ? `${item.score}점` : '해당 없음'}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-sm text-[rgba(0,0,0,0.5)]">세부 점수 정보가 없습니다.</p>
            )}
          </div>
        </Section>
      </div>

      {/* 레이더 차트 */}
      {radarData.length >= 3 && (
        <Section title="역량 레이더" className="mt-5">
          <RadarChart data={radarData} />
        </Section>
      )}

      {/* 강점 / 약점 / 추천 개선사항 */}
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

      {/* 질문/답변 요약 */}
      <Section title="질문/답변 요약" className="mt-5">
        {questions.length ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[rgba(0,0,0,0.08)] text-left text-xs text-[rgba(0,0,0,0.5)]">
                  <th className="py-2 pr-4 font-semibold">번호</th>
                  <th className="py-2 pr-4 font-semibold">질문</th>
                  <th className="py-2 pr-4 font-semibold">개선 액션</th>
                  <th className="py-2 text-right font-semibold">점수</th>
                </tr>
              </thead>
              <tbody>
                {questions.map((q, idx) => (
                  <tr key={q.question_id || idx} className="border-b border-[rgba(0,0,0,0.05)] last:border-0">
                    <td className="whitespace-nowrap py-3 pr-4 font-semibold text-[rgba(0,0,0,0.7)]">Q{q.order || idx + 1}</td>
                    <td className="max-w-xl py-3 pr-4 text-[rgba(0,0,0,0.6)]">{q.question_text || '질문 내용 없음'}</td>
                    <td className="py-3 pr-4 text-[rgba(0,0,0,0.5)]">{q.improvement_action || '개선 액션 없음'}</td>
                    <td className="py-3 text-right font-bold text-[#000000]">{q.score ?? '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-[rgba(0,0,0,0.5)]">질문별 평가 데이터가 없습니다.</p>
        )}
      </Section>

      {/* 약점 기반 추천 연습 질문 */}
      <Section title="약점 기반 추천 연습 질문" className="mt-5">
        {recommendedQuestions.length ? (
          <ul className="space-y-3">
            {recommendedQuestions.map((rq, idx) => (
              <li key={idx} className="rounded-lg bg-[rgba(0,0,0,0.04)] px-4 py-3">
                {rq.weakness && <p className="text-xs font-semibold text-[#253900]">약점: {rq.weakness}</p>}
                <p className="mt-1 text-sm leading-6 text-[rgba(0,0,0,0.7)]">Q. {rq.question}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-[rgba(0,0,0,0.5)]">추천 연습 질문이 없습니다.</p>
        )}
      </Section>

      {/* 다음 액션 — 공유 모드에서는 숨김 */}
      {!isShared && (
        <section className="no-print mt-5 flex flex-col gap-3 rounded-2xl border border-[rgba(0,0,0,0.08)] bg-[#EEEEEE] p-5 shadow-[0_8px_28px_rgba(0,0,0,0.08)] sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-bold text-[#000000]">다음 액션</h2>
            <p className="mt-1 text-sm text-[rgba(0,0,0,0.5)]">리포트를 확인한 뒤 다시 면접하거나 다른 JD로 준비를 이어갈 수 있습니다.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={adminMode ? handleAdminReturn : () => navigate('/mypage')} className="rounded-lg border border-[rgba(0,0,0,0.18)] px-4 py-2 text-sm font-semibold text-[rgba(0,0,0,0.7)] transition hover:bg-[rgba(0,0,0,0.04)]">
              마이페이지
            </button>
            <button type="button" onClick={adminMode ? handleAdminReturn : () => navigate('/interview/setup')} className="rounded-lg bg-[#08CB00] px-4 py-2 text-sm font-semibold text-[#EEEEEE] transition hover:opacity-90">
              다시 면접하기
            </button>
            <button type="button" onClick={adminMode ? handleAdminReturn : () => navigate('/jd')} className="rounded-lg border border-[rgba(0,0,0,0.18)] px-4 py-2 text-sm font-semibold text-[rgba(0,0,0,0.7)] transition hover:bg-[rgba(0,0,0,0.04)]">
              JD 다시 선택하기
            </button>
          </div>
        </section>
      )}
    </>
  );
}
