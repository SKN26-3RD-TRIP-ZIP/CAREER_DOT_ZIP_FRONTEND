import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getMyTermsAgreements, updateMarketingConsent } from '../../api/authApi';
import { toUserMessage } from '../../api/errors';
import { PageShell, Card, Button, Alert, LoadingState, EmptyState } from '../../components/ui/DemoLayout';

const KIND_LABEL = { terms: '이용약관', privacy: '개인정보 처리방침', marketing: '마케팅 정보 수신' };
const normalizeKind = (kind) => String(kind || '').toLowerCase();
const kindLabel = (k) => KIND_LABEL[normalizeKind(k)] || k;

const TERMS_CONTENT = {
  terms: {
    title: '이용약관',
    sections: [
      ['서비스 이용', 'Career.zip은 사용자가 입력한 JD, 이력서, 자기소개서, 면접 답변을 바탕으로 분석과 면접 연습 기능을 제공합니다.'],
      ['사용자 책임', '사용자는 본인에게 권한이 있는 자료를 입력해야 하며, 타인의 개인정보나 권리를 침해하는 내용을 업로드하지 않아야 합니다.'],
      ['서비스 제한', '부정 사용, 보안 침해, 시스템 남용이 확인되면 서비스 이용이 제한될 수 있습니다.'],
      ['결과 활용', 'AI 분석 결과와 면접 피드백은 취업 준비를 돕는 참고 자료이며, 실제 채용 결과를 보장하지 않습니다.'],
    ],
  },
  privacy: {
    title: '개인정보 처리방침',
    sections: [
      ['수집 항목', '회원 식별 정보, 프로필 정보, 사용자가 등록한 JD·이력서·자기소개서·프로젝트·면접 답변 및 서비스 이용 기록을 처리할 수 있습니다.'],
      ['이용 목적', '계정 관리, 맞춤형 분석, 면접 질문 생성, 리포트 제공, 보안 및 서비스 품질 개선을 위해 사용합니다.'],
      ['보관 및 파기', '관련 법령 또는 내부 보관 정책에 따라 필요한 기간 동안 보관하며, 목적 달성 후에는 파기 또는 익명화합니다.'],
      ['권리 행사', '사용자는 개인정보 열람, 정정, 삭제, 처리 정지를 요청할 수 있습니다.'],
    ],
  },
  marketing: {
    title: '마케팅 정보 수신 동의',
    sections: [
      ['수신 내용', '서비스 업데이트, 이벤트, 혜택, 커리어 콘텐츠, 신규 기능 안내를 받을 수 있습니다.'],
      ['수신 방법', '이메일, 앱/웹 알림 등 서비스가 제공하는 연락 수단을 사용할 수 있습니다.'],
      ['선택 동의', '마케팅 수신 동의는 선택 사항이며, 동의하지 않아도 기본 서비스 이용에는 제한이 없습니다.'],
      ['철회 방법', '마이페이지의 약관 · 동의 관리 화면에서 언제든지 수신 동의를 철회할 수 있습니다.'],
    ],
  },
};

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
  const [viewing, setViewing] = useState(null);

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
    const key = normalizeKind(r.kind);
    if (!(key in latestByKind)) latestByKind[key] = r;
  }
  const marketing = latestByKind.marketing;
  const marketingOn = Boolean(marketing && marketing.agreed && !marketing.withdrawn_at);

  const openTerms = (kind, version = 'v1') => {
    setViewing({ kind: normalizeKind(kind), version });
  };

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
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm font-bold text-[#253900]">
                        {kindLabel(k)} {r?.is_required ? '(필수)' : ''}
                      </p>
                      <Button type="button" variant="ghost" className="h-auto px-0 py-0 text-xs underline" onClick={() => openTerms(k, r?.version)}>
                        보기
                      </Button>
                    </div>
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
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="secondary" onClick={() => openTerms('marketing', marketing?.version)}>
                  보기
                </Button>
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
                      <th className="py-2 pr-4">내용</th>
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
                        <td className="py-2 pr-4">
                          <Button type="button" variant="ghost" className="h-auto px-0 py-0 text-xs underline" onClick={() => openTerms(r.kind, r.version)}>
                            보기
                          </Button>
                        </td>
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
      {viewing && (
        <TermsContentModal
          kind={viewing.kind}
          version={viewing.version}
          onClose={() => setViewing(null)}
        />
      )}
    </PageShell>
  );
}

function TermsContentModal({ kind, version, onClose }) {
  const content = TERMS_CONTENT[kind] || TERMS_CONTENT.terms;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6" role="dialog" aria-modal="true" aria-labelledby="terms-content-title">
      <div className="max-h-[86vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-[rgba(0,0,0,0.15)] bg-[#EEEEEE] p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black text-[#08CB00]">버전 {version || 'v1'}</p>
            <h2 id="terms-content-title" className="mt-1 text-2xl font-black text-[#253900]">{content.title}</h2>
          </div>
          <Button type="button" variant="secondary" onClick={onClose}>
            닫기
          </Button>
        </div>
        <div className="mt-5 space-y-4">
          {content.sections.map(([title, body]) => (
            <section key={title} className="rounded-lg border border-[rgba(0,0,0,0.12)] bg-white/45 p-4">
              <h3 className="font-black text-[#253900]">{title}</h3>
              <p className="mt-2 text-sm font-semibold leading-6 text-[rgba(0,0,0,0.68)]">{body}</p>
            </section>
          ))}
        </div>
        <p className="mt-5 text-xs leading-5 text-[rgba(0,0,0,0.55)]">
          현재 화면은 서비스에서 제공하는 v1 동의 내용을 확인하기 위한 표시 영역입니다.
        </p>
      </div>
    </div>
  );
}
