import { Link } from 'react-router-dom';
import { AuthShell, Button, StepIndicator } from '../../components/ui/DemoLayout';

const SIGNUP_STEPS = ['계정 정보', '약관 동의', '이메일 인증', '완료'];

function SignupCompletePage() {
  return (
    <AuthShell
      title="회원가입이 완료되었어요!"
      description="이제 프로필과 자료를 입력하면 나에게 맞는 모의면접을 시작할 수 있어요."
      footer={
        <Link to="/auth/login" className="font-black text-[#253900]">
          로그인으로 이동
        </Link>
      }
    >
      <StepIndicator steps={SIGNUP_STEPS} currentStep={4} />
      <div className="rounded-xl border border-[rgba(0,0,0,0.08)] bg-[#EEEEEE] p-8 text-center shadow-[0_6px_20px_rgba(0,0,0,0.06)]">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[rgba(8,203,0,0.15)]">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#08CB00] text-2xl font-black text-[#EEEEEE]">✓</span>
        </div>
        <p className="mt-5 text-lg font-black text-[#253900]">가입이 완료되었습니다.</p>
        <p className="mt-2 text-sm leading-6 text-[rgba(0,0,0,0.6)]">첫 면접 리포트를 만들기 위해 기본 프로필부터 입력해 주세요.</p>
      </div>
      <Button as={Link} to="/profile" className="mt-5 w-full">
        프로필 입력 시작하기
      </Button>
    </AuthShell>
  );
}

export default SignupCompletePage;
