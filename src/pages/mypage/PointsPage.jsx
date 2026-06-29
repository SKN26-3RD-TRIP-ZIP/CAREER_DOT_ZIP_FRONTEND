import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { mypageApi } from '../../api/mypageApi';
import { toUserMessage } from '../../api/errors';
import {
  reasonLabel,
  transactionLabel,
  transactionKind,
  formatAmount,
  formatBalance,
} from '../../utils/points';
import {
  PageShell,
  Card,
  Button,
  Alert,
  StatCard,
  StatusBadge,
  LoadingState,
  EmptyState,
} from '../../components/ui/DemoLayout';

const KIND_TONE = { earn: 'success', refund: 'success', use: 'default', expire: 'warning', admin: 'default', other: 'default' };
const SIZE = 20;

export default function PointsPage() {
  const navigate = useNavigate();
  const [balance, setBalance] = useState(null);
  const [hist, setHist] = useState(null);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('loading'); // loading | ready | error
  const [error, setError] = useState('');

  const load = useCallback(async (p) => {
    setStatus('loading');
    setError('');
    try {
      const [b, h] = await Promise.all([
        mypageApi.getPointBalance(),
        mypageApi.getPointHistory({ page: p, size: SIZE }),
      ]);
      setBalance(b);
      setHist(h);
      setStatus('ready');
    } catch (err) {
      setError(toUserMessage(err, '포인트 정보를 불러오지 못했습니다.'));
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    load(page);
  }, [load, page]);

  const results = hist?.results ?? [];
  const total = hist?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / SIZE));

  return (
    <PageShell
      activeNav="마이페이지"
      title="포인트"
      description="포인트 잔액과 적립·차감·환불 내역을 확인합니다."
      actions={<Button type="button" variant="secondary" onClick={() => navigate('/mypage')}>마이페이지</Button>}
    >
      {status === 'loading' && <LoadingState title="포인트 정보를 불러오는 중입니다" />}

      {status === 'error' && (
        <Card className="p-6">
          <Alert tone="danger">{error}</Alert>
          <Button type="button" className="mt-4" onClick={() => load(page)}>다시 시도</Button>
        </Card>
      )}

      {status === 'ready' && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <StatCard
              label="현재 잔액"
              value={formatBalance(balance?.point_balance)}
              helper={balance?.point_last_updated_at ? `최근 변경 ${new Date(balance.point_last_updated_at).toLocaleString('ko-KR')}` : ''}
            />
            <StatCard label="총 내역" value={total} />
          </div>

          <Card className="p-6">
            <h2 className="text-lg font-black text-[#253900]">포인트 내역</h2>
            {results.length === 0 ? (
              <EmptyState title="포인트 내역이 없습니다" description="활동을 하면 적립·차감 내역이 표시됩니다." />
            ) : (
              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[680px] text-sm">
                  <thead>
                    <tr className="border-b border-[rgba(0,0,0,0.12)] text-left text-xs font-bold text-[rgba(0,0,0,0.55)]">
                      <th className="py-2 pr-4">일시</th>
                      <th className="py-2 pr-4">사유</th>
                      <th className="py-2 pr-4">구분</th>
                      <th className="py-2 pr-4">금액</th>
                      <th className="py-2 pr-4">잔액</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((item) => {
                      const kind = transactionKind(item.transaction_type);
                      return (
                        <tr key={item.point_history_id} className="border-b border-[rgba(0,0,0,0.06)]">
                          <td className="py-2 pr-4 text-xs text-[rgba(0,0,0,0.6)]">
                            {item.created_at ? new Date(item.created_at).toLocaleString('ko-KR') : '-'}
                          </td>
                          <td className="py-2 pr-4 font-bold text-[#253900]">{reasonLabel(item.reason_code)}</td>
                          <td className="py-2 pr-4"><StatusBadge tone={KIND_TONE[kind]}>{transactionLabel(item.transaction_type)}</StatusBadge></td>
                          <td className={`py-2 pr-4 font-black ${kind === 'use' || kind === 'expire' ? 'text-[#000000]' : 'text-[#08CB00]'}`}>{formatAmount(item.amount)}</td>
                          <td className="py-2 pr-4">{formatBalance(item.balance_after)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {total > SIZE && (
              <div className="mt-4 flex items-center justify-center gap-3 text-sm">
                <Button type="button" variant="secondary" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>이전</Button>
                <span className="text-[rgba(0,0,0,0.6)]">{page} / {totalPages}</span>
                <Button type="button" variant="secondary" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>다음</Button>
              </div>
            )}
          </Card>
        </div>
      )}
    </PageShell>
  );
}
