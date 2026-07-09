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

const PAGE_SIZE = 10;

const fmtDateTime = (value) => (value ? new Date(value).toLocaleString('ko-KR') : '-');

function reportSessionId(report) {
  return report?.session_id ?? report?.interview_session_id ?? report?.session?.session_id ?? null;
}

function reportId(report) {
  return report?.report_id ?? report?.id ?? reportSessionId(report);
}

function statusTone(status) {
  const value = String(status || '').toLowerCase();
  if (['completed', 'done', 'success', 'ready'].includes(value)) return 'success';
  if (['failed', 'error'].includes(value)) return 'danger';
  return 'default';
}

function statusLabel(status) {
  const value = String(status || '').toLowerCase();
  if (['completed', 'done', 'success', 'ready'].includes(value)) return '생성 완료';
  if (['processing', 'pending'].includes(value)) return '생성 중';
  if (['failed', 'error'].includes(value)) return '생성 실패';
  return status || '생성 완료';
}

function pageNumbers(currentPage, totalPages) {
  if (totalPages <= 10) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const pages = new Set([1, totalPages, currentPage]);
  for (let page = currentPage - 2; page <= currentPage + 2; page += 1) {
    if (page > 1 && page < totalPages) pages.add(page);
  }

  return Array.from(pages).sort((a, b) => a - b);
}

function toReportRow(report, index) {
  const sessionId = reportSessionId(report);
  const score = getOverallScore(report, null);

  return {
    key: String(reportId(report) ?? `report-${index}`),
    sessionId,
    interviewType: report?.interview_type || report?.session?.interview_type || '면접',
    status: report?.status,
    score,
    summaryText:
      report?.summary_text ||
      report?.score_summary?.comment ||
      report?.summary?.score_summary?.comment ||
      '',
    date: report?.generated_at,
  };
}

export default function ReportIndexPage() {
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const loadReports = async () => {
    setLoading(true);
    setError('');
    try {
      const reportData = await mypageApi.getReportList();
      const results = Array.isArray(reportData?.results) ? reportData.results : [];
      setReports(results);
      setCurrentPage(1);
    } catch {
      setReports([]);
      setError('리포트 목록을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  const rows = useMemo(
    () =>
      reports
        .map(toReportRow)
        .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0)),
    [reports],
  );
  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const visibleRows = rows.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const pages = pageNumbers(currentPage, totalPages);

  return (
    <PageShell
      eyebrow="Report"
      title="리포트 목록"
      description="생성 완료된 면접 리포트만 모아 확인합니다. 필요한 리포트를 선택하면 상세 화면으로 이동합니다."
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
              총 {rows.length.toLocaleString('ko-KR')}건의 생성된 리포트가 있습니다.
            </p>
          </div>
          <StatusBadge tone="success">{rows.length.toLocaleString('ko-KR')}건</StatusBadge>
        </div>

        {loading ? (
          <LoadingState title="리포트 목록을 불러오는 중입니다" />
        ) : error ? (
          <Alert tone="danger">{error}</Alert>
        ) : rows.length === 0 ? (
          <EmptyState
            title="아직 생성된 리포트가 없습니다"
            description="면접을 완료하고 리포트 생성까지 마치면 이곳에서 확인할 수 있습니다."
            actionLabel="면접 시작하기"
            actionTo="/analysis"
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[780px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-[rgba(0,0,0,0.12)] text-[#253900]">
                    <th className="py-3 pr-4">번호</th>
                    <th className="py-3 pr-4">생성일</th>
                    <th className="py-3 pr-4">면접 유형</th>
                    <th className="py-3 pr-4">상태</th>
                    <th className="py-3 pr-4">점수</th>
                    <th className="py-3 pr-4">요약</th>
                    <th className="py-3 pr-4">동작</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleRows.map((row, index) => {
                    const rowNumber = rows.length - ((currentPage - 1) * PAGE_SIZE + index);
                    return (
                      <tr key={row.key} className="border-b border-[rgba(0,0,0,0.12)] align-top">
                        <td className="py-3 pr-4 font-black">{rowNumber}</td>
                        <td className="py-3 pr-4">{fmtDateTime(row.date)}</td>
                        <td className="py-3 pr-4 font-black">{row.interviewType}</td>
                        <td className="py-3 pr-4">
                          <StatusBadge tone={statusTone(row.status)}>
                            {statusLabel(row.status)}
                          </StatusBadge>
                        </td>
                        <td className="py-3 pr-4 font-black">
                          {row.score != null ? `${Number(row.score).toLocaleString('ko-KR')}점` : '-'}
                        </td>
                        <td className="max-w-sm py-3 pr-4 text-[rgba(0,0,0,0.68)]">
                          {row.summaryText || '상세 리포트에서 확인할 수 있습니다.'}
                        </td>
                        <td className="py-3 pr-4">
                          {row.sessionId ? (
                            <Button
                              type="button"
                              variant="secondary"
                              onClick={() => navigate(`/report/${row.sessionId}`)}
                            >
                              리포트 보기
                            </Button>
                          ) : (
                            <span className="font-bold text-[rgba(0,0,0,0.55)]">이동 불가</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <nav className="mt-7 flex flex-wrap items-center justify-center gap-1" aria-label="리포트 페이지">
                <Button
                  type="button"
                  variant="secondary"
                  className="h-9 px-3"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                >
                  이전
                </Button>
                {pages.map((page, index) => {
                  const prev = pages[index - 1];
                  const showGap = prev && page - prev > 1;
                  return (
                    <span key={page} className="inline-flex items-center gap-1">
                      {showGap && <span className="px-2 text-sm font-black text-[rgba(0,0,0,0.45)]">...</span>}
                      <Button
                        type="button"
                        variant={page === currentPage ? 'primary' : 'secondary'}
                        className="h-9 min-w-9 px-3"
                        onClick={() => setCurrentPage(page)}
                      >
                        {page}
                      </Button>
                    </span>
                  );
                })}
                <Button
                  type="button"
                  variant="secondary"
                  className="h-9 px-3"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                >
                  다음
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  className="h-9 px-3"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(totalPages)}
                >
                  마지막
                </Button>
              </nav>
            )}
          </>
        )}
      </DashboardCard>
    </PageShell>
  );
}
