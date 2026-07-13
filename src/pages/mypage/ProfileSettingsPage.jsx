import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getMe, withdrawAccount } from '../../api/authApi';
import { toUserMessage } from '../../api/errors';
import { Alert, Button, Card, LoadingState, PageShell } from '../../components/ui/DemoLayout';
import { useAuthStore } from '../../store/authStore';

export default function ProfileSettingsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const resetAuth = useAuthStore((s) => s.logout);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [confirmText, setConfirmText] = useState('');
  const [withdrawing, setWithdrawing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    getMe()
      .then((res) => {
        if (active) setUser(res.data);
      })
      .catch((err) => {
        if (err.response?.status === 401) navigate('/auth/login');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [navigate]);

  useEffect(() => {
    if (location.hash !== '#withdraw' || loading) return;
    document.getElementById('withdraw')?.scrollIntoView({ block: 'start', behavior: 'smooth' });
  }, [loading, location.hash]);

  const handleWithdraw = async () => {
    if (withdrawing || confirmText !== '회원탈퇴') return;
    if (!window.confirm('정말 회원탈퇴를 진행할까요? 탈퇴 후에는 로그인할 수 없습니다.')) return;

    setWithdrawing(true);
    setError('');
    try {
      await withdrawAccount({ confirm: confirmText });
      resetAuth();
      navigate('/', { replace: true });
    } catch (err) {
      setError(toUserMessage(err, '회원탈퇴 처리에 실패했습니다.'));
    } finally {
      setWithdrawing(false);
    }
  };

  return (
    <PageShell
      activeNav="마이페이지"
      title="프로필 · 설정"
      description="계정 정보와 보안 설정을 확인하고, 필요하면 회원탈퇴를 진행할 수 있습니다."
    >
      {loading ? (
        <LoadingState title="계정 정보를 불러오는 중입니다" />
      ) : (
        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="text-xl font-black text-[#253900]">계정 정보</h2>
            <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
              <div className="rounded-lg border border-[rgba(0,0,0,0.12)] p-4">
                <dt className="font-black text-[#253900]">이름</dt>
                <dd className="mt-1 font-semibold">{user?.name || '-'}</dd>
              </div>
              <div className="rounded-lg border border-[rgba(0,0,0,0.12)] p-4">
                <dt className="font-black text-[#253900]">이메일</dt>
                <dd className="mt-1 font-semibold">{user?.email || '-'}</dd>
              </div>
            </dl>
          </Card>

          <Card id="withdraw" className="border-[#b42318] bg-[#fff7f5] p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <h2 className="text-xl font-black text-[#7a271a]">회원탈퇴</h2>
                <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-[rgba(0,0,0,0.68)]">
                  탈퇴하면 계정은 즉시 비활성화되어 로그인할 수 없습니다. 기존 데이터는 보관 정책에 따라 일정 기간 후 익명화됩니다.
                </p>
              </div>
              <Button type="button" variant="secondary" onClick={() => navigate('/mypage/terms')}>
                약관·동의 관리
              </Button>
            </div>

            {error && <Alert tone="danger" className="mt-4">{error}</Alert>}

            <div className="mt-5 grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto]">
              <label className="block">
                <span className="text-sm font-black text-[#7a271a]">확인을 위해 회원탈퇴를 입력해주세요.</span>
                <input
                  type="text"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  className="mt-2 h-12 w-full rounded-lg border border-[rgba(0,0,0,0.18)] bg-white px-4 text-sm font-semibold outline-none focus:border-[#b42318]"
                  placeholder="회원탈퇴"
                />
              </label>
              <Button
                type="button"
                variant="secondary"
                className="self-end border-[#b42318] text-[#7a271a] hover:border-[#7a271a]"
                disabled={withdrawing || confirmText !== '회원탈퇴'}
                onClick={handleWithdraw}
              >
                {withdrawing ? '탈퇴 처리 중...' : '회원탈퇴'}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </PageShell>
  );
}
