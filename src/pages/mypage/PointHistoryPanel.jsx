import { Alert, Button, DashboardCard, EmptyState, LoadingState, StatCard, StatusBadge } from '../../components/ui/DemoLayout';

export const POINT_PAGE_SIZE = 10;

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

const fmtDateTime = (v) => (v ? new Date(v).toLocaleString('ko-KR') : '기록 없음');

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

export function getPointSnapshot(pointHistory = []) {
  return {
    latestEarn: pointHistory.find((item) => item.transaction_type === 'EARN'),
    latestUse: pointHistory.find((item) => item.transaction_type === 'USE'),
    latestRefund: pointHistory.find((item) => item.transaction_type === 'REFUND'),
    latestAdminAdjust: pointHistory.find((item) => item.transaction_type === 'ADMIN'),
  };
}

export default function PointHistoryPanel({
  pointBalance,
  summary,
  pointHistory,
  pointTotal,
  pointPage,
  setPointPage,
  pointLoading,
  pointError,
}) {
  const pointSummaryBalance = pointBalance?.point_balance ?? summary?.point_balance ?? 0;
  const { latestEarn, latestUse, latestRefund, latestAdminAdjust } = getPointSnapshot(pointHistory);
  const pointTotalPages = Math.max(1, Math.ceil(pointTotal / POINT_PAGE_SIZE));

  return (
    <DashboardCard>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-black text-[#253900]">포인트 내역</h2>
          <p className="mt-1 text-sm font-semibold">
            현재 잔액 {Number(pointSummaryBalance).toLocaleString('ko-KR')}P
          </p>
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
  );
}
