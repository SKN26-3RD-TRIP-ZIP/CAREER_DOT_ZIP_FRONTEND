import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useRoadmap } from '../../hooks/useReport';
import { useReportStore } from '../../store/reportStore';
import ReportLayout from '../../components/report/ReportLayout';
import StateView from '../../components/report/StateView';
import Badge from '../../components/report/Badge';
import { priorityLabel } from '../../utils/score';

function PriorityPill({ p }) {
  const cls = p === 'high' ? 'bg-[#08CB00] text-[#EEEEEE]' : 'bg-[rgba(0,0,0,0.1)] text-[rgba(0,0,0,0.6)]';
  return <span className={`rounded-full px-4 py-1.5 text-xs font-bold ${cls}`}>{priorityLabel(p)}</span>;
}

export default function RoadmapPage({ adminMode = false }) {
  const { sessionId = 'latest' } = useParams();
  const navigate = useNavigate();
  const roadmap = useRoadmap(sessionId);
  const { checkedRoadmapIds, selectedRoadmapId, toggleRoadmapChecked, setSelectedRoadmapId } = useReportStore();

  // 첫 항목 기본 선택
  useEffect(() => {
    if (roadmap.data?.items?.length && !selectedRoadmapId) {
      setSelectedRoadmapId(roadmap.data.items[0].id);
    }
  }, [roadmap.data, selectedRoadmapId, setSelectedRoadmapId]);

  const back = (
    <button onClick={() => navigate(`${adminMode ? '/report-admin' : '/report'}/${sessionId}`)} className="rounded-xl bg-[#253900] px-5 py-3 text-sm font-bold text-[#EEEEEE] hover:opacity-90">
      리포트로 돌아가기
    </button>
  );

  if (roadmap.isLoading || roadmap.isError || !roadmap.data) {
    return (
      <ReportLayout title="Next Learning Roadmap" subtitle="보완 답변 연습을 위한 학습 항목과 마감일, 예상 효과를 확인합니다." action={back} adminMode={adminMode}>
        <StateView isLoading={roadmap.isLoading} isError={roadmap.isError} error={roadmap.error} onRetry={roadmap.refetch} />
      </ReportLayout>
    );
  }

  const rm = roadmap.data;
  const selected = rm.items.find((i) => i.id === selectedRoadmapId) ?? rm.items[0];

  return (
    <ReportLayout title="Next Learning Roadmap" subtitle="보완 답변 연습을 위한 학습 항목과 마감일, 예상 효과를 확인합니다." action={back} adminMode={adminMode}>
      {/* 이번 주 우선순위 */}
      <section className="flex items-start justify-between gap-4 rounded-xl border border-[rgba(0,0,0,0.1)] bg-[#EEEEEE] p-6 shadow-sm">
        <div>
          <h3 className="mb-2 text-xl font-extrabold text-[#000000]">이번 주 우선순위</h3>
          <p className="max-w-3xl text-sm text-[rgba(0,0,0,0.5)]">{rm.week_priority_text}</p>
        </div>
        <Badge tone="soft">목표 {rm.target_delta_label}</Badge>
      </section>

      <section className="mt-4 grid gap-4 lg:grid-cols-3">
        {/* 체크리스트 */}
        <div className="rounded-xl border border-[rgba(0,0,0,0.1)] bg-[#EEEEEE] p-6 shadow-sm lg:col-span-2">
          <h3 className="mb-4 text-lg font-bold text-[#000000]">Next Learning Roadmap</h3>
          <ul className="space-y-3">
            {rm.items.map((it) => {
              const checked = checkedRoadmapIds.includes(it.id);
              return (
                <li
                  key={it.id}
                  onClick={() => setSelectedRoadmapId(it.id)}
                  className={`flex cursor-pointer items-center gap-4 rounded-xl px-4 py-4 transition-colors ${
                    selectedRoadmapId === it.id ? 'bg-[#08CB00]/10' : 'bg-[rgba(0,0,0,0.04)] hover:bg-[rgba(0,0,0,0.08)]'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleRoadmapChecked(it.id)}
                    onClick={(e) => e.stopPropagation()}
                    className="h-5 w-5 cursor-pointer accent-[#08CB00]"
                  />
                  <div className="min-w-0 flex-1">
                    <div className={`font-bold text-[#000000] ${checked ? 'text-[rgba(0,0,0,0.4)] line-through' : ''}`}>{it.title}</div>
                    <div className="text-sm text-[rgba(0,0,0,0.5)]">{it.description}</div>
                  </div>
                  <Badge tone="soft">D+{it.due_in_days}</Badge>
                  <PriorityPill p={it.priority} />
                </li>
              );
            })}
          </ul>
        </div>

        {/* 보완 답변 연습 패널 */}
        <div className="rounded-xl border border-[rgba(0,0,0,0.1)] bg-[#EEEEEE] p-6 shadow-sm">
          <h3 className="mb-1 text-lg font-bold text-[#000000]">보완 답변 연습</h3>
          <p className="mb-4 text-sm text-[rgba(0,0,0,0.5)]">선택한 로드맵 항목을 기반으로 실전형 꼬리질문과 모범 답변 구조를 제공합니다.</p>
          <div className="mb-5 rounded-xl bg-[rgba(0,0,0,0.04)] p-4">
            <div className="mb-2 text-sm font-bold text-[#000000]">오늘의 연습 질문</div>
            <p className="text-sm leading-relaxed text-[rgba(0,0,0,0.6)]">
              {selected?.title ? `[${selected.title}] ` : ''}{rm.practice_question}
            </p>
          </div>
          <button className="mb-3 w-full rounded-xl bg-[#08CB00] px-5 py-3 text-sm font-bold text-[#EEEEEE] hover:opacity-90">이 항목으로 답변 연습 시작</button>
          <button className="w-full rounded-xl bg-[#253900] px-5 py-3 text-sm font-bold text-[#EEEEEE] hover:opacity-90">로드맵 저장</button>
        </div>
      </section>
    </ReportLayout>
  );
}
