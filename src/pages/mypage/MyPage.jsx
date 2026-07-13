import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMe } from '../../api/authApi';
import { mypageApi } from '../../api/mypageApi';
import { reportApi } from '../../api/reportApi';
import { Alert, Button, Card, DashboardCard, EmptyState, LoadingState, PageShell, StatCard, StatusBadge } from '../../components/ui/DemoLayout';
import { useAuthStore } from '../../store/authStore';
import { getOverallScore } from '../../utils/reportSummary';
import { getRecommendedQuestions } from '../../utils/recommendedQuestions';

const fmtDateTime = (v) => (v ? new Date(v).toLocaleString('ko-KR') : '기록 없음');
const fmtDate = (v) => (v ? new Date(v).toLocaleDateString('ko-KR') : '기록 없음');

const JOB_LABEL = {
  backend: '백엔드 개발자',
  frontend: '프론트엔드 개발자',
  fullstack: '풀스택 개발자',
  data: '데이터 엔지니어',
  ai_ml: 'AI/ML 엔지니어',
  devops: 'DevOps 엔지니어',
  pm: 'PM/기획자',
  etc: '기타',
};

const formatScoreDelta = (value) => {
  if (value == null) return null;
  const rounded = Number(value.toFixed(1));
  return `${rounded > 0 ? '+' : ''}${rounded.toLocaleString('ko-KR', {
    minimumFractionDigits: Number.isInteger(rounded) ? 0 : 1,
    maximumFractionDigits: 1,
  })}`;
};

const roundOverallScore = (value) => {
  if (value == null) return null;
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? Math.round(numberValue) : null;
};

function safeJsonParse(value) {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function reportSessionId(report) {
  return report?.session_id ?? report?.interview_session_id ?? report?.session?.session_id ?? null;
}

function extractWeaknesses(report) {
  if (!report) return [];
  const tags = Array.isArray(report.dynamically_triggered_tags) ? report.dynamically_triggered_tags : [];
  const fromTags = tags.filter((t) => t.kind === 'weakness').map((t) => t.label || t.raw).filter(Boolean);
  if (fromTags.length) return fromTags;
  const candidates = [
    report?.score_interpretation?.improvement,
    report?.summary?.weaknesses,
    report?.raw_data?.summary?.weaknesses,
    report?.weaknesses,
  ];
  for (const c of candidates) {
    if (Array.isArray(c) && c.length) return c.filter(Boolean);
    if (typeof c === 'string' && c.trim()) return [c.trim()];
  }
  return [];
}

function InfoRow({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-[rgba(0,0,0,0.12)] py-2 last:border-0">
      <span className="text-sm font-bold text-[#253900]">{label}</span>
      <span className="text-right text-sm font-black text-[#000000]">{value || '-'}</span>
    </div>
  );
}

function GrowthBars({ points }) {
  const latest = points.slice(-5);
  const max = Math.max(...latest.map((p) => p.overall_score), 100);

  return (
    <div className="flex h-44 items-end gap-3 rounded-lg border border-[rgba(0,0,0,0.12)] p-4">
      {latest.map((point) => (
        <div key={point.session_id || point.label} className="flex flex-1 flex-col items-center gap-2">
          <div className="flex h-28 w-full items-end border border-[rgba(0,0,0,0.12)]">
            <div className="w-full bg-[#08CB00]" style={{ height: `${Math.max(8, (point.overall_score / max) * 100)}%` }} />
          </div>
          <strong className="text-xs">{point.overall_score}</strong>
        </div>
      ))}
    </div>
  );
}

function MyPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const [history, setHistory] = useState([]);
  const [historyTotal, setHistoryTotal] = useState(0);
  const [summary, setSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [summaryError, setSummaryError] = useState('');
  const [reports, setReports] = useState([]);
  const [latestReportDetail, setLatestReportDetail] = useState(null);
  const [latestReportDetailError, setLatestReportDetailError] = useState('');

  useEffect(() => {
    if (!localStorage.getItem('access_token')) {
      navigate('/auth/login');
      return;
    }

    let active = true;

    getMe()
      .then((res) => {
        if (active) setUser(res.data);
      })
      .catch(() => {});

    mypageApi
      .getSummary()
      .then((data) => {
        if (active) setSummary(data);
      })
      .catch((err) => {
        if (!active) return;
        if (err.response?.status === 401) {
          navigate('/auth/login');
          return;
        }
        setSummaryError('활동 요약을 불러오지 못했습니다.');
      })
      .finally(() => {
        if (active) setSummaryLoading(false);
      });

    mypageApi
      .getInterviewHistory()
      .then((data) => {
        if (!active) return;
        const results = Array.isArray(data?.results) ? data.results : [];
        setHistory(results);
        setHistoryTotal(data?.total ?? results.length);
      })
      .catch((err) => {
        if (!active) return;
        if (err.response?.status === 401) {
          navigate('/auth/login');
          return;
        }
      });

    mypageApi
      .getReportList()
      .then((data) => {
        if (active) setReports(Array.isArray(data?.results) ? data.results : []);
      })
      .catch(() => {
        if (active) setReports([]);
      });

    return () => {
      active = false;
    };
  }, [navigate, setUser]);

  const profile = safeJsonParse(localStorage.getItem('userProfile')) || {};
  const latestReport = useMemo(
    () => summary?.latest_report || reports[0] || history.find((rec) => rec.has_report) || null,
    [summary, reports, history],
  );
  const latestReportScore = latestReport ? roundOverallScore(getOverallScore(latestReport, null)) : null;
  const latestReportSessionId = reportSessionId(latestReport);
  const interviewCount = summary?.interview_count ?? historyTotal;
  const pointSummaryBalance = summary?.point_balance ?? 0;

  useEffect(() => {
    if (!latestReportSessionId) {
      setLatestReportDetail(null);
      setLatestReportDetailError('');
      return;
    }
    let active = true;
    setLatestReportDetailError('');
    reportApi
      .getFinalReport(latestReportSessionId)
      .then((data) => {
        if (active) setLatestReportDetail(data);
      })
      .catch(() => {
        if (!active) return;
        setLatestReportDetail(null);
        setLatestReportDetailError('리포트 상세를 불러오지 못했습니다.');
      });
    return () => {
      active = false;
    };
  }, [latestReportSessionId]);

  const growthPoints = useMemo(
    () =>
      [...reports]
        .filter((r) => !r?.is_mock && getOverallScore(r, null) != null)
        .sort((a, b) => new Date(a.generated_at || a.created_at || 0) - new Date(b.generated_at || b.created_at || 0))
        .map((r) => ({
          session_id: reportSessionId(r),
          overall_score: roundOverallScore(getOverallScore(r, null)),
          label: fmtDate(r.generated_at || r.created_at),
        })),
    [reports],
  );
  const growthDelta =
    growthPoints.length >= 2
      ? growthPoints[growthPoints.length - 1].overall_score - growthPoints[growthPoints.length - 2].overall_score
      : null;
  const growthDeltaLabel = formatScoreDelta(growthDelta);

  const weaknesses = useMemo(() => extractWeaknesses(latestReportDetail), [latestReportDetail]);
  const recommendedQuestions = useMemo(() => getRecommendedQuestions(weaknesses, 3), [weaknesses]);

  const desiredJob = JOB_LABEL[profile.jobRole] ?? profile.jobRole ?? '미등록';
  const careerLabel = profile.careerType === 'career' ? '경력' : '신입';
  const majorLabel = profile.majorType === 'non_major' ? '비전공' : '전공';

  return (
    <PageShell
      activeNav="마이페이지"
      title={`${profile.name || user?.name || '회원'} 님의 마이페이지`}
      description="최근 면접 리포트와 약점 기반 연습 흐름을 한 화면에서 확인하세요."
    >
      <div className="grid gap-5 lg:grid-cols-[0.9fr_2.1fr]">
        <div className="space-y-5">
          <Card className="p-5">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full border border-[rgba(0,0,0,0.12)] bg-[#08CB00] text-2xl font-black">
                {(profile.name || user?.name || user?.email || '?').slice(0, 1)}
              </div>
              <div>
                <h2 className="text-2xl font-black text-[#253900]">{profile.name || user?.name || '이름 없음'}</h2>
                <p className="mt-1 text-sm font-semibold">{user?.email || '-'}</p>
              </div>
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              <StatusBadge>{careerLabel}</StatusBadge>
              <StatusBadge>{majorLabel}</StatusBadge>
              <StatusBadge>{desiredJob}</StatusBadge>
            </div>
            <div className="mt-5">
              <InfoRow label="최근 로그인" value={fmtDateTime(user?.last_login)} />
              <InfoRow label="경력 구분" value={careerLabel} />
              <InfoRow label="희망 직무" value={desiredJob} />
            </div>
          </Card>

          <DashboardCard>
            <h2 className="text-lg font-black text-[#253900]">추천 다음 행동</h2>
            <div className="mt-4 grid gap-2">
              <Button type="button" onClick={() => navigate('/analysis')}>
                다시 면접하기
              </Button>
              <Button type="button" variant="secondary" onClick={() => navigate('/jd')}>
                JD 등록하기
              </Button>
              <Button type="button" variant="secondary" onClick={() => navigate('/input/documents')}>
                이력서 업로드하기
              </Button>
            </div>
          </DashboardCard>
        </div>

        <div className="space-y-5">
          {summaryLoading ? (
            <LoadingState title="활동 요약을 불러오는 중입니다" />
          ) : summaryError ? (
            <Alert tone="danger">{summaryError}</Alert>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
              <StatCard label="총 면접 수" value={interviewCount ?? 0} />
              <StatCard label="등록 JD 수" value={summary?.jd_count ?? 0} />
              <StatCard label="등록 이력서 수" value={summary?.resume_count ?? 0} />
              <StatCard label="자소서 수" value={summary?.cover_letter_count ?? 0} />
              <StatCard label="프로젝트 수" value={summary?.project_count ?? 0} />
              <StatCard label="포인트" value={`${Number(pointSummaryBalance).toLocaleString('ko-KR')}P`} />
            </div>
          )}

          <section className="grid gap-5 lg:grid-cols-[1fr_0.9fr]">
            <DashboardCard>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-black text-[#253900]">최근 리포트</h2>
                  <p className="mt-2 text-sm leading-6">{latestReport ? '가장 최근 생성된 면접 리포트입니다.' : '면접을 완료하면 최근 리포트가 표시됩니다.'}</p>
                </div>
                {latestReportScore != null && <strong className="text-5xl font-black text-[#000000]">{latestReportScore}</strong>}
              </div>
              {latestReport ? (
                <div className="mt-5 space-y-4">
                  {latestReportScore == null && <Alert tone="warning">평가 결과가 없습니다.</Alert>}
                  {latestReportDetailError && <Alert tone="danger">{latestReportDetailError}</Alert>}
                  <InfoRow label="생성일" value={fmtDateTime(latestReport.generated_at || latestReport.created_at)} />
                  <InfoRow label="강점 요약" value={latestReportDetail?.summary?.strengths?.[0] || latestReportDetail?.score_interpretation?.strength || '리포트 상세에서 확인 가능'} />
                  <InfoRow label="약점 요약" value={weaknesses[0] || '리포트 상세에서 확인 가능'} />
                  {latestReportSessionId ? (
                    <Button type="button" onClick={() => navigate(`/report/${latestReportSessionId}`)}>
                      리포트 상세 보기
                    </Button>
                  ) : (
                    <Alert tone="warning">상세 이동에 필요한 session_id가 응답에 없습니다.</Alert>
                  )}
                </div>
              ) : (
                <EmptyState title="아직 생성된 리포트가 없습니다" description="면접을 완료하면 점수와 요약이 이곳에 표시됩니다." actionLabel="면접 시작하기" actionTo="/analysis" />
              )}
            </DashboardCard>

            <DashboardCard>
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-xl font-black text-[#253900]">성장 추이</h2>
                {growthDeltaLabel != null && <StatusBadge tone={growthDelta >= 0 ? 'success' : 'warning'}>직전 대비 {growthDeltaLabel}점</StatusBadge>}
              </div>
              <div className="mt-5">
                {growthPoints.length >= 2 ? (
                  <>
                    <GrowthBars points={growthPoints} />
                    <p className="mt-3 text-sm leading-6">최근 {Math.min(growthPoints.length, 5)}개 리포트 점수 변화입니다.</p>
                  </>
                ) : (
                  <EmptyState title="성장 추이 데이터가 부족합니다" description="리포트가 2개 이상 쌓이면 변화가 표시됩니다." />
                )}
              </div>
            </DashboardCard>
          </section>

          <section className="grid gap-5 lg:grid-cols-2">
            <DashboardCard>
              <h2 className="text-xl font-black text-[#253900]">약점 TOP 3</h2>
              {weaknesses.length ? (
                <div className="mt-4 grid gap-3">
                  {weaknesses.slice(0, 3).map((w, i) => (
                    <div key={`${w}-${i}`} className="rounded-lg border border-[rgba(0,0,0,0.12)] p-4">
                      <span className="text-xs font-black text-[#253900]">TOP {i + 1}</span>
                      <p className="mt-2 font-black">{typeof w === 'string' ? w : w.label || w.tag || '약점'}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState title="표시할 약점이 아직 없습니다" description="최근 리포트가 생성되면 개선 항목이 표시됩니다." />
              )}
            </DashboardCard>

            <DashboardCard>
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-xl font-black text-[#253900]">추천 연습 질문</h2>
                <Button type="button" variant="secondary" onClick={() => navigate('/analysis')}>
                  다시 면접하기
                </Button>
              </div>
              {recommendedQuestions.length ? (
                <ul className="mt-4 space-y-3">
                  {recommendedQuestions.map((rq, i) => (
                    <li key={i} className="rounded-lg border border-[rgba(0,0,0,0.12)] p-4 text-sm font-semibold leading-6">
                      Q. {rq.question}
                    </li>
                  ))}
                </ul>
              ) : (
                <EmptyState title="추천 질문을 준비 중입니다" description="약점 데이터가 생기면 맞춤 질문을 제안합니다." />
              )}
            </DashboardCard>
          </section>

        </div>
      </div>
    </PageShell>
  );
}

export default MyPage;
