import { useParams, useNavigate } from 'react-router-dom';
import { useInterviewerFeedback } from '../../hooks/useReport';
import ReportLayout from '../../components/report/ReportLayout';
import StateView from '../../components/report/StateView';
import Badge from '../../components/report/Badge';
import Tag from '../../components/report/Tag';

export default function InterviewerFeedbackPage() {
  const { sessionId = 'latest' } = useParams();
  const navigate = useNavigate();
  const feedback = useInterviewerFeedback(sessionId);

  const back = (
    <button onClick={() => navigate(`/report/${sessionId}/overall`)} className="rounded-xl bg-[#173a1f] px-5 py-3 text-sm font-bold text-white hover:bg-[#0f2a16]">
      Overall로 돌아가기
    </button>
  );

  if (feedback.isLoading || feedback.isError || !feedback.data) {
    return (
      <ReportLayout title="면접관 피드백" subtitle="면접 시 사용한 면접관 페르소나 기준으로 피드백을 제공합니다." action={back}>
        <StateView isLoading={feedback.isLoading} isError={feedback.isError} error={feedback.error} onRetry={feedback.refetch} />
      </ReportLayout>
    );
  }

  const f = feedback.data;

  return (
    <ReportLayout title="면접관 피드백" subtitle="면접 시 사용한 면접관 페르소나 기준으로 피드백을 제공합니다." action={back}>
      {/* 페르소나 카드 */}
      <section className="flex flex-col justify-between gap-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm md:flex-row md:items-center">
        <div className="flex items-center gap-4">
          <div className="text-4xl">{f.persona.avatar_emoji}</div>
          <div>
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-extrabold text-slate-900">선택한 면접관: {f.persona.short_name}</h3>
              <Badge tone="soft">Total Score {f.persona.total_score}점</Badge>
            </div>
            <p className="mt-1 text-sm text-slate-500">실제 면접관처럼 {f.persona.short_name} 중심으로 봅니다.</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {f.persona.tags.map((t) => <Tag key={t} label={t} variant="strength" />)}
            </div>
          </div>
        </div>
        <p className="max-w-xs text-sm text-slate-400">다른 면접관을 선택해 페르소나별 피드백/모의질문 차이를 비교해 보세요.</p>
      </section>

      <section className="mt-4 grid gap-4 lg:grid-cols-3">
        {/* 피드백 요약 */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="mb-3 text-base font-bold text-slate-900">피드백 요약</h3>
          <p className="text-sm leading-relaxed text-slate-600">{f.summary}</p>
          <div className="mt-4">
            <div className="mb-2 text-xs font-bold text-slate-500">추천 답변 구조</div>
            <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
              {f.recommended_answer_structure.map((s, i) => (
                <span key={s} className="flex items-center gap-1.5">
                  <span className="rounded-md bg-slate-100 px-2 py-1 font-medium text-slate-700">{s}</span>
                  {i < f.recommended_answer_structure.length - 1 && <span className="text-slate-300">→</span>}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* 좋았던 점 */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="mb-3 text-base font-bold text-slate-900">좋았던 점</h3>
          <ul className="space-y-2.5">
            {f.pros.map((p, i) => (
              <li key={i} className="flex gap-2 text-sm text-slate-600">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-green-500" />{p}
              </li>
            ))}
          </ul>
        </div>

        {/* 보완할 점 */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="mb-3 text-base font-bold text-slate-900">보완할 점</h3>
          <ul className="space-y-2.5">
            {f.cons.map((c, i) => (
              <li key={i} className="flex gap-2 text-sm text-slate-600">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-red-400" />{c}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mt-4 grid gap-4 lg:grid-cols-3">
        {/* 예상 질문 */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
          <h3 className="mb-4 text-base font-bold text-slate-900">{f.persona.short_name} 예상 질문</h3>
          <ul className="space-y-3">
            {f.expected_questions.map((q) => (
              <li key={q.order} className="flex gap-3 text-sm">
                <span className="h-fit shrink-0 rounded-md bg-[#173a1f] px-2 py-0.5 text-xs font-bold text-white">Q{q.order}</span>
                <span className="text-slate-600">{q.text}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* 다음 연습으로 연결 */}
        <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div>
            <h3 className="mb-2 text-base font-bold text-slate-900">다음 연습으로 연결</h3>
            <p className="text-sm text-slate-500">이전과 동일한 세팅으로 연습을 바로 시작합니다.</p>
          </div>
          <button onClick={() => navigate(`/report/${sessionId}/roadmap`)} className="mt-4 w-full rounded-xl bg-green-500 px-5 py-3 text-sm font-bold text-white hover:bg-green-600">
            {f.persona.short_name} 피드백으로 답변 연습
          </button>
        </div>
      </section>
    </ReportLayout>
  );
}
