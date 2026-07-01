import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  AlertCircle,
  Bell,
  CalendarCheck,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  ClipboardList,
  CloudUpload,
  Code2,
  Eye,
  EyeOff,
  FileText,
  Folder,
  Gift,
  Home,
  LineChart,
  Mail,
  Mic,
  MoveDown,
  MoveUp,
  Settings,
  ShieldCheck,
  Target,
  User,
} from 'lucide-react';
import { login as loginApi, getMe, signup as signupApi, verifyCode, resendVerification, logout as logoutApi } from '../../api/authApi';
import { mypageApi } from '../../api/mypageApi';
import { useAuthStore } from '../../store/authStore';
import { resolveAuthedRedirect } from '../../utils/authNavigation';
import Tooltip from '../../components/ui/Tooltip';
import SocialLoginButtons from '../../components/auth/SocialLoginButtons';
import {
  addTraitSelection,
  buildTalentProfilePayload,
  initializeSelectedItems,
  isTraitSelected,
  moveTraitSelection,
  removeTraitSelection,
  updateTraitDescription,
} from '../../components/talent-profile/talentProfileSelection';
import { getJdTalentProfile, getTalentProfileCatalog, saveJdTalentProfile } from '../../api/talentProfileApi';
import TopNav from '../../components/layout/TopNav.jsx';
import { BrandLogo } from '../../components/layout/BrandLogo.jsx';

const cx = (...parts) => parts.filter(Boolean).join(' ');
const GREEN = '#08CB00';

// export function BrandLogo({ light = false }) {
//   return (
//     <Link to="/" className={cx('inline-flex items-center gap-3 font-black tracking-tight', light ? 'text-white' : 'text-black')}>
//       <span className="relative flex h-8 w-8 items-center justify-center rounded-md bg-[#08CB00] shadow-[inset_0_0_0_2px_rgba(255,255,255,.35)]">
//         <span className="absolute -top-1 left-1 h-2 w-5 rounded-t-md bg-[#12e20a]" />
//         <Folder size={19} className="text-white" />
//       </span>
//       <span className="text-[25px] leading-none">Career.zip</span>
//     </Link>
//   );
// }

function PublicHeader() {
  const navItems = [
    ['서비스 소개', 'service-intro'],
    ['기능', 'features'],
    ['면접 연습', 'interview-practice'],
    ['요금제', 'pricing'],
    ['이용 방법', 'how-it-works'],
    ['고객 후기', 'testimonials'],
  ];
  return (
    <header className="h-[76px] border-b border-[#e5e8eb] bg-white">
      <div className="mx-auto flex h-full max-w-[1460px] items-center justify-between px-8">
        <nav className="hidden items-center gap-14 text-[15px] font-bold lg:flex">
          {navItems.map(([label, id]) => <a key={id} href={`#${id}`}>{label}</a>)}
        </nav>
        {/* <div className="flex items-center gap-4">
          <Link to="/auth/login" className="flex h-12 min-w-[86px] items-center justify-center rounded-lg border border-[#d6dde3] px-5 text-[15px] font-bold">로그인</Link>
          <Link to="/auth/signup" className="flex h-12 min-w-[148px] items-center justify-center rounded-lg bg-[#05b700] px-5 text-[15px] font-black text-white">무료 면접 시작하기</Link>
        </div> */}
      </div>
    </header>
  );
}

function RobotHero() {
  const cards = [
    ['JD 분석 완료', '핵심 키워드 추출', FileText, 'left-[6%] top-[18%]'],
    ['이력서 분석 완료', '경력 · 스킬 매칭', Target, 'left-0 top-[55%]'],
    ['자기소개서 분석 완료', '강점 · 경험 추출', User, 'right-0 top-[28%]'],
    ['프로젝트 분석 완료', '기술 스택 평가', LineChart, 'right-[4%] bottom-[10%]'],
  ];
  return (
    <div className="relative min-h-[440px]">
      <div className="absolute inset-x-12 top-20 h-72 rounded-[50%] border border-[#b8efb3]" />
      <div className="absolute left-[45%] top-[9%] h-5 w-5 rounded-full bg-[#08CB00]" />
      <div className="absolute right-[22%] top-[19%] h-4 w-4 rounded-full bg-[#08CB00]" />
      <div className="absolute left-1/2 top-24 z-10 flex -translate-x-1/2 flex-col items-center">
        <div className="relative h-[250px] w-[220px] rounded-[48%] bg-gradient-to-br from-white via-[#f3f5f2] to-[#cbd0c8] shadow-[0_28px_50px_rgba(0,0,0,.18)]">
          <div className="absolute left-7 top-11 h-[92px] w-[166px] rounded-[44px] bg-[#050805]">
            <span className="absolute left-10 top-8 h-12 w-5 rounded-full bg-[#5cff45]" />
            <span className="absolute right-10 top-8 h-12 w-5 rounded-full bg-[#5cff45]" />
          </div>
          <div className="absolute left-[58px] top-[148px] h-[86px] w-[106px] rounded-[50%] bg-[#111811] shadow-[inset_0_0_18px_rgba(8,203,0,.65)]">
            <Mic className="absolute left-8 top-7 text-[#65ff51]" size={42} />
          </div>
        </div>
        <div className="-mt-4 h-12 w-64 rounded-[50%] bg-gradient-to-r from-[#1d2b18] via-[#566756] to-[#1d2b18]" />
      </div>
      {cards.map(([title, desc, Icon, pos]) => (
        <div key={title} className={cx('absolute z-20 w-[190px] rounded-xl border border-[#dfe5df] bg-white p-5 shadow-[0_12px_32px_rgba(0,0,0,.08)]', pos)}>
          <div className="flex items-center gap-2 text-sm font-black"><Icon size={20} className="text-[#009900]" /> {title}</div>
          <p className="mt-3 text-xs font-semibold text-[#68737d]">{desc}</p>
        </div>
      ))}
    </div>
  );
}

export default function HomePage() {
  const features = [
    ['데이터 입력', 'JD, 이력서, 자소서, 프로젝트 경험을 입력', FileText],
    ['AI 분석', '핵심 역량, 경험, 키워드 AI 심층 분석', Code2],
    ['맞춤 질문 생성', '나에게 필요한 맞춤 면접 질문 생성', ClipboardList],
    ['실전 연습', '음성 / 텍스트로 실전처럼 답변', Mic],
    ['AI 피드백', '답변을 분석하고 개선점 제안', ShieldCheck],
    ['성장 리포트', '강점과 약점을 리포트로 확인하고 성장', LineChart],
  ];
  return (
    <main className="min-h-screen bg-white text-black">
      <TopNav variant='public'/>
      <PublicHeader />
      <section id="service-intro" className="mx-auto grid max-w-[1460px] grid-cols-[1fr_1.12fr] items-center gap-8 px-8 pb-10 pt-14">
        <div className="pl-8">
          <p className="inline-flex rounded-full border border-[#b9eab6] bg-[#effcef] px-4 py-2 text-[15px] font-black text-[#009900]">AI Hybrid Interview Coach</p>
          <h1 className="mt-7 text-[48px] font-black leading-[1.18]">
            <span className="whitespace-nowrap">실전 같은 AI 모의면접으로</span><br />
            <span className="text-[#05b700]">합격에 한 걸음</span> 더 가까이
          </h1>
          <p className="mt-7 max-w-[560px] text-[18px] font-medium leading-8 text-[#4f5c66]">
            JD, 이력서, 자기소개서, 프로젝트 경험을 기반으로 나에게 꼭 맞는 면접 질문과 실전형 피드백을 제공합니다.
          </p>
          <div className="mt-10 flex gap-5">
            <Link to="/auth/signup" className="flex h-[58px] min-w-[210px] items-center justify-center rounded-lg bg-[#05b700] text-lg font-black text-white">무료 면접 시작하기</Link>
            <a href="#features" className="flex h-[58px] min-w-[210px] items-center justify-center gap-3 rounded-lg border border-[#cfd8df] text-lg font-black">서비스 둘러보기 <ChevronRight size={18} /></a>
          </div>
        </div>
        <RobotHero />
      </section>
      <section id="features" className="mx-auto max-w-[1340px] rounded-[22px] bg-white px-8 py-8 shadow-[0_18px_54px_rgba(0,0,0,.06)]">
        <h2 className="text-xl font-black">합격까지 필요한 모든 지원</h2>
        <div className="mt-5 grid grid-cols-6 gap-8">
          {features.map(([title, desc, Icon]) => (
            <article key={title} className="rounded-xl border border-[#e2e7eb] bg-white p-6 text-center">
              <Icon className="mx-auto text-[#009900]" size={38} />
              <h3 className="mt-4 text-[17px] font-black">{title}</h3>
              <p className="mt-3 text-sm leading-6 text-[#5f6b75]">{desc}</p>
            </article>
          ))}
        </div>
      </section>
      <section id="how-it-works" className="mx-auto max-w-[1340px] px-8 py-10">
        <h2 className="text-xl font-black">이렇게 진행돼요</h2>
        <div className="mt-10 grid grid-cols-5 gap-10">
          {['정보 입력', 'AI 분석', '맞춤 질문 생성', '실전 면접 연습', '피드백 및 리포트'].map((item, index) => (
            <article key={item} className="relative rounded-xl border border-[#e2e7eb] bg-white p-7 text-center">
              <span className="absolute -top-5 left-6 flex h-10 w-10 items-center justify-center rounded-full bg-[#009900] text-lg font-black text-white">{index + 1}</span>
              <ClipboardList className="mx-auto mt-5 text-[#009900]" size={42} />
              <h3 className="mt-4 text-lg font-black">{item}</h3>
            </article>
          ))}
        </div>
      </section>
      <section id="interview-practice" className="mx-auto max-w-[1340px] px-8 py-10">
        <div className="grid grid-cols-[1.1fr_.9fr] items-center gap-8 rounded-xl border border-[#dfe5ea] bg-[#f8fafb] p-8">
          <div>
            <h2 className="text-xl font-black">면접 연습</h2>
            <p className="mt-4 max-w-[720px] text-sm font-bold leading-6 text-[#64717d]">JD와 이력서 기반 질문으로 음성 또는 텍스트 면접을 진행하고, 완료 후 리포트에서 강점과 보완점을 확인합니다.</p>
          </div>
          <Link to="/interview/setup" className="flex h-12 items-center justify-center rounded-lg bg-[#05b700] px-6 font-black text-white">면접 연습 시작</Link>
        </div>
      </section>
      <section id="pricing" className="mx-auto max-w-[1340px] px-8 py-10">
        <h2 className="text-xl font-black">요금제</h2>
        <div className="mt-5 rounded-xl border border-[#dfe5ea] bg-white p-7">
          <p className="text-sm font-bold text-[#64717d]">현재 Career.zip 면접 준비 플로우는 무료로 시작할 수 있습니다. 유료 플랜은 준비 중이며, 아직 결제 기능이 없어 선택 버튼을 제공하지 않습니다.</p>
        </div>
      </section>
      <section id="testimonials" className="mx-auto max-w-[1340px] px-8 py-10">
        <h2 className="text-xl font-black">고객 후기</h2>
        <div className="mt-5 grid grid-cols-3 gap-5">
          {['JD에서 바로 질문이 뽑혀 연습 흐름이 빨라졌어요.', '리포트로 약점을 다시 볼 수 있어 복습이 쉬웠습니다.', '면접 전에 말하는 연습을 반복하기 좋았습니다.'].map((quote) => (
            <article key={quote} className="rounded-xl border border-[#e2e7eb] bg-white p-6 text-sm font-bold leading-6 text-[#4f5c66]">{quote}</article>
          ))}
        </div>
      </section>
      <footer className="border-t border-[#e5e8eb] py-8 text-center text-xs font-bold text-[#7b8791]">
        © 2026 Career.zip · <Link to="/admin/login" className="text-[#6c7781] underline-offset-4 hover:underline">관리자 페이지</Link>
      </footer>
    </main>
  );
}

function AuthHero() {
  return (
    <aside className="relative hidden overflow-hidden bg-[radial-gradient(circle_at_70%_75%,rgba(8,203,0,.35),transparent_28%),linear-gradient(135deg,#071a00,#253900)] px-[68px] py-[86px] text-white lg:block">
      <BrandLogo light />
      <div className="mt-28">
        <p className="inline-flex rounded-full border border-[rgba(8,203,0,.45)] bg-[rgba(8,203,0,.08)] px-4 py-2 text-[15px] font-black text-[#24ff1a]">AI Hybrid Interview Coach</p>
        <h1 className="mt-8 text-[38px] font-black leading-[1.28]"><span className="whitespace-nowrap">실전 같은 AI 모의면접으로</span><br /><span className="text-[#18e40d]">합격에 한 걸음</span> 더 가까이</h1>
        <p className="mt-8 text-xl font-medium leading-8 text-white/90">JD 분석부터 맞춤 질문, 실전 피드백까지<br />AI가 당신의 커리어 여정을 함께합니다.</p>
        <ul className="mt-14 space-y-9 text-lg font-bold">
          {['직무 맞춤 질문으로 실전 완벽 대비', 'AI 피드백으로 강점과 개선점 파악', '성장 리포트로 합격 가능성 높이기'].map((item) => <li className="flex items-center gap-7" key={item}><Target size={32} className="text-[#24ff1a]" />{item}</li>)}
        </ul>
      </div>
      {/* <div className="absolute bottom-[60px] right-[120px] h-48 w-48 rounded-full bg-[#1b3d09] shadow-[inset_0_0_45px_rgba(36,255,26,.65)]">
        <span className="absolute left-14 top-16 h-16 w-7 rounded-full bg-[#57ff34]" />
        <span className="absolute right-14 top-16 h-16 w-7 rounded-full bg-[#57ff34]" />
      </div> */}
    </aside>
  );
}

function AuthFrame({ children }) {
  return (
    <main className="min-h-screen bg-[#f8fafb] text-black">
      {/* <PublicHeader /> */}
      <div className="grid min-h-[calc(100vh-76px)] grid-cols-1 lg:grid-cols-[42%_58%]">
        <AuthHero />
        <section className="flex items-center justify-center px-8 py-12">{children}</section>
      </div>
    </main>
  );
}

function AuthCard({ title, sub, children, width = 'max-w-[540px]' }) {
  return (
    <div className={cx('w-full rounded-[18px] border border-[#e1e6ea] bg-white px-10 py-11 shadow-[0_18px_60px_rgba(0,0,0,.08)]', width)}>
      <div className="text-center">
        <h1 className="text-[34px] font-black leading-tight">{title}</h1>
        {sub && <p className="mt-4 text-[16px] font-medium text-[#64717d]">{sub}</p>}
      </div>
      <div className="mt-9">{children}</div>
    </div>
  );
}

function TextInput({ label, type = 'text', error, icon: Icon, right, ...props }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-black">{label}</span>
      <span className="relative block">
        {Icon && <Icon className="absolute left-4 top-1/2 -translate-y-1/2 text-[#7b8791]" size={20} />}
        <input type={type} className={cx('h-13 w-full rounded-lg border bg-white px-4 text-[16px] font-medium outline-none transition focus:border-[#009900] focus:ring-4 focus:ring-[#08CB00]/15', Icon && 'pl-12', right && 'pr-12', error ? 'border-[#ff4d4f]' : 'border-[#cfd8df]')} {...props} />
        {right}
      </span>
    </label>
  );
}

export function LoginPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const reset = useAuthStore((s) => s.reset);
  const setToken = useAuthStore((s) => s.setToken);
  const setUser = useAuthStore((s) => s.setUser);
  const [showPw, setShowPw] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [keep, setKeep] = useState(false);
  const [error, setError] = useState(params.get('error') === '1' ? '이메일 또는 비밀번호를 다시 확인해주세요.' : '');
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    const savedEmail = localStorage.getItem('savedEmail');
    if (savedEmail) {
      setEmail(savedEmail);
      setKeep(true);
    }
  }, []);
  if (params.get('mode') === 'find') return <ForgotPasswordPage />;
  function handleKeepChange(checked) {
    setKeep(checked);
    if (checked) localStorage.setItem('savedEmail', email);
    else localStorage.removeItem('savedEmail');
  }
  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    reset();
    try {
      const res = await loginApi({ email, password });
      const token = res.data?.access_token;
      if (!token) throw new Error('no token');
      setToken(token);
      if (keep) localStorage.setItem('savedEmail', email);
      else localStorage.removeItem('savedEmail');
      const me = await getMe();
      setUser(me.data);
      navigate(resolveAuthedRedirect(me.data, params.get('next') || ''), { replace: true });
    } catch {
      setError('이메일 또는 비밀번호를 다시 확인해주세요.');
      reset();
    } finally {
      setLoading(false);
    }
  }
  return (
    <AuthFrame>
      <AuthCard title="로그인" sub="Career.zip 계정으로 로그인하세요">
        <form onSubmit={submit} className="space-y-5">
          <TextInput label="이메일" type="email" placeholder="이메일 주소를 입력하세요" value={email} onChange={(e) => setEmail(e.target.value)} required />
          {error && <div className="flex items-center gap-3 rounded-lg border border-[#ffb9b9] bg-[#fff1f1] px-4 py-3 text-sm font-black text-[#e02929]"><AlertCircle size={18} />{error}</div>}
          <TextInput label="비밀번호" type={showPw ? 'text' : 'password'} placeholder="비밀번호를 입력하세요" value={password} onChange={(e) => setPassword(e.target.value)} required right={<button type="button" aria-label="비밀번호 보기 전환" onClick={() => setShowPw((v) => !v)} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#7b8791]">{showPw ? <EyeOff size={20} /> : <Eye size={20} />}</button>} />
          <div className="flex items-center justify-between text-sm font-bold">
            <label className="flex items-center gap-2"><input type="checkbox" checked={keep} onChange={(e) => handleKeepChange(e.target.checked)} className="h-4 w-4 accent-[#08CB00]" />아이디 자동 저장</label>
            <Link to="/auth/login?mode=find" className="text-[#009900]">비밀번호 찾기</Link>
          </div>
          <button type="submit" disabled={loading} className="h-13 w-full rounded-lg bg-[#05b700] text-lg font-black text-white disabled:opacity-50">{loading ? '로그인 중...' : '로그인'}</button>
        </form>
        <SocialLoginButtons next={params.get('next') || '/mypage'} mode="login" />
        <p className="mt-8 text-center text-sm text-[#6c7781]">아직 계정이 없으신가요? <Link to="/auth/signup" className="font-black text-[#009900]">회원가입</Link></p>
      </AuthCard>
    </AuthFrame>
  );
}

export function ForgotPasswordPage() {
  return (
    <AuthFrame>
      <AuthCard title="비밀번호 찾기" sub="가입한 이메일로 비밀번호 재설정 링크를 보내드릴게요.">
        <div className="space-y-7">
          <TextInput label="이메일" type="email" icon={Mail} placeholder="이메일 주소를 입력하세요" />
          <button type="button" disabled className="h-13 w-full rounded-lg bg-[#05b700] text-lg font-black text-white opacity-60" title="비밀번호 재설정 API가 아직 연결되지 않았습니다.">재설정 링크 보내기</button>
          <div className="text-center"><Link to="/auth/login" className="inline-flex items-center gap-2 font-black text-[#009900]"><ChevronLeft size={18} />로그인으로 돌아가기</Link></div>
          <p className="rounded-lg border border-[#dfe5ea] bg-[#f8fafb] p-3 text-sm font-medium text-[#64717d]">현재 백엔드 비밀번호 재설정 API가 확인되지 않아 UI_ONLY 상태입니다.</p>
        </div>
      </AuthCard>
    </AuthFrame>
  );
}

function StepDots({ current, labels = false }) {
  return (
    <div className="mb-10 flex items-start justify-center gap-5">
      {[1, 2, 3].map((n) => (
        <div key={n} className="flex items-center gap-5">
          <div className="text-center">
            <span className={cx('flex h-11 w-11 items-center justify-center rounded-full text-lg font-black', current === n ? 'bg-[#009900] text-white' : 'border border-[#ccd4db] bg-[#f8fafb] text-[#6f7b86]')}>{n}</span>
            {labels && <p className={cx('mt-3 text-xs font-bold', current === n ? 'text-black' : 'text-[#7b8791]')}>{['계정 정보 입력', '약관 동의', '이메일 인증'][n - 1]}</p>}
          </div>
          {n < 3 && <span className="mt-5 h-px w-[94px] bg-[#cdd5dc]" />}
        </div>
      ))}
    </div>
  );
}

export function SignupPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [agreements, setAgreements] = useState({ terms: false, privacy: false, marketing: false });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const all = agreements.terms && agreements.privacy && agreements.marketing;
  function setAll(v) { setAgreements({ terms: v, privacy: v, marketing: v }); }
  async function submitSignup() {
    setError('');
    if (!agreements.terms || !agreements.privacy) return setError('필수 약관에 동의해주세요.');
    setLoading(true);
    try {
      const res = await signupApi({ email: form.email, name: form.name, password: form.password, termsAgreed: agreements.terms, privacyAgreed: agreements.privacy, marketingAgreed: agreements.marketing });
      localStorage.setItem('careerzip_pending_signup_email', form.email);
      navigate(`/verify-email?email=${encodeURIComponent(form.email)}`, { state: res.data || {} });
    } catch {
      setError('회원가입 처리 중 오류가 발생했습니다. 입력값과 이메일 중복 여부를 확인해주세요.');
    } finally {
      setLoading(false);
    }
  }
  return (
    <AuthFrame>
      <AuthCard title={step === 1 ? '회원가입' : '약관 동의'} sub={step === 1 ? 'Career.zip 계정을 만들어 시작해보세요' : '서비스 이용을 위해 필수 약관에 동의해주세요'} width="max-w-[590px]">
        <StepDots current={step} />
        {step === 1 ? (
          <form className="space-y-5" onSubmit={(e) => { e.preventDefault(); if (form.password !== form.confirm) setError('비밀번호 확인이 일치하지 않습니다.'); else setStep(2); }}>
            <TextInput label="이름" placeholder="이름을 입력하세요" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            <TextInput label="이메일" type="email" placeholder="이메일 주소를 입력하세요" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} autoComplete="off" required />
            <TextInput label="비밀번호" type="password" placeholder="비밀번호를 입력하세요" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
            <TextInput label="비밀번호 확인" type="password" placeholder="비밀번호를 다시 입력하세요" value={form.confirm} onChange={(e) => setForm({ ...form, confirm: e.target.value })} required />
            {error && <div className="rounded-lg border border-[#ffb9b9] bg-[#fff1f1] p-3 text-sm font-black text-[#e02929]">{error}</div>}
            <button type="submit" className="h-13 w-full rounded-lg bg-[#05b700] text-lg font-black text-white">다음</button>
            <SocialLoginButtons next="/input/onboarding/1" mode="signup" />
          </form>
        ) : (
          <div className="space-y-5">
            <label className="flex items-center gap-4 border-b border-[#e4e9ed] pb-6 text-lg font-black"><input type="checkbox" checked={all} onChange={(e) => setAll(e.target.checked)} className="h-6 w-6 accent-[#08CB00]" />전체 동의</label>
            {[
              ['terms', '[필수] 서비스 이용약관 동의'],
              ['privacy', '[필수] 개인정보 수집 및 이용 동의'],
              ['marketing', '[선택] 마케팅 정보 수신 동의'],
            ].map(([key, label]) => (
              <label key={key} className="flex h-[58px] items-center justify-between border-b border-[#e4e9ed] text-[16px] font-bold">
                <span className="flex items-center gap-4"><input type="checkbox" checked={agreements[key]} onChange={(e) => setAgreements({ ...agreements, [key]: e.target.checked })} className="h-6 w-6 accent-[#08CB00]" />{label}</span>
                <span className="flex items-center gap-2 text-[#6c7781]">가입 후 관리 가능 <ChevronRight size={18} /></span>
              </label>
            ))}
            {error && <div className="rounded-lg border border-[#ffb9b9] bg-[#fff1f1] p-3 text-sm font-black text-[#e02929]">{error}</div>}
            <button type="button" onClick={submitSignup} disabled={loading || !agreements.terms || !agreements.privacy} className="h-13 w-full rounded-lg bg-[#05b700] text-lg font-black text-white disabled:opacity-50">{loading ? '처리 중...' : '다음'}</button>
            <button type="button" onClick={() => setStep(1)} className="h-13 w-full rounded-lg border border-[#cfd8df] text-lg font-black">이전으로</button>
          </div>
        )}
        <p className="mt-7 text-center text-sm text-[#6c7781]">이미 계정이 있으신가요? <Link to="/auth/login" className="font-black text-[#009900]">로그인</Link></p>
      </AuthCard>
    </AuthFrame>
  );
}

export function VerifyEmailPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const email = params.get('email') || localStorage.getItem('careerzip_pending_signup_email') || 'user@example.com';
  const [digits, setDigits] = useState(Array(6).fill(''));
  const [left, setLeft] = useState(300);
  const [cooldown, setCooldown] = useState(0);
  const [error, setError] = useState('');
  const inputs = useRef([]);
  useEffect(() => {
    const id = setInterval(() => { setLeft((v) => Math.max(0, v - 1)); setCooldown((v) => Math.max(0, v - 1)); }, 1000);
    return () => clearInterval(id);
  }, []);
  function setDigit(i, value) {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length > 1) {
      const next = cleaned.slice(0, 6).split('');
      setDigits(Array.from({ length: 6 }, (_, idx) => next[idx] || ''));
      inputs.current[Math.min(cleaned.length, 5)]?.focus();
      return;
    }
    const next = [...digits]; next[i] = cleaned; setDigits(next);
    if (cleaned && i < 5) inputs.current[i + 1]?.focus();
  }
  async function submit() {
    setError('');
    try {
      await verifyCode({ email, code: digits.join('') });
      localStorage.removeItem('careerzip_pending_signup_email');
      navigate('/auth/signup/complete');
    } catch {
      setError('인증번호가 올바르지 않거나 만료되었습니다.');
    }
  }
  async function resend() {
    try {
      const res = await resendVerification(email);
      setCooldown(res.data?.resend_after || 60);
      setLeft(res.data?.expires_in || 300);
    } catch {
      setError('인증번호 재전송에 실패했습니다.');
    }
  }
  return (
    <AuthFrame>
      <AuthCard title="이메일 인증" sub="가입한 이메일로 전송된 6자리 인증번호를 입력해주세요" width="max-w-[620px]">
        <StepDots current={3} labels />
        <div className="text-center text-[17px] font-bold text-[#6c7781]"><Mail className="mr-2 inline" size={20} />{email} <span className="ml-2 text-[#009900]">으로 발송됨</span></div>
        <div className="mt-9 flex justify-center gap-5">
          {digits.map((d, i) => (
            <input key={i} ref={(el) => { inputs.current[i] = el; }} value={d} onChange={(e) => setDigit(i, e.target.value)} onKeyDown={(e) => { if (e.key === 'Backspace' && !digits[i] && i > 0) inputs.current[i - 1]?.focus(); }} inputMode="numeric" className="h-[70px] w-[70px] rounded-lg border border-[#cfd8df] text-center text-3xl font-black outline-none focus:border-[#009900] focus:ring-4 focus:ring-[#08CB00]/15" />
          ))}
        </div>
        <div className="mt-9 flex items-center justify-between text-[16px] font-bold">
          <span>남은 시간 <b className="text-[#009900]">{String(Math.floor(left / 60)).padStart(2, '0')}:{String(left % 60).padStart(2, '0')}</b></span>
          <button type="button" disabled={cooldown > 0} onClick={resend} className="text-[#4c5a65] disabled:opacity-45">인증번호 재전송{cooldown > 0 ? ` (${cooldown}s)` : ''}</button>
        </div>
        {error && <div className="mt-5 rounded-lg border border-[#ffb9b9] bg-[#fff1f1] p-3 text-sm font-black text-[#e02929]">{error}</div>}
        <button type="button" onClick={submit} disabled={digits.join('').length !== 6} className="mt-8 h-14 w-full rounded-lg bg-[#05b700] text-lg font-black text-white disabled:opacity-50">인증 완료</button>
        <p className="mt-6 text-center text-sm font-medium text-[#7b8791]">이메일을 받지 못하셨나요? 스팸함을 확인하거나 인증번호를 재전송해주세요.</p>
      </AuthCard>
    </AuthFrame>
  );
}

export function SignupCompletePage() {
  return (
    <AuthFrame>
      <AuthCard title="회원가입 완료" sub="이제 Career.zip에서 나만의 면접 준비를 시작해보세요." width="max-w-[600px]">
        <div className="relative mx-auto mb-8 flex h-[126px] w-[220px] items-center justify-center">
          {[...Array(14)].map((_, i) => <span key={i} className="absolute h-3 w-3 rounded-sm bg-[#08CB00]" style={{ transform: `rotate(${i * 28}deg) translateY(-54px)`, opacity: i % 3 === 0 ? .35 : .9 }} />)}
          <span className="flex h-22 w-22 items-center justify-center rounded-full bg-[#05b700] text-white shadow-[0_18px_30px_rgba(8,203,0,.26)]"><Check size={52} /></span>
        </div>
        <div className="rounded-lg border border-[#b9eab6] bg-[#f0fff0] p-4 text-center text-[16px] font-black text-[#009900]"><Mail className="mr-2 inline" />이메일 인증이 완료되었습니다.</div>
        <Link to="/input/onboarding/1" className="mt-8 flex h-14 items-center justify-center rounded-lg bg-[#05b700] text-lg font-black text-white">프로필 입력 시작하기</Link>
        <div className="mt-6 text-center"><Link to="/" className="text-[16px] font-black text-[#64717d] underline">홈으로 이동</Link></div>
      </AuthCard>
    </AuthFrame>
  );
}

function OnboardingHeader({ current }) {
  return (
    <header className="h-[88px] bg-white">
      <div className="mx-auto flex h-[58px] max-w-[1440px] items-center justify-between px-8">
        <BrandLogo />
        <nav className="hidden gap-12 text-xs font-black lg:flex">{['서비스 소개', '기능', '면접 연습', '요금제', '이용 방법'].map((n) => <span key={n}>{n}</span>)}</nav>
        <Bell size={18} />
      </div>
      <div className="mx-auto flex max-w-[1060px] items-center justify-center gap-2">
        {['사용자 유형', '기본 프로필', '외부 링크', '면접 목표', '입력 요약'].map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <span className={cx('flex h-8 w-8 items-center justify-center rounded-full text-xs font-black', current === i + 1 ? 'bg-[#009900] text-white' : 'bg-[#f2f5f7] text-[#7b8791]')}>{i + 1}</span>
            <span className={cx('text-xs font-black', current === i + 1 ? 'text-[#009900]' : 'text-[#7b8791]')}>{s}</span>
            {i < 4 && <span className="h-px w-20 bg-[#dfe5ea]" />}
          </div>
        ))}
      </div>
    </header>
  );
}

export function OnboardingPage() {
  const navigate = useNavigate();
  const { step = '1' } = useParams();
  const current = Math.max(1, Math.min(12, Number(step)));
  const [selectedType, setSelectedType] = useState(0);
  const [mode, setMode] = useState('text');
  const [fileName, setFileName] = useState('');
  const titles = {
    1: ['나에게 맞는 면접 유형을 찾아요', '사용자 유형에 따라 추천 면접과 학습 방법이 달라집니다.'],
    2: ['기본 프로필을 입력해요', '면접 맞춤 추천과 피드백에 필요한 기본 정보를 입력해주세요.'],
    3: ['외부 링크를 연결해요', '선택 사항이에요. 나만의 추가 정보를 공유해주세요.'],
    4: ['면접 목표를 설정해요', '목표에 맞는 키워드와 질문을 추천해드려요.'],
    5: ['입력 내용을 확인해요', '시작하기 전에 입력 내용을 확인해주세요.'],
    6: ['JD(채용공고)를 추가해요', '지원할 회사의 JD 정보를 입력해주세요.'],
    7: ['JD 내용을 입력해주세요', '함께한 분석을 위해 실제 내용을 넣어주세요.'],
    8: ['JD 파일을 업로드해주세요', 'PDF, DOCX 파일을 업로드하면 내용을 자동으로 추출해요.'],
    9: ['이력서를 추가해요', 'AI가 이력서를 분석하여 맞춤 질문을 생성해요.'],
    10: ['이력서를 업로드해주세요', 'PDF 파일을 업로드하면 자동으로 분석해요.'],
    11: ['자기소개서 및 프로젝트를 입력해요', '면접에서 자주 묻는 경험 질문을 더 정확하게 만들어요.'],
    12: ['입력이 완료되었습니다!', '이제 맞춤 면접을 시작할 수 있어요.'],
  }[current];
  return (
    <main className="min-h-screen bg-[#f8fafb] text-black">
      <OnboardingHeader current={Math.min(5, Math.ceil(current / 3))} />
      <section className="mx-auto mt-16 max-w-[920px] rounded-xl border border-[#dfe5ea] bg-white px-10 py-9 shadow-[0_14px_40px_rgba(0,0,0,.05)]">
        <h1 className="text-center text-[26px] font-black">{titles[0]}</h1>
        <p className="mt-3 text-center text-sm font-medium text-[#64717d]">{titles[1]}</p>
        <div className="mt-10">{renderOnboardingBody(current, { selectedType, setSelectedType, mode, setMode, fileName, setFileName })}</div>
        <div className="mt-10 flex justify-between">
          <button onClick={() => navigate(`/input/onboarding/${Math.max(1, current - 1)}`)} className="h-10 rounded-md border border-[#cfd8df] px-7 font-black">이전</button>
          {current === 12 ? <Link to="/interview/setup" className="flex h-10 min-w-[240px] items-center justify-center rounded-md bg-[#05b700] px-7 font-black text-white">면접 연습 시작하기</Link> : <button onClick={() => navigate(current === 7 ? '/input/jd/temp/talent-profile' : `/input/onboarding/${current + 1}`)} className="h-10 rounded-md bg-[#05b700] px-8 font-black text-white">다음</button>}
        </div>
      </section>
    </main>
  );
}

function renderOnboardingBody(current, state) {
  if (current === 1) return <div className="grid grid-cols-2 gap-5">{['비전공 신입', '전공 신입', '비전공 경력직', '직무 전환자'].map((title, i) => <button key={title} onClick={() => state.setSelectedType(i)} className={cx('relative rounded-lg border p-6 text-left', state.selectedType === i ? 'border-[#08CB00] bg-[#f4fff4]' : 'border-[#dfe5ea]')}><User className="mb-3 text-[#7b8791]" /><b>{title}</b><p className="mt-3 text-sm text-[#64717d]">추천 학습 · CS, 기술 면접 학습<br />추천 면접 · 직무 맞춤 질문</p>{state.selectedType === i && <Check className="absolute right-4 top-4 text-[#009900]" />}</button>)}</div>;
  if (current === 2) return <div className="grid grid-cols-2 gap-5">{['이름', '이메일', '현재 직무', '경력 연차', '연락처', '기술 스택 Tag Input'].map((label) => <TextInput key={label} label={label} placeholder={label} />)}</div>;
  if (current === 3) return <div className="space-y-5">{['GitHub URL', 'Blog URL', 'Notion URL', 'Portfolio URL'].map((label) => <TextInput key={label} label={label} placeholder={`https://${label.toLowerCase().replaceAll(' ', '-')}`} />)}</div>;
  if (current === 4) return <div className="space-y-6"><div className="flex flex-wrap gap-3">{['백엔드 면접', '비전공자 입문 면접', 'CS 기초 보강', '프로젝트 Deep Dive', '종합 면접 연습'].map((tag) => <span key={tag} className="rounded-full border border-[#b9eab6] px-4 py-2 text-sm font-black text-[#009900]">{tag}</span>)}</div><div className="grid grid-cols-2 gap-5"><TextInput label="지원 희망 회사" placeholder="카카오, 네이버, 토스" /><TextInput label="목표 면접 일정" type="date" /></div><textarea className="h-28 w-full rounded-lg border border-[#cfd8df] p-4" placeholder="가장 강화하고 싶은 역량" /></div>;
  if (current === 5) return <table className="w-full border-collapse text-sm"><tbody>{['사용자 유형', '현재 직무', '경력 연차', '이메일', '기술 스택', '면접 목표'].map((r) => <tr key={r}><th className="w-40 border border-[#dfe5ea] bg-[#f8fafb] p-3 text-left">{r}</th><td className="border border-[#dfe5ea] p-3">입력한 값 확인</td></tr>)}</tbody></table>;
  if (current === 6 || current === 9) return <ChoiceGrid value={state.mode} setValue={state.setMode} choices={current === 6 ? [['text', '텍스트 직접 입력', FileText], ['file', '파일 업로드', CloudUpload]] : [['file', '파일 직접 업로드', CloudUpload], ['text', '텍스트 직접 입력', FileText]]} />;
  if (current === 7) return <div className="space-y-5"><TextInput label="JD 제목 (선택)" placeholder="백엔드 개발자 채용 (신입)" /><textarea className="h-72 w-full rounded-lg border border-[#cfd8df] p-4" placeholder={'담당업무\n- 사용자 API 개발 및 서비스 운영\n자격요건\n- Spring 또는 Django 경험'} /><p className="text-right text-xs text-[#64717d]">366 / 5000</p></div>;
  if (current === 8 || current === 10) return <UploadBox fileName={state.fileName || (current === 10 ? 'kimsoyun_resume_v3.pdf' : '')} setFileName={state.setFileName} accept={current === 10 ? '.pdf' : '.pdf,.docx'} />;
  if (current === 11) return <div className="space-y-6">{['자기소개서 (선택)', '프로젝트 경험 (선택)'].map((label) => <label key={label} className="block"><span className="mb-2 block text-sm font-black">{label}</span><textarea className="h-28 w-full rounded-lg border border-[#cfd8df] p-4" /><p className="mt-1 text-right text-xs text-[#64717d]">0 / 3000</p></label>)}</div>;
  return <div className="text-center"><div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-[#eaffea] text-[#009900]"><Check size={54} /></div><div className="mx-auto mt-8 w-60 rounded-lg border border-[#dfe5ea] p-4 text-left text-sm font-bold">{['JD (1개)', '이력서', '자기소개서 (선택)', '프로젝트 (선택)'].map((x) => <p key={x} className="py-1"><Check className="mr-2 inline text-[#009900]" size={15} />{x}</p>)}</div></div>;
}

function ChoiceGrid({ value, setValue, choices }) {
  return <div className="grid grid-cols-2 gap-6">{choices.map(([id, label, Icon]) => <button key={id} onClick={() => setValue(id)} className={cx('relative flex h-36 flex-col items-center justify-center rounded-lg border font-black', value === id ? 'border-[#08CB00] bg-[#f4fff4]' : 'border-[#dfe5ea]')}><Icon size={40} className="mb-4 text-[#009900]" />{label}{value === id && <Check className="absolute right-4 top-4 text-[#009900]" />}</button>)}</div>;
}

function UploadBox({ fileName, setFileName, accept }) {
  return (
    <div>
      <label className="flex h-44 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-[#cfd8df] text-center font-black">
        <CloudUpload size={42} className="mb-4" />파일을 드래그하거나 클릭하여 업로드하세요
        <span className="mt-2 text-xs text-[#64717d]">PDF, DOCX (최대 10MB)</span>
        <input hidden type="file" accept={accept} onChange={(e) => setFileName(e.target.files?.[0]?.name || '')} />
      </label>
      {fileName && <div className="mt-5 flex h-12 items-center justify-between rounded-lg border border-[#dfe5ea] px-4 text-sm font-bold"><span><FileText className="mr-2 inline" size={18} />{fileName}</span><button onClick={() => setFileName('')}>×</button></div>}
    </div>
  );
}

function normalizeCatalog(data) {
  const categories = data?.categories || data?.results || data || [];
  return Array.isArray(categories) ? categories.map((cat) => ({
    ...cat,
    category_code: cat.category_code || cat.code || cat.id,
    category_name: cat.category_name || cat.name,
    traits: cat.traits || cat.items || [],
  })) : [];
}

export function TalentProfilePage() {
  const navigate = useNavigate();
  const { jdId = localStorage.getItem('careerzip_selected_jd_id') || 'temp' } = useParams();
  const [catalog, setCatalog] = useState([]);
  const [activeCat, setActiveCat] = useState('');
  const [selected, setSelected] = useState([]);
  const [summary, setSummary] = useState('');
  const [state, setState] = useState({ loading: true, saving: false, error: '', toast: '' });
  async function load() {
    setState((s) => ({ ...s, loading: true, error: '' }));
    try {
      const [catalogData, profileData] = await Promise.all([getTalentProfileCatalog(), jdId !== 'temp' ? getJdTalentProfile(jdId) : Promise.resolve(null)]);
      const cats = normalizeCatalog(catalogData);
      setCatalog(cats);
      setActiveCat(cats[0]?.category_code || '');
      setSelected(initializeSelectedItems(profileData));
      setSummary(profileData?.custom_summary || '');
    } catch {
      setState((s) => ({ ...s, error: '인재상 기준을 불러오지 못했습니다. 네트워크 또는 접근 권한을 확인해주세요.' }));
    } finally {
      setState((s) => ({ ...s, loading: false }));
    }
  }
  useEffect(() => { load(); }, [jdId]);
  const active = catalog.find((c) => c.category_code === activeCat) || catalog[0] || {};
  async function save(confirmed) {
    if (selected.length < 1) return setState((s) => ({ ...s, error: '최소 1개 이상의 인재상 기준을 선택해주세요.' }));
    setState((s) => ({ ...s, saving: true, error: '', toast: '' }));
    try {
      const payload = buildTalentProfilePayload({ customSummary: summary, confirmedByUser: confirmed, selectedItems: selected });
      if (jdId !== 'temp') {
        await saveJdTalentProfile(jdId, payload);
        const restored = await getJdTalentProfile(jdId);
        setSelected(initializeSelectedItems(restored));
        setSummary(restored?.custom_summary || '');
      }
      setState((s) => ({ ...s, toast: confirmed ? '선택이 완료되었습니다.' : '임시 저장되었습니다.' }));
      if (confirmed) navigate('/input/onboarding/9');
    } catch {
      setState((s) => ({ ...s, error: '저장에 실패했습니다. 선택 항목과 접근 권한을 확인한 뒤 다시 시도해주세요.' }));
    } finally {
      setState((s) => ({ ...s, saving: false }));
    }
  }
  if (state.loading) return <main className="flex min-h-screen items-center justify-center bg-[#f8fafb] font-black">Catalog Loading...</main>;
  return (
    <main className="min-h-screen bg-[#f8fafb] text-black">
      <OnboardingHeader current={3} />
      <section className="mx-auto max-w-[1180px] px-8 py-10">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h1 className="text-[32px] font-black">면접 연습에 반영할 인재상 기준을 선택해주세요</h1>
            <p className="mt-3 max-w-[720px] text-sm font-bold text-[#64717d]">회사의 공식 인재상이 아닌, 사용자가 면접 연습을 위해 직접 설정한 인재상 기준입니다.</p>
          </div>
          <div className="text-right"><p className="text-2xl font-black text-[#009900]">{selected.length} / 5</p><p className="text-sm font-bold text-[#64717d]">권장 선택 수 3개</p></div>
        </div>
        {state.error && <div className="mb-5 flex items-center justify-between rounded-lg border border-[#ffb9b9] bg-[#fff1f1] p-4 font-black text-[#e02929]">{state.error}<button onClick={load} className="rounded-md border border-[#e02929] px-3 py-1">Retry</button></div>}
        {state.toast && <div className="mb-5 rounded-lg border border-[#b9eab6] bg-[#f0fff0] p-4 font-black text-[#009900]">{state.toast}</div>}
        <div className="grid grid-cols-[330px_1fr] gap-6">
          <aside className="rounded-xl border border-[#dfe5ea] bg-white p-5">
            <h2 className="mb-4 font-black">상위 인재상 영역</h2>
            <div className="space-y-2">{catalog.map((cat) => <button key={cat.category_code} onClick={() => setActiveCat(cat.category_code)} className={cx('flex h-13 w-full items-center justify-between rounded-lg border px-4 font-black', activeCat === cat.category_code ? 'border-[#08CB00] bg-[#f4fff4] text-[#009900]' : 'border-[#e5eaee]')}><span>{cat.category_name}</span><ChevronRight size={18} /></button>)}</div>
          </aside>
          <section className="rounded-xl border border-[#dfe5ea] bg-white p-5">
            <h2 className="font-black">{active.category_name || '세부 인재상'}</h2>
            <div className="mt-5 grid grid-cols-2 gap-4">
              {(active.traits || []).map((trait) => {
                const code = trait.trait_code || trait.code;
                const selectedNow = isTraitSelected(selected, code);
                const normalized = { ...trait, trait_code: code, trait_name: trait.trait_name || trait.name, category_code: active.category_code, category_name: active.category_name };
                return (
                  <Tooltip key={code} text={trait.short_description || trait.description}>
                    <button onClick={() => setSelected(selectedNow ? removeTraitSelection(selected, code) : addTraitSelection(selected, normalized))} className={cx('min-h-[116px] rounded-lg border p-5 text-left focus:outline-none focus:ring-4 focus:ring-[#08CB00]/20', selectedNow ? 'border-[#08CB00] bg-[#f4fff4]' : 'border-[#dfe5ea]')}>
                      <span className="flex items-center gap-3 text-lg font-black"><span className={cx('flex h-6 w-6 items-center justify-center rounded border', selectedNow ? 'border-[#08CB00] bg-[#08CB00] text-white' : 'border-[#ccd4db]')}>{selectedNow && <Check size={16} />}</span>{normalized.trait_name}</span>
                      <p className="mt-3 text-sm font-medium leading-6 text-[#64717d]">{trait.short_description || trait.description || '면접 답변 기준으로 활용할 수 있는 세부 역량입니다.'}</p>
                    </button>
                  </Tooltip>
                );
              })}
            </div>
          </section>
        </div>
        <section className="mt-6 rounded-xl border border-[#dfe5ea] bg-white p-5">
          <h2 className="font-black">선택된 인재상 우선순위</h2>
          <div className="mt-4 grid gap-3">
            {selected.length === 0 ? <p className="rounded-lg border border-dashed border-[#cfd8df] p-5 text-sm font-bold text-[#64717d]">아직 선택된 기준이 없습니다.</p> : selected.map((item, idx) => (
              <div key={item.trait_code} className="grid grid-cols-[90px_1fr_240px] items-center gap-4 rounded-lg border border-[#dfe5ea] p-4">
                <b>{idx + 1}순위</b>
                <div><b>{item.trait_name}</b><input value={item.custom_description || ''} maxLength={500} onChange={(e) => setSelected(updateTraitDescription(selected, item.trait_code, e.target.value))} placeholder="사용자 정의 설명 (최대 500자)" className="mt-2 h-10 w-full rounded-md border border-[#cfd8df] px-3 outline-none focus:border-[#009900]" /></div>
                <div className="flex justify-end gap-2">
                  <button aria-label="위로 이동" onClick={() => setSelected(moveTraitSelection(selected, item.trait_code, 'up'))} className="rounded-md border p-2"><MoveUp size={18} /></button>
                  <button aria-label="아래로 이동" onClick={() => setSelected(moveTraitSelection(selected, item.trait_code, 'down'))} className="rounded-md border p-2"><MoveDown size={18} /></button>
                  <button onClick={() => setSelected(removeTraitSelection(selected, item.trait_code))} className="rounded-md border px-3 font-black">삭제</button>
                </div>
              </div>
            ))}
          </div>
          <label className="mt-5 block"><span className="mb-2 block text-sm font-black">전체 요약 입력</span><textarea value={summary} onChange={(e) => setSummary(e.target.value)} className="h-24 w-full rounded-lg border border-[#cfd8df] p-4 outline-none focus:border-[#009900]" /></label>
        </section>
        <div className="mt-8 flex justify-between">
          <button onClick={() => navigate(-1)} className="h-12 rounded-lg border border-[#cfd8df] px-8 font-black">이전</button>
          <div className="flex gap-3">
            <button disabled={state.saving} onClick={() => save(false)} className="h-12 rounded-lg border border-[#009900] px-8 font-black text-[#009900]">임시 저장</button>
            <button disabled={state.saving} onClick={() => save(true)} className="h-12 rounded-lg bg-[#05b700] px-8 font-black text-white">선택 완료하고 다음</button>
          </div>
        </div>
      </section>
    </main>
  );
}

function MypageHeader({ user, points, onLogout }) {
  const pointLabel = points?.point_balance != null ? `${Number(points.point_balance).toLocaleString('ko-KR')} 코인` : '코인 정보 없음';
  const name = user?.name || user?.email || '사용자';
  return (
    <header className="h-[64px] border-b border-[#e5e8eb] bg-white">
      <div className="mx-auto flex h-full max-w-[1580px] items-center justify-between px-8">
        <BrandLogo />
        <nav className="flex h-full items-center gap-16 text-[17px] font-black">
          {[
            ['대시보드', '/dashboard'],
            ['리포트', '/report/latest'],
            ['마이페이지', '/mypage'],
          ].map(([label, to]) => <Link key={label} to={to} className={label === '마이페이지' ? 'flex h-full items-center border-b-4 border-[#08CB00] text-[#009900]' : ''}>{label}</Link>)}
        </nav>
        <div className="flex items-center gap-6 text-sm font-black">
          <Link to="/mypage/profile-settings" className="inline-flex items-center gap-2"><Settings />설정</Link>
          <Bell aria-hidden="true" />
          <span className="rounded-lg border border-[#e5e8eb] px-4 py-2">코인 {pointLabel}</span>
          <span>{name} 님</span>
          <button type="button" onClick={onLogout} className="rounded-lg border border-[#dfe5ea] px-4 py-2 text-[#4c5a65]">로그아웃</button>
        </div>
      </div>
    </header>
  );
}

const tabs = [['hub', '허브', Home], ['growth', '나의 성장', LineChart], ['points', '보상 · 코인', CircleDollarSign], ['records', '면접 기록', Mic], ['settings', '프로필 · 설정', User]];

export function MypagePage({ tab = 'hub' }) {
  const navigate = useNavigate();
  const resetAuth = useAuthStore((s) => s.reset);
  const [user, setUser] = useState(null);
  const [summary, setSummary] = useState(null);
  const [history, setHistory] = useState([]);
  const [points, setPoints] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [meRes, summaryRes, historyRes, pointsRes] = await Promise.allSettled([
        getMe(),
        mypageApi.getSummary(),
        mypageApi.getInterviewHistory(),
        mypageApi.getPointBalance(),
      ]);
      if (meRes.status === 'fulfilled') setUser(meRes.value.data);
      if (summaryRes.status === 'fulfilled') setSummary(summaryRes.value);
      if (historyRes.status === 'fulfilled') setHistory(historyRes.value?.results || []);
      if (pointsRes.status === 'fulfilled') setPoints(pointsRes.value);
      if ([summaryRes, historyRes, pointsRes].every((r) => r.status === 'rejected')) setError('마이페이지 데이터를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);
  const handleLogout = async () => {
    try {
      await logoutApi();
    } finally {
      resetAuth();
      navigate('/auth/login', { replace: true });
    }
  };
  const displayName = user?.name || user?.email || '사용자';
  const title = { hub: `${displayName} 님의 마이페이지`, growth: '나의 성장', points: '보상 · 코인', records: '면접 기록', settings: '프로필 · 설정' }[tab];
  return (
    <main className="min-h-screen bg-white text-black">
      <MypageHeader user={user} points={points} onLogout={handleLogout} />
      <section className="relative mx-auto max-w-[1510px] px-8 pb-8 pt-8">
        <h1 className="relative z-10 text-[40px] font-black">{title}</h1>
        <p className="relative z-10 mt-3 text-[17px] font-medium text-[#4f5c66]">성장 현황과 보상, 면접 기록, 프로필 정보를 한눈에 확인하세요.</p>
        <div className="relative z-10 mt-8 grid grid-cols-5 gap-3">
          {tabs.map(([id, label, Icon]) => <Link key={id} to={id === 'hub' ? '/mypage' : `/mypage/${id === 'records' ? 'interviews' : id === 'settings' ? 'profile-settings' : id}` } className={cx('flex h-[56px] items-center justify-center gap-3 rounded-lg border text-lg font-black', tab === id ? 'border-[#08CB00] bg-[#f6fff6] text-[#009900]' : 'border-[#dfe5ea]')}><Icon size={24} />{label}</Link>)}
        </div>
        {loading && <StatePanel title="Loading" message="마이페이지 데이터를 불러오는 중입니다." />}
        {error && <StatePanel title="Error" message={error} action={load} />}
        {!loading && !error && tab === 'hub' && <HubContent summary={summary} history={history} points={points} />}
        {!loading && !error && tab === 'growth' && <GrowthContent summary={summary} />}
        {!loading && !error && tab === 'points' && <PointsContent points={points} />}
        {!loading && !error && tab === 'records' && <RecordsContent history={history} />}
        {!loading && !error && tab === 'settings' && <SettingsContent user={user} summary={summary} />}
      </section>
    </main>
  );
}

function Panel({ title, children, className = '' }) {
  return <section className={cx('rounded-xl border border-[#dfe5ea] bg-white p-5 shadow-[0_8px_24px_rgba(0,0,0,.03)]', className)}>{title && <h2 className="mb-4 text-xl font-black">{title}</h2>}{children}</section>;
}
function StatePanel({ title, message, action }) {
  return <Panel className="mt-6 text-center"><p className="text-xl font-black">{title}</p><p className="mt-2 text-sm font-bold text-[#64717d]">{message}</p>{action && <button onClick={action} className="mt-4 rounded-lg border border-[#08CB00] px-5 py-2 font-black text-[#009900]">Retry</button>}</Panel>;
}
function Stat({ icon: Icon, label, value }) { return <div className="rounded-xl border border-[#dfe5ea] p-5"><Icon className="mb-2 text-[#009900]" size={34} /><p className="text-sm font-bold">{label}</p><b className="text-[30px]">{value ?? '데이터 없음'}</b></div>; }
function MiniChart({ scores = [] }) {
  if (scores.length < 2) return <StatePanel title="Empty" message="성장 추이를 표시할 리포트 점수가 부족합니다." />;
  const points = scores.slice(-5).map((v, i) => [20 + i * 70, 130 - Math.max(0, Math.min(100, Number(v)))]);
  return <svg viewBox="0 0 360 150" className="h-[150px] w-full"><polyline points={points.map(([x,y]) => `${x},${y}`).join(' ')} fill="none" stroke={GREEN} strokeWidth="4"/>{points.map(([x,y], i)=><g key={x}><circle cx={x} cy={y} r="6" fill={GREEN}/><text x={x-10} y={y-14} fontSize="14" fontWeight="800">{scores.slice(-5)[i]}</text></g>)}</svg>;
}
function HubContent({ summary, history, points }) {
  return <div className="mt-6 grid gap-5"><div className="grid grid-cols-4 gap-5"><Panel title="나의 성장"><MiniChart scores={summary?.recent_scores || []} /><Link className="mt-4 flex h-12 items-center justify-center rounded-lg border border-[#08CB00] font-black text-[#009900]" to="/mypage/growth">나의 성장 바로가기</Link></Panel><Panel title="보상 · 코인"><b className="text-[36px]">{points?.point_balance ?? '데이터 없음'}</b><p>보유 코인</p><Link className="mt-8 flex h-12 items-center justify-center rounded-lg border border-[#08CB00] font-black text-[#009900]" to="/mypage/points">보상 · 코인 바로가기</Link></Panel><Panel title="면접 기록">{history.length ? history.slice(0,3).map((x)=><p key={x.session_id || x.id} className="border-b py-2 font-bold">{x.interview_type || '면접'}<span className="float-right rounded bg-[#e8f9e8] px-3 py-1 text-[#009900]">{x.status || '상태 없음'}</span></p>) : <StatePanel title="Empty" message="면접 기록이 없습니다." />}<Link className="mt-4 flex h-12 items-center justify-center rounded-lg border border-[#08CB00] font-black text-[#009900]" to="/mypage/interviews">면접 기록 바로가기</Link></Panel><Panel title="프로필 · 설정"><Stat icon={User} label="프로필 완성도" value={summary?.profile_completion != null ? `${summary.profile_completion}%` : null} /><Link className="mt-4 flex h-12 items-center justify-center rounded-lg border border-[#08CB00] font-black text-[#009900]" to="/mypage/profile-settings">프로필 · 설정 바로가기</Link></Panel></div></div>;
}
function GrowthContent({ summary }) { return <div className="mt-6 grid gap-5"><Panel title="나의 성장 여정"><MiniChart scores={summary?.recent_scores || []} /></Panel><div className="grid grid-cols-4 gap-5"><Stat icon={CalendarCheck} label="연속 출석" value={summary?.attendance_streak != null ? `${summary.attendance_streak}일` : null} /><Stat icon={Check} label="이번 주 미션" value={summary?.weekly_mission_status || null} /><Stat icon={LineChart} label="다음 레벨까지" value={summary?.next_level_progress != null ? `${summary.next_level_progress}%` : null} /><Stat icon={CircleDollarSign} label="오늘 획득 가능" value={summary?.today_available_points != null ? `+${summary.today_available_points} 코인` : null} /></div></div>; }
function PointsContent({ points }) { return <div className="mt-6 grid gap-5"><Panel title="보유 코인"><b className="text-[58px]">{points?.point_balance ?? '데이터 없음'}</b><span className="ml-2 font-black">코인</span></Panel><StatePanel title="Empty" message="프리미엄 기능과 미션 데이터는 API 응답이 제공되면 표시됩니다." /></div>; }
function RecordsContent({ history }) {
  const completedCount = history.filter((h) => String(h.status || '').includes('완료')).length;
  const averageScore = history.length ? Math.round(history.reduce((sum, h) => sum + Number(h.overall_score || 0), 0) / history.length) : null;
  return (
    <div className="mt-6 grid gap-5">
      <div className="grid grid-cols-5 gap-5">
        <Stat icon={CalendarCheck} label="총 면접 수" value={history.length ? `${history.length}회` : null} />
        <Stat icon={Check} label="완료 면접" value={history.length ? `${completedCount}회` : null} />
        <Stat icon={LineChart} label="평균 점수" value={averageScore != null ? `${averageScore}점` : null} />
        <Stat icon={MoveUp} label="최근 상승" value={null} />
        <Stat icon={FileText} label="최근 리포트 열람" value={null} />
      </div>
      <Panel title="최근 면접 기록">
        {history.length ? (
          <table className="w-full text-left">
            <thead>
              <tr className="border-b bg-[#f8fafb]"><th className="p-3">날짜</th><th>면접 유형</th><th>상태</th><th>점수</th><th>동작</th></tr>
            </thead>
            <tbody>
              {history.map((r, i) => {
                const sessionId = r.session_id || r.id;
                const canReport = Boolean(sessionId && String(r.status || '').includes('완료'));
                return (
                  <tr className="border-b" key={sessionId || i}>
                    <td className="p-4">{r.created_at || '-'}</td>
                    <td className="font-bold">{r.interview_type || '-'}</td>
                    <td><span className="rounded bg-[#e8f9e8] px-3 py-1 text-[#009900]">{r.status || '-'}</span></td>
                    <td className="font-black">{r.overall_score ?? '-'}</td>
                    <td>
                      <div className="flex gap-2">
                        {canReport ? (
                          <Link to={`/report/${sessionId}`} className="rounded border border-[#08CB00] px-4 py-2 font-black text-[#009900]">리포트 보기</Link>
                        ) : (
                          <button type="button" disabled title="완료된 면접과 session_id가 있어야 리포트를 열 수 있습니다." className="rounded border border-[#cfd8df] px-4 py-2 font-black text-[#7b8791] opacity-60">리포트 없음</button>
                        )}
                        {sessionId && !canReport ? (
                          <Link to="/interview/question" state={{ sessionId }} className="rounded border border-[#cfd8df] px-4 py-2 font-black text-[#4c5a65]">이어하기</Link>
                        ) : (
                          <button type="button" disabled title="이어갈 진행 중 면접이 없습니다." className="rounded border border-[#cfd8df] px-4 py-2 font-black text-[#7b8791] opacity-60">이어하기</button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : <StatePanel title="Empty" message="면접 기록이 없습니다." />}
      </Panel>
    </div>
  );
}
function SettingsContent({ user, summary }) {
  const editableSections = [
    ['기본 정보', '/profile'],
    ['희망 직무', '/profile'],
    ['기술 스택', '/profile'],
    ['이력서 · 자소서 관리', '/input/documents'],
    ['프로젝트 경험', '/input/cover-letter-project'],
  ];
  return (
    <div className="mt-6 grid gap-5">
      <Panel>
        <div className="flex items-center gap-8">
          <div className="flex h-28 w-28 items-center justify-center rounded-full bg-[#08CB00] text-5xl font-black text-white">{(user?.name || user?.email || '사').slice(0,1)}</div>
          <div><h2 className="text-2xl font-black">{user?.name || '사용자'}</h2><p className="mt-2">{user?.email || '이메일 정보 없음'}</p></div>
        </div>
        <div className="mt-8 grid grid-cols-[1fr_2fr_120px] border-t pt-4"><b>최근 로그인<br/>{user?.last_login || '데이터 없음'}</b><div><p>프로필 완성도</p><div className="mt-2 h-3 rounded bg-[#dfe5ea]"><span className="block h-3 rounded bg-[#08CB00]" style={{ width: `${summary?.profile_completion || 0}%` }} /></div></div><b className="text-3xl">{summary?.profile_completion != null ? `${summary.profile_completion}%` : '없음'}</b></div>
      </Panel>
      <Panel title="내 정보 관리">
        <div className="grid grid-cols-2 gap-4">
          {editableSections.map(([label, to]) => (
            <div className="rounded-lg border p-4 font-black" key={label}>
              <User className="mr-3 inline text-[#009900]" />{label}
              <Link to={to} className="float-right rounded border px-4 py-1">수정</Link>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}
