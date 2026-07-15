import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getMe, submitTermsAcceptance } from '../../api/authApi';
import { toUserMessage } from '../../api/errors';
import { useAuthStore } from '../../store/authStore';
import { Alert, AuthShell, Button } from '../../components/ui/DemoLayout';
import TermsContentModal from '../../components/auth/TermsContentModal';
import { TERMS_KIND_LABEL } from '../../constants/termsContent';

const AGREEMENT_ROWS = [
  { kind: 'terms', required: true },
  { kind: 'privacy', required: true },
  { kind: 'marketing', required: false },
];

/** Shared required-terms completion screen for password and social accounts. */
export default function SocialTermsPage() {
  const navigate = useNavigate();
  const logout = useAuthStore((state) => state.logout);
  const setUser = useAuthStore((state) => state.setUser);
  const [agreements, setAgreements] = useState({ terms: false, privacy: false, marketing: false });
  const [viewing, setViewing] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const allRequired = agreements.terms && agreements.privacy;
  const allSelected = agreements.terms && agreements.privacy && agreements.marketing;

  const setAgreement = (kind, checked) => {
    setAgreements((current) => ({ ...current, [kind]: checked }));
  };

  const handleSubmit = async () => {
    setError('');
    if (!allRequired) {
      setError('필수 약관에 모두 동의해 주세요.');
      return;
    }
    setLoading(true);
    try {
      const { data } = await submitTermsAcceptance({
        termsAgreed: agreements.terms,
        privacyAgreed: agreements.privacy,
        marketingAgreed: agreements.marketing,
      });
      const me = await getMe();
      setUser(me.data);
      navigate(data?.next_path || '/mypage', { replace: true });
    } catch (err) {
      setError(toUserMessage(err, '약관 동의 처리 중 오류가 발생했습니다. 다시 시도해 주세요.'));
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    await logout();
    navigate('/auth/login', { replace: true });
  };

  return (
    <AuthShell
      title="약관에 동의해 주세요"
      description="가입을 완료하려면 필수 약관의 내용을 확인하고 동의해 주세요."
      footer={
        <Link to="/auth/login" className="font-black text-[#253900]">
          로그인 화면으로
        </Link>
      }
    >
      <div className="space-y-5">
        <label
          className={`flex items-start gap-3 rounded-xl border p-4 transition ${
            allSelected ? 'border-[#08CB00] bg-[rgba(8,203,0,0.08)]' : 'border-black/15 bg-[#EEEEEE]'
          }`}
        >
          <input
            type="checkbox"
            className="mt-1 h-4 w-4 accent-[#08CB00]"
            checked={allSelected}
            onChange={(event) => {
              const checked = event.target.checked;
              setAgreements({ terms: checked, privacy: checked, marketing: checked });
            }}
          />
          <span>
            <strong className="block text-[#253900]">약관 전체에 동의합니다</strong>
            <span className="mt-1 block text-sm leading-6">필수 약관과 선택 마케팅 수신 동의를 한 번에 설정합니다.</span>
          </span>
        </label>

        {AGREEMENT_ROWS.map(({ kind, required }) => (
          <div key={kind} className="flex items-center justify-between gap-4 rounded-xl border border-black/10 bg-[#EEEEEE] p-4 text-sm font-bold">
            <label className="flex min-w-0 flex-1 items-center gap-3">
              <input
                type="checkbox"
                className="h-4 w-4 shrink-0 accent-[#08CB00]"
                checked={agreements[kind]}
                onChange={(event) => setAgreement(kind, event.target.checked)}
              />
              <span>[{required ? '필수' : '선택'}] {TERMS_KIND_LABEL[kind]} 동의</span>
            </label>
            <button
              type="button"
              onClick={() => setViewing(kind)}
              className="shrink-0 rounded-md px-2 py-1 text-xs font-black text-[#257A20] underline underline-offset-2"
            >
              내용 보기
            </button>
          </div>
        ))}

        <p className="text-xs leading-5 text-black/55">
          선택 항목에 동의하지 않아도 가입할 수 있습니다. 필수 항목은 각 문서의 내용을 확인한 뒤 동의해 주세요.
        </p>

        {error && <Alert tone="danger">{error}</Alert>}
        <div className="grid gap-2 sm:grid-cols-2">
          <Button type="button" variant="secondary" onClick={handleCancel} disabled={loading}>
            취소
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={loading || !allRequired}>
            {loading ? '처리 중...' : '동의하고 가입 완료'}
          </Button>
        </div>
      </div>

      {viewing && <TermsContentModal kind={viewing} onClose={() => setViewing(null)} />}
    </AuthShell>
  );
}
