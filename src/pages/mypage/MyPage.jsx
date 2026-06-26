import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMe, logout as logoutApi } from '../../api/authApi';
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

const POINT_TYPE_LABEL = {
  EARN: '적립',
  USE: '사용',
  REFUND: '환불',
  EXPIRE: '만료',
  ADMIN: '관리자 조정',
};

const POINT_REASON_LABEL = {
  REPORT_PURCHASE: '리포트 생성',
  REPORT_REFUND: '리포트 환불',
  ADMIN_ADJUST: '관리자 조정',
  SIGNUP_BONUS: '가입 보너스',
  EVENT_REWARD: '이벤트 적립',
};

const pointTypeTone = (type) => {
  if (type === 'EARN' || type === 'REFUND') return 'success';
  if (type === 'USE' || type === 'EXPIRE') return 'warning';
  if (type === 'ADMIN') return 'default';
  return 'default';
};

const formatPointAmount = (amount) => {
  const value = Number(amount || 0);
  return `${value > 0 ? '+' : ''}${value.toLocaleString('ko-KR')}P`;
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

function statusTone(status) {
  const normalized = String(status || '').toLowerCase();
  if (normalized.includes('complete') || normalized.includes('success')) return 'success';
  if (normalized.includes('fail') || normalized.includes('error')) return 'danger';
  if (normalized.includes('progress') || normalized.includes('pending')) return 'warning';
  return 'default';
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
  const [latestReportDetailError, setLatestReportDetailError] = useState('');
  const [pointBalance, setPointBalance] = useState(null);
  const [pointHistory, setPointHistory] = useState([]);
  const [pointTotal, setPointTotal] = useState(0);
  const [pointPage, setPointPage] = useState(1);
  const [pointLoading, setPointLoading] = useState(true);
  const [pointError, setPointError] = useState('');

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

  useEffect(() => {
    if (!localStorage.getItem('access_token')) return undefined;
    let active = true;
    setPointLoading(true);
    setPointError('');

    Promise.all([
      mypageApi.getPointBalance(),
      mypageApi.getPointHistory({ page: pointPage, size: 10 }),
    ])
      .then(([balanceData, historyData]) => {
        if (!active) return;
        const results = Array.isArray(historyData?.results) ? historyData.results : [];
        setPointBalance(balanceData);
        setPointHistory(results);
        setPointTotal(historyData?.total ?? results.length);
      })
      .catch((err) => {
        if (!active) return;
        if (err.response?.status === 401) {
          navigate('/auth/login');
          return;
        }
        setPointError('포인트 내역을 불러오지 못했습니다.');
      })
      .finally(() => {
        if (active) setPointLoading(false);
      });

    return () => {
      active = false;
    };
  }, [navigate, pointPage]);

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

  const profile = safeJsonParse(localStorage.getItem('userProfile')) || {};
  const latestReport = useMemo(
    () => summary?.latest_report || reports[0] || history.find((rec) => rec.has_report) || null,
    [summary, reports, history],
  );
  const latestReportScore = latestReport ? getOverallScore(latestReport, null) : null;
  const latestReportSessionId = reportSessionId(latestReport);
  const interviewCount = summary?.interview_count ?? historyTotal;
  const pointSummaryBalance = pointBalance?.point_balance ?? summary?.point_balance ?? 0;
  const latestEarn = pointHistory.find((item) => item.transaction_type === 'EARN');
  const latestUse = pointHistory.find((item) => item.transaction_type === 'USE');
  const latestRefund = pointHistory.find((item) => item.transaction_type === 'REFUND');
  const latestAdminAdjust = pointHistory.find((item) => item.transaction_type === 'ADMIN');
  const pointTotalPages = Math.max(1, Math.ceil(pointTotal / 10));

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
          overall_score: Number(getOverallScore(r, null)),
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

  const desiredJob = JOB_LABEL[profile.jobRole] ?? profile.jobRole ?? '미등록';
  const careerLabel = profile.careerType === 'career' ? '경력' : '신입';
  const majorLabel = profile.majorType === 'non_major' ? '비전공' : '전공';

  return (
    <PageShell
      activeNav="마이페이지"
      title={`${profile.name || user?.name || '회원'} 님의 성장 대시보드`}
      description="최근 면접 리포트와 약점 기반 연습 흐름을 한 화면에서 확인하세요."
      actions={
        <div className="flex flex-wrap gap-2">
          <Button type="button" onClick={() => navigate('/interview/setup')}>
            면접 시작하기
          </Button>
          <Button type="button" variant="secondary" onClick={() => navigate('/profile')}>
            내 정보 수정
          </Button>
          <Button type="button" variant="danger" onClick={handleLogout}>
            로그아웃
          </Button>
        </div>
      }
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
              <Button type="button" onClick={() => navigate('/interview/setup')}>
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
                <EmptyState title="아직 생성된 리포트가 없습니다" description="면접을 완료하면 점수와 요약이 이곳에 표시됩니다." actionLabel="면접 시작하기" actionTo="/interview/setup" />
              )}
            </DashboardCard>

            <DashboardCard>
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-xl font-black text-[#253900]">성장 추이</h2>
                {growthDelta != null && <StatusBadge tone={growthDelta >= 0 ? 'success' : 'warning'}>{growthDelta >= 0 ? `+${growthDelta}` : growthDelta}점</StatusBadge>}
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
                <Button type="button" variant="secondary" onClick={() => navigate('/interview/setup')}>
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

          <DashboardCard>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-black text-[#253900]">포인트 내역</h2>
                <p className="mt-1 text-sm font-semibold">현재 잔액 {Number(pointSummaryBalance).toLocaleString('ko-KR')}P</p>
              </div>
              <StatusBadge>{pointTotal}건</StatusBadge>
            </div>
            {pointLoading ? (
              <LoadingState title="포인트 내역을 불러오는 중입니다" />
            ) : pointError ? (
              <Alert tone="danger">{pointError}</Alert>
            ) : (
              <>
                <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <StatCard label="최근 적립" value={latestEarn ? formatPointAmount(latestEarn.amount) : '-'} />
                  <StatCard label="최근 사용" value={latestUse ? formatPointAmount(latestUse.amount) : '-'} />
                  <StatCard label="최근 환불" value={latestRefund ? formatPointAmount(latestRefund.amount) : '-'} />
                  <StatCard label="관리자 조정" value={latestAdminAdjust ? formatPointAmount(latestAdminAdjust.amount) : '-'} />
                </div>
                {pointHistory.length === 0 ? (
                  <EmptyState title="포인트 거래 내역이 없습니다" description="포인트가 적립되거나 사용되면 이곳에 표시됩니다." />
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[760px] border-collapse text-left text-sm">
                      <thead>
                        <tr className="border-b border-[rgba(0,0,0,0.12)] text-[#253900]">
                          <th className="py-3 pr-4">날짜</th>
                          <th className="py-3 pr-4">구분</th>
                          <th className="py-3 pr-4">사유</th>
                          <th className="py-3 pr-4">변동</th>
                          <th className="py-3 pr-4">거래 후 잔액</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pointHistory.map((item) => (
                          <tr key={item.point_history_id} className="border-b border-[rgba(0,0,0,0.12)]">
                            <td className="py-3 pr-4">{fmtDateTime(item.created_at)}</td>
                            <td className="py-3 pr-4">
                              <StatusBadge tone={pointTypeTone(item.transaction_type)}>
                                {POINT_TYPE_LABEL[item.transaction_type] || item.transaction_type}
                              </StatusBadge>
                            </td>
                            <td className="py-3 pr-4 font-semibold">
                              {POINT_REASON_LABEL[item.reason_code] || item.description || item.reason_code || '-'}
                            </td>
                            <td className="py-3 pr-4 font-black">{formatPointAmount(item.amount)}</td>
                            <td className="py-3 pr-4 font-black">{Number(item.balance_after ?? 0).toLocaleString('ko-KR')}P</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                <div className="mt-4 flex items-center justify-end gap-2">
                  <Button type="button" variant="secondary" disabled={pointPage <= 1} onClick={() => setPointPage((p) => Math.max(1, p - 1))}>
                    이전
                  </Button>
                  <span className="text-sm font-black">{pointPage} / {pointTotalPages}</span>
                  <Button type="button" variant="secondary" disabled={pointPage >= pointTotalPages} onClick={() => setPointPage((p) => Math.min(pointTotalPages, p + 1))}>
                    다음
                  </Button>
                </div>
              </>
            )}
          </DashboardCard>

          <DashboardCard>
            <div className="mb-4 flex items-center justify-between gap-2">
              <h2 className="text-xl font-black text-[#253900]">최근 면접 기록</h2>
              <StatusBadge>{historyTotal}건</StatusBadge>
            </div>
            {historyLoading ? (
              <LoadingState title="면접 기록을 불러오는 중입니다" />
            ) : historyError ? (
              <Alert tone="danger">{historyError}</Alert>
            ) : history.length === 0 ? (
              <EmptyState title="아직 면접 기록이 없습니다" description="JD와 이력서를 선택해 첫 면접을 시작해보세요." actionLabel="면접 시작하기" actionTo="/interview/setup" />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b border-[rgba(0,0,0,0.12)] text-[#253900]">
                      <th className="py-3 pr-4">날짜</th>
                      <th className="py-3 pr-4">면접 유형</th>
                      <th className="py-3 pr-4">상태</th>
                      <th className="py-3 pr-4">점수</th>
                      <th className="py-3 pr-4">동작</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.slice(0, 5).map((rec) => (
                      <tr key={rec.session_id} className="border-b border-[rgba(0,0,0,0.12)]">
                        <td className="py-3 pr-4">{fmtDateTime(rec.created_at)}</td>
                        <td className="py-3 pr-4 font-black">{rec.interview_type || '면접'}</td>
                        <td className="py-3 pr-4"><StatusBadge tone={statusTone(rec.status)}>{rec.status || '기록됨'}</StatusBadge></td>
                        <td className="py-3 pr-4">{rec.overall_score != null ? `${rec.overall_score}점` : '-'}</td>
                        <td className="py-3 pr-4">
                          {rec.has_report ? (
                            <Button type="button" variant="secondary" onClick={() => navigate(`/report/${rec.session_id}`)}>
                              리포트 보기
                            </Button>
                          ) : (
                            <span className="font-bold">리포트 없음</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </DashboardCard>
        </div>
      </div>
    </PageShell>
  );
}

export default MyPage;
