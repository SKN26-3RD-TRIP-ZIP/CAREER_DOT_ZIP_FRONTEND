import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { mypageApi } from '../../api/mypageApi';
import { Alert, PageShell, StatCard } from '../../components/ui/DemoLayout';
import PointHistoryPanel, { POINT_PAGE_SIZE } from './PointHistoryPanel';

export default function PointsPage() {
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);
  const [pointBalance, setPointBalance] = useState(null);
  const [pointHistory, setPointHistory] = useState([]);
  const [pointTotal, setPointTotal] = useState(0);
  const [pointPage, setPointPage] = useState(1);
  const [pointLoading, setPointLoading] = useState(true);
  const [pointError, setPointError] = useState('');
  const [summaryError, setSummaryError] = useState('');

  useEffect(() => {
    if (!localStorage.getItem('access_token')) {
      navigate('/auth/login');
      return undefined;
    }

    let active = true;
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
        setSummaryError('마이페이지 요약을 불러오지 못했습니다.');
      });

    return () => {
      active = false;
    };
  }, [navigate]);

  useEffect(() => {
    if (!localStorage.getItem('access_token')) return undefined;

    let active = true;
    setPointLoading(true);
    setPointError('');

    Promise.all([
      mypageApi.getPointBalance(),
      mypageApi.getPointHistory({ page: pointPage, size: POINT_PAGE_SIZE }),
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

  const pointSummaryBalance = pointBalance?.point_balance ?? summary?.point_balance ?? 0;

  return (
    <PageShell
      activeNav="마이페이지"
      title="보상 · 코인"
      description="코인 잔액과 적립·사용 내역을 확인합니다."
      maxWidth="max-w-6xl"
    >
      {summaryError && <Alert tone="warning" className="mb-5">{summaryError}</Alert>}

      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        <StatCard label="보유 코인" value={`${Number(pointSummaryBalance).toLocaleString('ko-KR')}P`} />
        <StatCard label="거래 내역" value={`${Number(pointTotal).toLocaleString('ko-KR')}건`} />
        <StatCard label="면접 수" value={summary?.interview_count ?? '-'} />
      </div>

      <PointHistoryPanel
        pointBalance={pointBalance}
        summary={summary}
        pointHistory={pointHistory}
        pointTotal={pointTotal}
        pointPage={pointPage}
        setPointPage={setPointPage}
        pointLoading={pointLoading}
        pointError={pointError}
      />
    </PageShell>
  );
}
