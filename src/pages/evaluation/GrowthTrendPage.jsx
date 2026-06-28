import { useParams, useNavigate } from 'react-router-dom';
import { useGrowthTrend } from '../../hooks/useReport';
import ReportLayout from '../../components/report/ReportLayout';
import StateView from '../../components/report/StateView';
import GrowthLineChart from '../../components/report/charts/GrowthLineChart';

function Stat({ label, value }) {
  return (
    <div>
      <div className="mb-1 text-sm text-[rgba(0,0,0,0.45)]">{label}</div>
      <div className="text-3xl font-extrabold text-[#000000]">{value}</div>
    </div>
  );
}

export default function GrowthTrendPage({ adminMode = false }) {
  const { sessionId = 'latest' } = useParams();
  const navigate = useNavigate();
  const growth = useGrowthTrend();

  const back = (
    <button onClick={() => navigate(`${adminMode ? '/report-admin' : '/report'}/${sessionId}`)} className="rounded-xl bg-[#253900] px-5 py-3 text-sm font-bold text-[#EEEEEE] hover:opacity-90">
      리포트로 돌아가기
    </button>
  );

  if (growth.isLoading || growth.isError || !growth.data) {
    return (
      <ReportLayout title="최근 성장 추이" subtitle="여러 면접 세션의 점수 변화와 보완 항목 개선 흐름을 확인합니다." action={back} adminMode={adminMode}>
        <StateView isLoading={growth.isLoading} isError={growth.isError} error={growth.error} onRetry={growth.refetch} />
      </ReportLayout>
    );
  }

  const g = growth.data;

  return (
    <ReportLayout title="최근 성장 추이" subtitle="여러 면접 세션의 점수 변화와 보완 항목 개선 흐름을 확인합니다." action={back} adminMode={adminMode}>
      <section className="grid grid-cols-2 gap-6 rounded-xl border border-[rgba(0,0,0,0.1)] bg-[#EEEEEE] p-6 shadow-sm md:grid-cols-4">
        <Stat label="첫 세션" value={`${g.first_score}점`} />
        <Stat label="최근 세션" value={`${g.latest_score}점`} />
        <Stat label="상승폭" value={`${g.delta > 0 ? '+' : ''}${g.delta}점`} />
        <Stat label="개선된 보완점" value={`${g.improved_count}개`} />
      </section>

      <section className="mt-4 grid gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-[rgba(0,0,0,0.1)] bg-[#EEEEEE] p-6 shadow-sm lg:col-span-2">
          <h3 className="mb-4 text-lg font-bold text-[#000000]">Growth Track Chart</h3>
          <GrowthLineChart points={g.points} />
        </div>
        <div className="rounded-xl border border-[rgba(0,0,0,0.1)] bg-[#EEEEEE] p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-bold text-[#000000]">성장 인사이트</h3>
          <ul className="space-y-4">
            {g.insights.map((t, i) => (
              <li key={i} className="flex gap-2 text-sm leading-relaxed text-[rgba(0,0,0,0.6)]">
                <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#08CB00]" />
                {t}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mt-4 flex gap-3 rounded-xl border border-[rgba(0,0,0,0.1)] bg-[#EEEEEE] p-5 shadow-sm">
        {/* TODO: 인터뷰(면접 진행) 화면으로 연결 — 담당/연결 주체 확정 후 onClick 지정. 현재는 의도적으로 연결 끊어둠 */}
        <button className="rounded-xl bg-[#08CB00] px-5 py-3 text-sm font-bold text-[#EEEEEE] hover:opacity-90">연습하러 가기</button>
        <button className="rounded-xl bg-[#253900] px-5 py-3 text-sm font-bold text-[#EEEEEE] hover:opacity-90">추이 리포트 저장</button>
      </section>
    </ReportLayout>
  );
}
