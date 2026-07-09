import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { reportApi } from '../../api/reportApi';
import { toUserMessage } from '../../api/errors';
import { isRealScore } from '../../utils/score';
import {
  growthState,
  validReportCount,
  overallChange,
  competencyRows,
  weaknessTags,
  DIRECTION_LABEL,
} from '../../utils/growth';
import {
  PageShell,
  Card,
  Button,
  Alert,
  StatCard,
  StatusBadge,
  LoadingState,
} from '../../components/ui/DemoLayout';

const DIRECTION_TONE = { improved: 'success', maintained: 'default', declined: 'warning', unknown: 'default' };
const showScore = (v) => (isRealScore(v) ? v : '-');
const fmtDelta = (d) => (d === null || d === undefined ? '-' : `${d > 0 ? '+' : ''}${d}`);

export default function GrowthDashboardPage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState('loading'); // loading | ready | error
  const [error, setError] = useState('');
  const [growth, setGrowth] = useState(null);

  const load = useCallback(async () => {
    setStatus('loading');
    setError('');
    try {
      const data = await reportApi.getGrowthTrend();
      setGrowth(data);
      setStatus('ready');
    } catch (err) {
      setError(toUserMessage(err, '성장 데이터를 불러오지 못했습니다.'));
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const summary = growth?.summary ?? {};
  const state = growthState(growth);
  const count = validReportCount(growth);
  const overall = overallChange(growth);
  const rows = competencyRows(growth);
  const tags = weaknessTags(growth);
  const history = growth?.interview_history ?? [];

  return (
    <PageShell
      activeNav="대시보드"
      title="성장 비교 · 개인화 대시보드"
      description="실제 평가가 완료된 면접 결과만으로 성장 추이를 비교합니다. (Mock·미평가·실패 결과 제외)"
      actions={
        <div className="flex flex-wrap gap-2">
          <Button type="button" onClick={() => navigate('/analysis')}>면접 시작하기</Button>
          <Button type="button" variant="secondary" onClick={() => navigate('/interview/question-packs')}>질문팩</Button>
          <Button type="button" variant="secondary" onClick={() => navigate('/mypage/terms')}>약관·동의 관리</Button>
        </div>
      }
    >
      {status === 'loading' && <LoadingState title="성장 데이터를 불러오는 중입니다" />}

      {status === 'error' && (
        <Card className="p-6">
          <Alert tone="danger">{error}</Alert>
          <Button type="button" className="mt-4" onClick={load}>다시 시도</Button>
        </Card>
      )}

      {status === 'ready' && (
        <div className="space-y-6">
          {/* 요약 카드 */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="프로필 완성도" value={summary.profile_completion != null ? `${summary.profile_completion}%` : '-'} />
            <StatCard label="포인트 잔액" value={summary.point_balance != null ? `${Number(summary.point_balance).toLocaleString('ko-KR')}P` : '-'} />
            <StatCard label="유효 면접 수" value={summary.completed_interview_count ?? 0} helper="평가 완료된 실제 면접" />
            <StatCard label="평균 점수" value={isRealScore(summary.average_interview_score) ? summary.average_interview_score : '-'} />
          </div>

          {/* 성장 비교 */}
          <Card className="p-6">
            <h2 className="text-lg font-black text-[#253900]">성장 비교</h2>

            {state === 'none' && (
              <div className="mt-4">
                <Alert tone="info">아직 분석 가능한 면접 결과가 없습니다.</Alert>
                <Button type="button" className="mt-4" onClick={() => navigate('/analysis')}>면접 시작하기</Button>
              </div>
            )}

            {state === 'insufficient' && (
              <div className="mt-4 space-y-3">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-[#253900]">최근 전체 점수</span>
                  <span className="text-2xl font-black text-[#08CB00]">{showScore(growth?.latest_score)}</span>
                </div>
                <StatusBadge tone="default">비교 데이터 부족</StatusBadge>
                <p className="text-sm text-[rgba(0,0,0,0.6)]">유효한 면접 결과가 1개입니다. 한 번 더 면접을 완료하면 변화량을 비교합니다.</p>
              </div>
            )}

            {state === 'version_mismatch' && (
              <div className="mt-4 space-y-3">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-[#253900]">최근 전체 점수</span>
                  <span className="text-2xl font-black text-[#08CB00]">{showScore(growth?.latest_score)}</span>
                </div>
                <Alert tone="warning">평가 기준이 달라 비교할 수 없습니다. (프롬프트/평가 버전 불일치)</Alert>
              </div>
            )}

            {state === 'comparable' && (
              <div className="mt-4 space-y-5">
                <div className="flex flex-wrap items-end gap-4">
                  <div>
                    <p className="text-xs font-bold text-[rgba(0,0,0,0.55)]">이전</p>
                    <p className="text-xl font-black text-[#253900]">{showScore(growth?.first_score ?? null)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[rgba(0,0,0,0.55)]">최근</p>
                    <p className="text-3xl font-black text-[#08CB00]">{showScore(growth?.latest_score)}</p>
                  </div>
                  <StatusBadge tone={DIRECTION_TONE[overall.direction]}>
                    전체 {DIRECTION_LABEL[overall.direction]} {overall.delta != null ? `(${fmtDelta(overall.delta)})` : ''}
                  </StatusBadge>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full min-w-[480px] text-sm">
                    <thead>
                      <tr className="border-b border-[rgba(0,0,0,0.12)] text-left text-xs font-bold text-[rgba(0,0,0,0.55)]">
                        <th className="py-2 pr-4">역량</th>
                        <th className="py-2 pr-4">이전</th>
                        <th className="py-2 pr-4">최근</th>
                        <th className="py-2 pr-4">변화</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((r) => (
                        <tr key={r.key} className="border-b border-[rgba(0,0,0,0.06)]">
                          <td className="py-2 pr-4 font-bold text-[#253900]">{r.label}</td>
                          <td className="py-2 pr-4">{showScore(r.previous)}</td>
                          <td className="py-2 pr-4">{showScore(r.current)}</td>
                          <td className="py-2 pr-4">
                            <StatusBadge tone={DIRECTION_TONE[r.direction]}>
                              {DIRECTION_LABEL[r.direction]} {r.delta != null ? fmtDelta(r.delta) : ''}
                            </StatusBadge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </Card>

          {/* 취약 역량 → 약점 집중 연습 */}
          <Card className="p-6">
            <h2 className="text-lg font-black text-[#253900]">취약 역량 · 약점 집중 연습</h2>
            {tags.length === 0 ? (
              <p className="mt-3 text-sm text-[rgba(0,0,0,0.6)]">표시할 약점 태그가 없습니다. 면접을 더 진행하면 약점 추이가 분석됩니다.</p>
            ) : (
              <div className="mt-4 flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <Link
                    key={tag}
                    to={`/interview/question-packs?focus=${encodeURIComponent(tag)}`}
                    className="inline-flex items-center gap-1 rounded-full border border-[#253900] px-3 py-1 text-xs font-black text-[#253900] transition hover:bg-[rgba(37,57,0,0.08)]"
                  >
                    {tag} · 집중 연습
                  </Link>
                ))}
              </div>
            )}
            <div className="mt-4">
              <Button as={Link} to="/interview/question-packs" variant="secondary">전체 질문팩 보기</Button>
            </div>
          </Card>

          {/* 최근 면접 기록 */}
          {history.length > 0 && (
            <Card className="p-6">
              <h2 className="text-lg font-black text-[#253900]">최근 면접</h2>
              <ul className="mt-3 divide-y divide-[rgba(0,0,0,0.08)]">
                {history.slice().reverse().map((h) => (
                  <li key={h.session_id} className="flex items-center justify-between gap-3 py-3">
                    <div>
                      <p className="text-sm font-bold text-[#253900]">{h.date} · {h.interview_type}</p>
                      <p className="text-xs text-[rgba(0,0,0,0.55)]">전체 점수 {showScore(h.overall_score)}</p>
                    </div>
                    <Button as={Link} to={`/report/${h.session_id}`} variant="ghost">리포트</Button>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>
      )}
    </PageShell>
  );
}
