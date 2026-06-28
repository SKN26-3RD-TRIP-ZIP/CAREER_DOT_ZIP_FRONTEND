import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { submitSocialTerms } from '../../api/authApi';
import { toUserMessage } from '../../api/errors';
import { useAuthStore } from '../../store/authStore';
import { Alert, AuthShell, Button } from '../../components/ui/DemoLayout';

/**
 * 소셜 간편가입 약관 동의 화면. 신규 소셜 사용자가 필수 약관 미동의 상태로 진입한다.
 *  - 필수: 이용약관, 개인정보 수집·이용 / 선택: 마케팅 수신
 *  - 제출 성공 시 /mypage 로 이동(가입 완료)
 *  - 토큰이 이미 저장된 인증 상태에서 진입한다(ProtectedRoute 보호).
 */
export default function SocialTermsPage() {
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);
  const [agreeMarketing, setAgreeMarketing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const allRequired = agreeTerms && agreePrivacy;

  const handleSubmit = async () => {
    setError('');
    if (!allRequired) {
      setError('필수 약관에 모두 동의해 주세요.');
      return;
    }
    setLoading(true);
    try {
      const { data } = await submitSocialTerms({
        termsAgreed: agreeTerms,
        privacyAgreed: agreePrivacy,
        marketingAgreed: agreeMarketing,
      });
      navigate(data?.next_path || '/mypage', { replace: true });
    } catch (err) {
      setError(toUserMessage(err, '약관 동의 처리 중 오류가 발생했습니다. 다시 시도해 주세요.'));
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    // 약관 미동의 시 가입을 완료하지 않는다 — 인증 상태를 정리하고 로그인 화면으로.
    logout();
    navigate('/auth/login', { replace: true });
  };

  return (
    <AuthShell
      title="약관에 동의해 주세요"
      description="소셜 계정으로 가입을 완료하려면 필수 약관 동의가 필요해요."
      footer={
        <Link to="/auth/login" className="font-black text-[#253900]">
          로그인 화면으로
        </Link>
      }
    >
      <div className="space-y-5">
        <label
          className={`flex items-start gap-3 rounded-xl border p-4 transition ${
            allRequired && agreeMarketing
              ? 'border-[#08CB00] bg-[rgba(8,203,0,0.08)]'
              : 'border-[rgba(0,0,0,0.15)] bg-[#EEEEEE]'
          }`}
        >
          <input
            type="checkbox"
            className="mt-1 h-4 w-4 accent-[#08CB00]"
            checked={allRequired && agreeMarketing}
            onChange={(e) => {
              setAgreeTerms(e.target.checked);
              setAgreePrivacy(e.target.checked);
              setAgreeMarketing(e.target.checked);
            }}
          />
          <span>
            <strong className="block text-[#253900]">약관 전체에 동의합니다</strong>
            <span className="mt-1 block text-sm leading-6">필수 약관과 선택 마케팅 수신 동의를 한 번에 설정합니다.</span>
          </span>
        </label>

        {[
          ['[필수] 이용약관 동의', agreeTerms, setAgreeTerms],
          ['[필수] 개인정보 수집·이용 동의', agreePrivacy, setAgreePrivacy],
          ['[선택] 마케팅 정보 수신 동의', agreeMarketing, setAgreeMarketing],
        ].map(([labelText, checked, setter]) => (
          <label
            key={labelText}
            className="flex items-center justify-between gap-4 rounded-xl border border-[rgba(0,0,0,0.12)] bg-[#EEEEEE] p-4 text-sm font-bold"
          >
            <span>{labelText}</span>
            <input
              type="checkbox"
              className="h-4 w-4 accent-[#08CB00]"
              checked={checked}
              onChange={(e) => setter(e.target.checked)}
            />
          </label>
        ))}

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
    </AuthShell>
  );
}
