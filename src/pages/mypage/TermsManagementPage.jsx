import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getMyTermsAgreements, updateMarketingConsent } from '../../api/authApi';
import { toUserMessage } from '../../api/errors';
import { PageShell, Card, Button, Alert, LoadingState, EmptyState } from '../../components/ui/DemoLayout';

const KIND_LABEL = { terms: '이용약관', privacy: '개인정보 처리방침', marketing: '마케팅 정보 수신' };
const kindLabel = (k) => KIND_LABEL[k] || k;

function fmt(dt) {
  if (!dt) return '-';
  try {
    return new Date(dt).toLocaleString('ko-KR');
  } catch {
    return String(dt);
  }
}

// 마이페이지 약관·동의 관리 — 실제 Backend 약관 API 연동 (원문/버전 하드코딩 없음)
export default function TermsManagementPage() {
  const [status, setStatus] = useState('loading'); // loading | ready | error
  const [error, setError] = useState('');
  const [data, setData] = useState(null);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState('');

  const load = useCallback(async () => {
    setStatus('loading');
    setError('');
    try {
      const res = await getMyTermsAgreements({ size: 100 });
      setData(res.data);
      setStatus('ready');
    } catch (err) {
      setError(toUserMessage(err, '약관 동의 내역을 불러오지 못했습니다.'));
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const results = data?.results ?? [];
  const reconsent = data?.required_reconsent ?? [];

  // 백엔드가 -created_at, -id 순으로 내려주므로 각 kind 의 첫 항목이 최신이다.
  const latestByKind = {};
  for (const r of results) {
    if (!(r.kind in latestByKind)) latestByKind[r.kind] = r;
  }
  const marketing = latestByKind['marketing'];
  const marketingOn = Boolean(marketing && marketing.agreed && !marketing.withdrawn_at);

  const changeMarketing = async (next) => {
    if (saving) return;
    setSaving(true);
    setNotice('');
    setError('');
    try {
      await updateMarketingConsent({ agreed: next, version: marketing?.version });
      setNotice(next ? '마케팅 수신에 동의했습니다.' : '마케팅 수신 동의를 철회했습니다.');
      await load();
    } catch (err) {
      setError(toUserMessage(err, '마케팅 동의 변경에 실패했습니다.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageShell
      activeNav="마이페이지"
      title="약관 · 동의 관리"
      description="동의한 약관 버전과 마케팅 수신 동의를 확인하고 변경할 수 있습니다."
    >
      {status === 'loading' && <LoadingState title="약관 동의 내역을 불러오는 중입니다" />}

      {status === 'error' && (
        <Card className="p-6">
          <Alert tone="danger">{error}</Alert>
          <Button type="button" className="mt-4" onClick={load}>
            다시 시도
          </Button>
        </Card>
      )}

      {status === 'ready' && (
        <div className="space-y-6">
          {reconsent.length > 0 && (
            <Alert tone="warning">
              새로운 필수 약관에 재동의가 필요합니다: {reconsent.map((d) => `${kindLabel(d.kind)} ${d.version}`).join(', ')}
            </Alert>
          )}
          {notice && <Alert tone="info">{notice}</Alert>}

          <Card className="p-6">
            <h2 className="text-lg font-black text-[#253900]">현재 동의 현황</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {['terms', 'privacy'].map((k) => {
                const r = latestByKind[k];
                return (
                  <div key={k} className="rounded-xl border border-[rgba(0,0,0,0.1)] bg-[#EEEEEE] p-4">
                    <p className="text-sm font-bold text-[#253900]">
                      {kindLabel(k)} {r?.is_required ? '(필수)' : ''}
                    </p>
                    <p className="mt-1 text-xs text-[rgba(0,0,0,0.6)]">버전 {r?.version ?? '-'}</p>
                    <p className="mt-1 text-xs text-[rgba(0,0,0,0.6)]">동의 시각 {fmt(r?.agreed_at)}</p>
                  </div>
                );
              })}
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-black text-[#253900]">마케팅 정보 수신 동의 (선택)</h2>
                <p className="mt-1 text-sm text-[rgba(0,0,0,0.6)]">
                  현재 상태:{' '}
                  <strong className={marketingOn ? 'text-[#08CB00]' : 'text-[#000000]'}>
                    {marketingOn ? '동의함' : '동의 안 함'}
                  </strong>
                  {marketing?.agreed_at && marketingOn ? ` · ${fmt(marketing.agreed_at)}` : ''}
                </p>
              </div>
              {marketingOn ? (
                <Button type="button" variant="secondary" disabled={saving} onClick={() => changeMarketing(false)}>
                  {saving ? '처리 중...' : '수신 동의 철회'}
                </Button>
              ) : (
                <Button type="button" disabled={saving} onClick={() => changeMarketing(true)}>
                  {saving ? '처리 중...' : '수신 동의하기'}
                </Button>
              )}
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-lg font-black text-[#253900]">동의 내역</h2>
            {results.length === 0 ? (
              <EmptyState title="동의 내역이 없습니다" description="약관 동의 기록이 아직 없습니다." />
            ) : (
              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[560px] text-sm">
                  <thead>
                    <tr className="border-b border-[rgba(0,0,0,0.12)] text-left text-xs font-bold text-[rgba(0,0,0,0.55)]">
                      <th className="py-2 pr-4">약관</th>
                      <th className="py-2 pr-4">버전</th>
                      <th className="py-2 pr-4">필수</th>
                      <th className="py-2 pr-4">상태</th>
                      <th className="py-2 pr-4">동의 시각</th>
                      <th className="py-2 pr-4">출처</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((r) => (
                      <tr key={r.terms_agreement_id} className="border-b border-[rgba(0,0,0,0.06)]">
                        <td className="py-2 pr-4 font-bold">{kindLabel(r.kind)}</td>
                        <td className="py-2 pr-4">{r.version}</td>
                        <td className="py-2 pr-4">{r.is_required ? '필수' : '선택'}</td>
                        <td className="py-2 pr-4">{r.withdrawn_at ? '철회' : r.agreed ? '동의' : '미동의'}</td>
                        <td className="py-2 pr-4">{fmt(r.agreed_at)}</td>
                        <td className="py-2 pr-4">{r.source ?? '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          <div>
            <Button as={Link} to="/mypage" variant="ghost">
              ← 마이페이지로
            </Button>
          </div>
        </div>
      )}
    </PageShell>
  );
}
