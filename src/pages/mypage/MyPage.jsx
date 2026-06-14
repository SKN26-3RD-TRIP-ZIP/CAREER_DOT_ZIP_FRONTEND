import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMe, logout as logoutApi } from '../../api/authApi';
import { mypageApi } from '../../api/mypageApi';
import { EmptyState, Button, Card, LoadingState, PageShell, StatCard, StatusBadge, Alert } from '../../components/ui/DemoLayout';
import { useAuthStore } from '../../store/authStore';
import { useJdStore } from '../../store/jdStore';
import { getOverallScore } from '../../utils/reportSummary';
import { getRecommendedQuestions } from '../../utils/recommendedQuestions';
import MiniGrowthBars from '../../components/report/charts/MiniGrowthBars';
import { reportApi } from '../../api/reportApi';

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

// 정규화된 리포트에서 약점 목록 추출 (다양한 스키마 fallback)
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

function statusTone(status) {
  const normalized = String(status || '').toLowerCase();
  if (normalized.includes('complete') || normalized.includes('success')) return 'success';
  if (normalized.includes('fail') || normalized.includes('error')) return 'danger';
  if (normalized.includes('progress') || normalized.includes('pending')) return 'warning';
  return 'default';
}

function InfoRow({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-slate-100 py-2 last:border-0">
      <span className="text-sm text-slate-500">{label}</span>
      <span className="text-right text-sm font-semibold text-slate-900">{value || '-'}</span>
    </div>
  );
}

function MyPage() {
  const navigate = useNavigate();
  const { jdData } = useJdStore();
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const clearAuth = useAuthStore((s) => s.logout);
  const [history, setHistory] = useState([]);
  const [historyTotal, setHistoryTotal] = useState(0);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState('');
  const [summary, setSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [summaryError, setSummaryError] = useState('');
  const [reports, setReports] = useState([]);
  const [latestReportDetail, setLatestReportDetail] = useState(null);

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
        setHistoryError('면접 기록을 불러오지 못했습니다.');
      })
      .finally(() => {
        if (active) setHistoryLoading(false);
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

  const handleLogout = async () => {
    try {
      await logoutApi();
    } catch {
      // 서버 세션이 이미 만료되어도 클라이언트 토큰은 정리합니다.
    } finally {
      clearAuth();
      navigate('/auth/login?logout=1');
    }
  };

  const profile = safeJsonParse(localStorage.getItem('userProfile'));
  const docs = safeJsonParse(localStorage.getItem('userDocuments'));

  const latestJd = summary?.latest_jd || null;
  const latestResume = summary?.latest_resume || null;
  const latestJdCreatedAt = latestJd?.created_at || summary?.latest_jd_created_at;
  const latestJdStatus = latestJd?.analysis_status || summary?.latest_jd_analysis_status;
  const latestResumeUpdatedAt = latestResume?.updated_at || summary?.latest_resume_updated_at;

  const latestReport = useMemo(
    () => summary?.latest_report || reports[0] || history.find((rec) => rec.has_report) || null,
    [summary, reports, history],
  );
  const latestReportScore = latestReport ? getOverallScore(latestReport, null) : null;
  const latestReportSessionId = reportSessionId(latestReport);
  const latestHistory = history[0] || null;
  const interviewCount = summary?.interview_count ?? historyTotal;

  // 최근 리포트 상세 조회(약점/추천질문용) — list 응답엔 약점이 없어 detail 을 별도 조회
  useEffect(() => {
    if (!latestReportSessionId) {
      setLatestReportDetail(null);
      return;
    }
    let active = true;
    reportApi
      .getFinalReport(latestReportSessionId)
      .then((data) => {
        if (active) setLatestReportDetail(data);
      })
      .catch(() => {
        if (active) setLatestReportDetail(null);
      });
    return () => {
      active = false;
    };
  }, [latestReportSessionId]);

  // 성장 추이: /reports 점수를 시간순 정렬해 막대로 표시
  const growthPoints = useMemo(
    () =>
      [...reports]
        .filter((r) => getOverallScore(r, null) != null)
        .sort(
          (a, b) =>
            new Date(a.generated_at || a.created_at || 0) - new Date(b.generated_at || b.created_at || 0),
        )
        .map((r) => ({
          session_id: reportSessionId(r),
          overall_score: Number(getOverallScore(r, 0)) || 0,
          label: fmtDate(r.generated_at || r.created_at),
        })),
    [reports],
  );
  const growthDelta =
    growthPoints.length >= 2
      ? growthPoints[growthPoints.length - 1].overall_score - growthPoints[growthPoints.length - 2].overall_score
      : null;

  const weaknesses = useMemo(() => extractWeaknesses(latestReportDetail), [latestReportDetail]);
  const recommendedQuestions = useMemo(() => getRecommendedQuestions(weaknesses, 3), [weaknesses]);

  const profileTags = [
    profile?.careerType === 'career' ? '경력' : '신입',
    profile?.majorType === 'non_major' ? '비전공자' : '전공자',
    JOB_LABEL[profile?.jobRole] ?? profile?.jobRole,
    profile?.yearsExp && profile.yearsExp !== '0' ? `${profile.yearsExp}년차` : '신입',
  ].filter(Boolean);

  return (
    <PageShell
      title="마이페이지"
      description="최근 로그인, 활동 요약, 저장된 자료, 면접 리포트를 한 곳에서 확인합니다."
      actions={
        <Button type="button" variant="secondary" onClick={handleLogout}>
          로그아웃
        </Button>
      }
    >
      <div className="grid gap-5 lg:grid-cols-[1.1fr_1.9fr]">
        <div className="space-y-5">
          <Card className="p-5">
            <p className="text-sm font-bold text-slate-900">사용자 정보</p>
            <div className="mt-4 space-y-1">
              <InfoRow label="이름" value={user?.name || '이름 없음'} />
              <InfoRow label="이메일" value={user?.email} />
              <InfoRow label="최근 로그인" value={fmtDateTime(user?.last_login)} />
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {profileTags.length ? (
                profileTags.map((tag) => <StatusBadge key={tag}>{tag}</StatusBadge>)
              ) : (
                <StatusBadge>프로필 미등록</StatusBadge>
              )}
            </div>
            <Button type="button" variant="secondary" className="mt-4 w-full" onClick={() => navigate('/profile')}>
              프로필 등록/수정
            </Button>
          </Card>

          <Card className="p-5">
            <p className="text-sm font-bold text-slate-900">다음 행동</p>
            <div className="mt-4 grid gap-2">
              <Button type="button" onClick={() => navigate('/jd')}>
                JD 등록하기
              </Button>
              <Button type="button" variant="secondary" onClick={() => navigate('/input/documents')}>
                이력서 업로드하기
              </Button>
              <Button type="button" variant="secondary" onClick={() => navigate('/interview/setup')}>
                면접 시작하기
              </Button>
            </div>
          </Card>
        </div>

        <div className="space-y-5">
          {summaryLoading ? (
            <LoadingState title="활동 요약을 불러오는 중입니다" />
          ) : summaryError ? (
            <Alert tone="danger">{summaryError}</Alert>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
              <StatCard label="총 면접" value={interviewCount ?? 0} helper="완료/진행 기록 기준" />
              <StatCard label="JD" value={summary?.jd_count ?? 0} helper={latestJdCreatedAt ? `최근 ${fmtDate(latestJdCreatedAt)}` : '등록 없음'} />
              <StatCard label="이력서" value={summary?.resume_count ?? 0} helper={latestResumeUpdatedAt ? `최근 ${fmtDate(latestResumeUpdatedAt)}` : '등록 없음'} />
              <StatCard label="자소서" value={summary?.cover_letter_count ?? 0} helper="저장된 자소서" />
              <StatCard label="프로젝트" value={summary?.project_count ?? 0} helper="프로젝트 경험" />
            </div>
          )}

          <section className="grid gap-5 lg:grid-cols-2">
            <Card className="p-5">
              <div className="mb-4 flex items-center justify-between gap-2">
                <p className="text-sm font-bold text-slate-900">최근 리포트</p>
                {latestReportScore != null && <StatusBadge tone="success">{latestReportScore}점</StatusBadge>}
              </div>
              {latestReport ? (
                <div className="space-y-3">
                  <p className="text-sm text-slate-600">
                    {latestReportScore != null ? '가장 최근 생성된 리포트 점수를 확인했습니다.' : '최근 리포트가 있으나 점수 정보는 아직 없습니다.'}
                  </p>
                  <p className="text-xs text-slate-500">{fmtDateTime(latestReport.generated_at || latestReport.created_at)}</p>
                  {latestReportSessionId ? (
                    <Button type="button" onClick={() => navigate(`/report/${latestReportSessionId}`)}>
                      상세 리포트 보기
                    </Button>
                  ) : (
                    <Alert tone="warning">상세 이동에 필요한 session_id가 응답에 없습니다.</Alert>
                  )}
                </div>
              ) : (
                <EmptyState
                  title="아직 생성된 리포트가 없습니다"
                  description="면접을 완료하면 최근 리포트와 점수가 이곳에 표시됩니다."
                  actionLabel="면접 시작하기"
                  actionTo="/interview/setup"
                />
              )}
            </Card>

            <Card className="p-5">
              <p className="mb-4 text-sm font-bold text-slate-900">최근 JD / 이력서</p>
              {latestJd || jdData ? (
                <div className="rounded-lg bg-slate-50 p-4">
                  <p className="text-sm font-semibold text-slate-900">
                    {latestJd ? `${latestJd.company_name} · ${latestJd.position}` : `${jdData?.company_name || '회사명 없음'} · ${jdData?.position || '직무명 없음'}`}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <StatusBadge tone={statusTone(latestJdStatus)}>{latestJdStatus || '분석 상태 없음'}</StatusBadge>
                    <StatusBadge>{latestJdCreatedAt ? fmtDate(latestJdCreatedAt) : '등록일 없음'}</StatusBadge>
                  </div>
                </div>
              ) : (
                <EmptyState title="등록된 JD가 없습니다" description="JD를 등록하면 최근 회사명과 직무가 표시됩니다." actionLabel="JD 등록" actionTo="/jd" />
              )}

              <div className="mt-3 rounded-lg bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-900">{latestResume?.name || docs?.resume?.slice?.(0, 32) || '최근 이력서 없음'}</p>
                <p className="mt-1 text-xs text-slate-500">최근 수정 {fmtDateTime(latestResumeUpdatedAt)}</p>
              </div>
            </Card>
          </section>

          <Card className="p-5">
            <div className="mb-4 flex items-center justify-between gap-2">
              <p className="text-sm font-bold text-slate-900">최근 면접 기록</p>
              {latestHistory?.status && <StatusBadge tone={statusTone(latestHistory.status)}>{latestHistory.status}</StatusBadge>}
            </div>
            {historyLoading ? (
              <LoadingState title="면접 기록을 불러오는 중입니다" />
            ) : historyError ? (
              <Alert tone="danger">{historyError}</Alert>
            ) : history.length === 0 ? (
              <EmptyState
                title="아직 면접 기록이 없습니다"
                description="JD와 이력서를 선택해 첫 면접을 시작해보세요."
                actionLabel="면접 시작하기"
                actionTo="/interview/setup"
              />
            ) : (
              <div className="space-y-2">
                {history.slice(0, 5).map((rec) => (
                  <div key={rec.session_id} className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {rec.interview_type || '면접'} {rec.persona ? `· ${rec.persona}` : ''}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {fmtDateTime(rec.created_at)} · 질문 {rec.question_count ?? 0} / 답변 {rec.answer_count ?? 0}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {rec.has_report && rec.overall_score != null && <StatusBadge tone="success">{rec.overall_score}점</StatusBadge>}
                      {rec.has_report && (
                        <Button type="button" variant="secondary" onClick={() => navigate(`/report/${rec.session_id}`)}>
                          결과 보기
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <section className="grid gap-5 lg:grid-cols-2">
            <Card className="p-5">
              <div className="mb-4 flex items-center justify-between gap-2">
                <p className="text-sm font-bold text-slate-900">성장 추이</p>
                {growthDelta != null && (
                  <StatusBadge tone={growthDelta >= 0 ? 'success' : 'danger'}>
                    {growthDelta >= 0 ? `▲ ${growthDelta}` : `▼ ${Math.abs(growthDelta)}`}점
                  </StatusBadge>
                )}
              </div>
              {growthPoints.length >= 2 ? (
                <div className="space-y-3">
                  <MiniGrowthBars points={growthPoints} />
                  <p className="text-xs text-slate-500">
                    최근 {Math.min(growthPoints.length, 5)}개 리포트 점수 추이입니다.
                    {growthDelta != null && (growthDelta >= 0 ? ' 직전 대비 상승했어요.' : ' 직전 대비 하락했어요.')}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-slate-500">리포트가 2개 이상 쌓이면 성장 추이가 표시됩니다.</p>
              )}
            </Card>

            <Card className="p-5">
              <p className="mb-4 text-sm font-bold text-slate-900">약점 TOP 3 &amp; 추천 연습 질문</p>
              {weaknesses.length ? (
                <>
                  <div className="flex flex-wrap gap-2">
                    {weaknesses.slice(0, 3).map((w, i) => (
                      <StatusBadge key={i} tone="warning">
                        {typeof w === 'string' ? w : w.label || w.tag || '약점'}
                      </StatusBadge>
                    ))}
                  </div>
                  <ul className="mt-4 space-y-2">
                    {recommendedQuestions.map((rq, i) => (
                      <li key={i} className="rounded-lg bg-slate-50 px-3 py-2 text-sm leading-6 text-slate-700">
                        Q. {rq.question}
                      </li>
                    ))}
                  </ul>
                </>
              ) : (
                <p className="text-sm text-slate-500">리포트가 생성되면 약점과 추천 연습 질문이 표시됩니다.</p>
              )}
            </Card>
          </section>
        </div>
      </div>
    </PageShell>
  );
}

export default MyPage;
