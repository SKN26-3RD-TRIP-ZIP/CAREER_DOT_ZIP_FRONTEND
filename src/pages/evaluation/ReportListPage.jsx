import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { mypageApi } from '../../api/mypageApi';
import {
  Alert,
  Button,
  DashboardCard,
  EmptyState,
  LoadingState,
  PageShell,
  StatusBadge,
} from '../../components/ui/DemoLayout';
import { getOverallScore } from '../../utils/reportSummary';

const fmtDateTime = (value) => (value ? new Date(value).toLocaleString('ko-KR') : '-');

function reportSessionId(report) {
  return report?.session_id ?? report?.interview_session_id ?? report?.session?.session_id ?? null;
}

function statusTone(status, hasReport) {
  if (!hasReport) return 'warning';
  if (['completed', 'done', 'success', 'ready'].includes(String(status || '').toLowerCase())) return 'success';
  if (['failed', 'error'].includes(String(status || '').toLowerCase())) return 'danger';
  return 'default';
}

function statusLabel(status, hasReport) {
  if (!hasReport) return '리포트 없음';
  const value = String(status || '').toLowerCase();
  if (value === 'completed' || value === 'done' || value === 'success' || value === 'ready') return '생성 완료';
  if (value === 'failed' || value === 'error') return '생성 실패';
  return status || '생성 완료';
}

function normalizeRows(history, reports) {
  const reportMap = new Map();
  reports.forEach((report) => {
    const sessionId = reportSessionId(report);
    if (sessionId) reportMap.set(String(sessionId), report);
  });

  const usedReportIds = new Set();
  const rows = history.map((record, index) => {
    const sessionId = record?.session_id ?? record?.id;
    const report = sessionId ? reportMap.get(String(sessionId)) : null;
    if (report) usedReportIds.add(String(report?.report_id ?? reportSessionId(report)));

    const hasReport = Boolean(record?.has_report || report);
    return {
      key: String(sessionId ?? record?.created_at ?? `history-${index}`),
      sessionId,
      interviewType: report?.interview_type || record?.interview_type || '면접',
      status: report?.status || record?.status,
      hasReport,
      score: getOverallScore(report, record?.overall_score ?? null),
      summaryText: report?.summary_text || '',
      date: report?.generated_at || record?.ended_at || record?.created_at,
    };
  });

  reports.forEach((report) => {
    const sessionId = reportSessionId(report);
    const reportKey = String(report?.report_id ?? sessionId);
    if (usedReportIds.has(reportKey)) return;
    rows.push({
      key: `report-${reportKey}`,
      sessionId,
      interviewType: report?.interview_type || '면접',
      status: report?.status,
      hasReport: Boolean(sessionId),
      score: getOverallScore(report, null),
      summaryText: report?.summary_text || '',
      date: report?.generated_at,
    });
  });

  return rows.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
}

export default function ReportListPage() {
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadReports = async () => {
    setLoading(true);
    setError('');
    try {
      const [historyData, reportData] = await Promise.all([
        mypageApi.getInterviewHistory(),
        mypageApi.getReportList(),
      ]);
      setHistory(Array.isArray(historyData?.results) ? historyData.results : []);
      setReports(Array.isArray(reportData?.results) ? reportData.results : []);
    } catch {
      setHistory([]);
      setReports([]);
      setError('리포트 목록을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  const rows = useMemo(() => normalizeRows(history, reports), [history, reports]);
  const reportCount = rows.filter((row) => row.hasReport).length;

  return (
    <PageShell
      eyebrow="Report"
      title="리포트 보관함"
      description="완료된 면접 리포트를 한 곳에서 확인하고 필요한 리포트를 선택해 상세 화면으로 이동합니다."
      activeNav="리포트"
      maxWidth="max-w-6xl"
      actions={
        <Button type="button" variant="secondary" onClick={loadReports} disabled={loading}>
          목록 새로고침
        </Button>
      }
    >
      <DashboardCard>
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-black text-[#253900]">전체 리포트</h2>
            <p className="mt-1 text-sm text-[rgba(0,0,0,0.6)]">
              총 {rows.length.toLocaleString('ko-KR')}건 중 리포트 생성 완료 {reportCount.toLocaleString('ko-KR')}건
            </p>
          </div>
          <StatusBadge tone="success">{reportCount}건</StatusBadge>
        </div>

        {loading ? (
          <LoadingState title="리포트 목록을 불러오는 중입니다" />
        ) : error ? (
          <Alert tone="danger">{error}</Alert>
        ) : rows.length === 0 ? (
          <EmptyState
            title="아직 리포트가 없습니다"
            description="면접을 완료하면 생성된 리포트를 이곳에서 확인할 수 있습니다."
            actionLabel="면접 시작하기"
            actionTo="/analysis"
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[780px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-[rgba(0,0,0,0.12)] text-[#253900]">
                  <th className="py-3 pr-4">날짜</th>
                  <th className="py-3 pr-4">면접 유형</th>
                  <th className="py-3 pr-4">상태</th>
                  <th className="py-3 pr-4">점수</th>
                  <th className="py-3 pr-4">요약</th>
                  <th className="py-3 pr-4">동작</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.key} className="border-b border-[rgba(0,0,0,0.12)] align-top">
                    <td className="py-3 pr-4">{fmtDateTime(row.date)}</td>
                    <td className="py-3 pr-4 font-black">{row.interviewType}</td>
                    <td className="py-3 pr-4">
                      <StatusBadge tone={statusTone(row.status, row.hasReport)}>
                        {statusLabel(row.status, row.hasReport)}
                      </StatusBadge>
                    </td>
                    <td className="py-3 pr-4 font-black">
                      {row.score != null ? `${Number(row.score).toLocaleString('ko-KR')}점` : '-'}
                    </td>
                    <td className="max-w-sm py-3 pr-4 text-[rgba(0,0,0,0.68)]">
                      {row.summaryText || (row.hasReport ? '상세 리포트에서 확인 가능' : '-')}
                    </td>
                    <td className="py-3 pr-4">
                      {row.hasReport && row.sessionId ? (
                        <Button type="button" variant="secondary" onClick={() => navigate(`/report/${row.sessionId}`)}>
                          리포트 보기
                        </Button>
                      ) : (
                        <span className="font-bold text-[rgba(0,0,0,0.55)]">리포트 없음</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </DashboardCard>
    </PageShell>
  );
}
