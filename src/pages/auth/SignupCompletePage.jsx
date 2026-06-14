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
      <div className="rounded-lg border border-[#000000] p-6 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#08CB00] text-2xl font-black">✓</div>
        <p className="mt-5 text-sm leading-6">첫 면접 리포트를 만들기 위해 기본 프로필부터 입력해 주세요.</p>
      </div>
      <Button as={Link} to="/profile" className="mt-5 w-full">
        프로필 입력 시작하기
      </Button>
    </AuthShell>
  );
}

export default SignupCompletePage;
